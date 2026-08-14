# Codex Preview Stop Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an idempotent Codex `Stop` action that shuts down only the local preview server registered by the current repository worktree.

**Architecture:** A dependency-free control module stores an authenticated per-worktree runtime record in a private operating-system temporary directory. The preview server exposes one loopback-only, token-protected shutdown endpoint; `npm run stop` reads the record and requests graceful shutdown without killing by PID, port, or command pattern.

**Tech Stack:** Node.js 20+ standard library, Node.js built-in test runner, local HTTP, TOML v1 Codex environment configuration, npm scripts

## Global Constraints

- Stop only the local preview registered for the current canonical worktree.
- Never stop or modify Azure Static Web Apps, GitHub Actions environments, DNS, or production hosting.
- Add no third-party dependencies and keep all runtime state outside the repository.
- Never kill by PID, port, or command pattern; PID checks are observation-only.
- Support the existing `127.0.0.1:4173` default and valid `HOST`/`PORT` overrides.
- Treat a missing managed preview as a successful no-op.
- Refuse malformed, foreign-worktree, or unacknowledged state without forceful escalation.
- Update `.codex/environments/environment.toml` through the Codex environment editor because it is generated.
- Preserve all existing static-site, security, test, and deployment behavior.

---

## File Structure

- `tools/preview-control.mjs`: runtime schema, worktree-keyed paths, private atomic files, token/loopback checks, and observation-only PID liveness.
- `tools/preview-control.test.mjs`: unit tests for that boundary.
- `tools/serve.mjs`: preview registration, authenticated control route, and one graceful shutdown path.
- `tools/serve.test.mjs`: existing routes plus registration and rejected-control tests.
- `tools/stop.mjs`: stop CLI and exported stop function.
- `tools/preview-stop.test.mjs`: real-process lifecycle, custom-port, repeat-stop, and foreign-record tests.
- `tools/environment.test.mjs`: generated Codex action contract.
- `package.json`: `stop` and focused test scripts.
- `.codex/environments/environment.toml`: generated `Run`, `Stop`, `Validate` actions.
- `README.md`: local terminal and Codex action instructions.

---

### Task 1: Private Per-Worktree Runtime Records

**Files:**
- Create: `tools/preview-control.mjs`
- Create: `tools/preview-control.test.mjs`

**Interfaces:**
- Produces: `CONTROL_HEADER`, `CONTROL_ROUTE`, `createControlRecord(options)`, `getControlRecordPath(root, options)`, `readControlRecord(root, options)`, `writeControlRecord(record, options)`, `removeControlRecord(record, options)`, `isProcessAlive(pid)`, `isLoopbackAddress(address)`, and `tokensMatch(actual, expected)`.
- Record: `{ version: 1, root: string, pid: number, host: string, port: number, token: string }`.

- [ ] **Step 1: Write failing record-boundary tests**

Create `tools/preview-control.test.mjs`:

```js
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createControlRecord,
  getControlRecordPath,
  isLoopbackAddress,
  readControlRecord,
  removeControlRecord,
  tokensMatch,
  writeControlRecord,
} from "./preview-control.mjs";

test("runtime records are private and isolated by worktree", async (t) => {
  const controlDir = await mkdtemp(path.join(os.tmpdir(), "preview-control-test-"));
  t.after(() => rm(controlDir, { force: true, recursive: true }));
  const firstRoot = path.join(controlDir, "worktree-a");
  const secondRoot = path.join(controlDir, "worktree-b");
  const record = createControlRecord({
    root: firstRoot,
    pid: process.pid,
    host: "127.0.0.1",
    port: 4173,
    token: "a".repeat(64),
  });

  await writeControlRecord(record, { controlDir });

  assert.deepEqual(await readControlRecord(firstRoot, { controlDir }), record);
  assert.notEqual(
    getControlRecordPath(firstRoot, { controlDir }),
    getControlRecordPath(secondRoot, { controlDir }),
  );
  assert.equal((await stat(getControlRecordPath(firstRoot, { controlDir }))).mode & 0o777, 0o600);
});

test("a foreign-worktree payload is rejected", async (t) => {
  const controlDir = await mkdtemp(path.join(os.tmpdir(), "preview-control-test-"));
  t.after(() => rm(controlDir, { force: true, recursive: true }));
  const root = path.join(controlDir, "expected-root");
  const recordPath = getControlRecordPath(root, { controlDir });
  await writeFile(recordPath, JSON.stringify({
    version: 1,
    root: path.join(controlDir, "foreign-root"),
    pid: process.pid,
    host: "127.0.0.1",
    port: 4173,
    token: "b".repeat(64),
  }));

  await assert.rejects(readControlRecord(root, { controlDir }), /does not belong/);
});

test("record removal requires the creating server identity", async (t) => {
  const controlDir = await mkdtemp(path.join(os.tmpdir(), "preview-control-test-"));
  t.after(() => rm(controlDir, { force: true, recursive: true }));
  const root = path.join(controlDir, "worktree");
  const record = createControlRecord({
    root,
    pid: process.pid,
    host: "127.0.0.1",
    port: 4173,
    token: "c".repeat(64),
  });
  await writeControlRecord(record, { controlDir });

  assert.equal(await removeControlRecord({ ...record, token: "d".repeat(64) }, { controlDir }), false);
  assert.equal(await removeControlRecord(record, { controlDir }), true);
  await assert.rejects(readFile(getControlRecordPath(root, { controlDir })), { code: "ENOENT" });
});

test("authentication accepts only loopback peers and equal tokens", () => {
  assert.equal(isLoopbackAddress("127.0.0.1"), true);
  assert.equal(isLoopbackAddress("::1"), true);
  assert.equal(isLoopbackAddress("::ffff:127.0.0.1"), true);
  assert.equal(isLoopbackAddress("192.0.2.10"), false);
  assert.equal(tokensMatch("a".repeat(64), "a".repeat(64)), true);
  assert.equal(tokensMatch("a".repeat(64), "b".repeat(64)), false);
  assert.equal(tokensMatch("short", "a".repeat(64)), false);
});
```

- [ ] **Step 2: Verify RED**

Run `node --test tools/preview-control.test.mjs`.

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `tools/preview-control.mjs`.

- [ ] **Step 3: Implement the minimal control module**

Create `tools/preview-control.mjs` beginning with:

```js
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const CONTROL_ROUTE = "/__codex/preview/stop";
export const CONTROL_HEADER = "x-preview-control-token";
const RECORD_VERSION = 1;

function defaultControlDir() {
  return process.env.PREVIEW_CONTROL_DIR
    || path.join(os.tmpdir(), "aserdargun-com-preview");
}

export function getControlRecordPath(root, { controlDir = defaultControlDir() } = {}) {
  const key = createHash("sha256").update(root).digest("hex").slice(0, 24);
  return path.join(controlDir, `${key}.json`);
}

export function createControlRecord({
  root,
  pid = process.pid,
  host,
  port,
  token = randomBytes(32).toString("hex"),
}) {
  return { version: RECORD_VERSION, root, pid, host, port, token };
}
```

Import `chmod` with the other filesystem functions, then complete the exports:

```js
function validateRecord(record, expectedRoot) {
  if (!record || record.version !== RECORD_VERSION) {
    throw new Error("Preview control record has an unsupported version");
  }
  if (record.root !== expectedRoot) {
    throw new Error("Preview control record does not belong to this worktree");
  }
  if (!Number.isInteger(record.pid) || record.pid < 1) {
    throw new Error("Preview control record has an invalid PID");
  }
  if (typeof record.host !== "string" || record.host.length === 0) {
    throw new Error("Preview control record has an invalid host");
  }
  if (!Number.isInteger(record.port) || record.port < 1 || record.port > 65535) {
    throw new Error("Preview control record has an invalid port");
  }
  if (typeof record.token !== "string" || !/^[a-f0-9]{64}$/.test(record.token)) {
    throw new Error("Preview control record has an invalid token");
  }
  return record;
}

export async function writeControlRecord(record, options = {}) {
  validateRecord(record, record.root);
  const recordPath = getControlRecordPath(record.root, options);
  const directory = path.dirname(recordPath);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  const temporaryPath = `${recordPath}.${process.pid}.${randomBytes(8).toString("hex")}.tmp`;
  let handle;
  try {
    handle = await open(temporaryPath, "wx", 0o600);
    await handle.writeFile(`${JSON.stringify(record)}\n`, "utf8");
    await handle.close();
    handle = undefined;
    await rename(temporaryPath, recordPath);
  } catch (error) {
    await handle?.close().catch(() => {});
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
  return recordPath;
}

export async function readControlRecord(root, options = {}) {
  try {
    const source = await readFile(getControlRecordPath(root, options), "utf8");
    return validateRecord(JSON.parse(source), root);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    if (error instanceof SyntaxError) {
      throw new Error("Preview control record is not valid JSON", { cause: error });
    }
    throw error;
  }
}

export async function removeControlRecord(record, options = {}) {
  const current = await readControlRecord(record.root, options);
  if (!current || current.pid !== record.pid || !tokensMatch(current.token, record.token)) {
    return false;
  }
  await rm(getControlRecordPath(record.root, options));
  return true;
}

export function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    if (error.code === "EPERM") return true;
    throw error;
  }
}

export function isLoopbackAddress(address) {
  return address === "127.0.0.1"
    || address === "::1"
    || address === "::ffff:127.0.0.1";
}

export function tokensMatch(actual, expected) {
  if (typeof actual !== "string" || typeof expected !== "string") return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer);
}
```

- [ ] **Step 4: Verify GREEN**

Run `node --test tools/preview-control.test.mjs`.

Expected: four pass, zero fail; `git status --short` contains no runtime file.

- [ ] **Step 5: Commit**

```bash
git add tools/preview-control.mjs tools/preview-control.test.mjs
git commit -m "feat: add private preview control records"
```

---

### Task 2: Authenticated Graceful Shutdown in the Server

**Files:**
- Modify: `tools/serve.mjs:1-152`
- Modify: `tools/serve.test.mjs:1-184`

**Interfaces:**
- Consumes: Task 1 exports.
- Produces: registered preview plus `POST /__codex/preview/stop`, accepted only from loopback with the current token; HTTP `202` triggers graceful shutdown.

- [ ] **Step 1: Isolate the existing server test**

In `tools/serve.test.mjs`, create a temp control directory and pass it to the child:

```js
let controlDir;

before(async () => {
  controlDir = await mkdtemp(path.join(os.tmpdir(), "profile-preview-control-"));
  port = await reservePort();
  serverProcess = spawn(process.execPath, ["tools/serve.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      HOST: host,
      PORT: String(port),
      PREVIEW_CONTROL_DIR: controlDir,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitForStartup(serverProcess);
});
```

Remove `controlDir` in `after`, after the child exits. Extend `request(pathname, method, headers = {})` to send headers.

- [ ] **Step 2: Write failing registration and rejection tests**

Add:

```js
import { readFile } from "node:fs/promises";
import { CONTROL_HEADER, CONTROL_ROUTE, getControlRecordPath } from "./preview-control.mjs";

test("registers the running preview for this worktree", async () => {
  const record = JSON.parse(
    await readFile(getControlRecordPath(root, { controlDir }), "utf8"),
  );
  assert.equal(record.root, root);
  assert.equal(record.pid, serverProcess.pid);
  assert.equal(record.host, host);
  assert.equal(record.port, port);
  assert.match(record.token, /^[a-f0-9]{64}$/);
});

test("rejects an invalid stop token and keeps serving", async () => {
  const stopped = await request(CONTROL_ROUTE, "POST", {
    [CONTROL_HEADER]: "0".repeat(64),
  });
  assert.equal(stopped.statusCode, 403);
  assert.equal((await request("/")).statusCode, 200);
});
```

Keep the existing `POST /` => `405` test.

- [ ] **Step 3: Verify RED**

Run `npm run test:server`.

Expected: FAIL because no record exists and the control route returns 405.

- [ ] **Step 4: Register only after listening**

Import Task 1 helpers. After `server.address()` is available, read any existing record. If its PID is alive, fail startup with `A managed preview is already running with PID <pid>`. If it is stale, remove it. Create and write the new record before printing the successful preview URL:

```js
controlRecord = createControlRecord({
  root: canonicalRoot,
  pid: process.pid,
  host,
  port: server.address().port,
});
await writeControlRecord(controlRecord);
```

Registration failure closes the listener, logs one clear error, and sets exit code 1.

- [ ] **Step 5: Add one idempotent shutdown path**

Use one function for control requests, `SIGINT`, and `SIGTERM`:

```js
let shutdownPromise;

function shutdown() {
  if (shutdownPromise) return shutdownPromise;
  shutdownPromise = new Promise((resolve) => {
    server.close(async (error) => {
      try {
        if (controlRecord) await removeControlRecord(controlRecord);
      } catch (cleanupError) {
        console.error("Unable to remove preview control record:", cleanupError);
        process.exitCode = 1;
      }
      if (error) {
        console.error("Unable to stop preview server cleanly:", error);
        process.exitCode = 1;
      }
      resolve();
    });
    server.closeIdleConnections?.();
  });
  return shutdownPromise;
}
```

Resolve the request pathname before the generic method rejection, then use this control branch:

```js
if (request.method === "POST" && pathname === CONTROL_ROUTE) {
  let currentRecord = null;
  try {
    currentRecord = await readControlRecord(canonicalRoot);
  } catch (error) {
    console.error("Unable to validate preview control record:", error);
  }

  const authorized = controlRecord
    && currentRecord
    && isLoopbackAddress(request.socket.remoteAddress)
    && tokensMatch(request.headers[CONTROL_HEADER], controlRecord.token)
    && currentRecord.pid === controlRecord.pid
    && tokensMatch(currentRecord.token, controlRecord.token);

  if (!authorized) {
    sendText(response, 403, "Forbidden");
    return;
  }

  response.writeHead(202, {
    "Cache-Control": "no-store",
    "Content-Length": "0",
  });
  response.once("finish", () => void shutdown());
  response.end();
  return;
}
```

Other unsupported methods retain the existing 405 response. Replace signal-specific closure with `process.once(signal, () => void shutdown())`.

- [ ] **Step 6: Verify GREEN and regressions**

```bash
node --test tools/preview-control.test.mjs
npm run test:server
npm test
```

Expected: all exit 0; registration/rejection and every existing route/security test pass.

- [ ] **Step 7: Commit**

```bash
git add tools/serve.mjs tools/serve.test.mjs
git commit -m "feat: add authenticated preview shutdown"
```

---

### Task 3: Stop CLI and Real-Process Lifecycle Tests

**Files:**
- Create: `tools/stop.mjs`
- Create: `tools/preview-stop.test.mjs`
- Modify: `package.json:1-20`

**Interfaces:**
- Consumes: the record helpers and Task 2 HTTP 202 contract.
- Produces: `stopManagedPreview(options) -> Promise<{ status: "stopped" | "not-running", record?: object }>` and `npm run stop`.

- [ ] **Step 1: Write failing no-op and lifecycle tests**

Create `tools/preview-stop.test.mjs` using real `spawn`/`spawnSync`, a reserved custom port, and an isolated `PREVIEW_CONTROL_DIR`.

The no-op test is:

```js
test("stop succeeds when no managed preview exists", async (t) => {
  const controlDir = await mkdtemp(path.join(os.tmpdir(), "preview-stop-test-"));
  t.after(() => rm(controlDir, { force: true, recursive: true }));
  const result = spawnSync(process.execPath, ["tools/stop.mjs"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PREVIEW_CONTROL_DIR: controlDir },
  });
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "Preview server is not running.");
  assert.equal(result.stderr, "");
});
```

Use these real-process helpers and tests in the same file:

```js
async function reservePort() {
  const probe = createProbeServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const { port } = probe.address();
  await new Promise((resolve, reject) => {
    probe.close((error) => error ? reject(error) : resolve());
  });
  return port;
}

function waitForStartup(child) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(new Error(`Preview startup timed out: ${output}`)), 3_000);
    child.stdout.on("data", (chunk) => {
      output += chunk;
      if (output.includes("Preview server running at")) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Preview exited before startup with code ${code}`));
    });
  });
}

function waitForExit(child) {
  return child.exitCode === null
    ? once(child, "exit")
    : Promise.resolve([child.exitCode, child.signalCode]);
}

function runStop(controlDir) {
  return spawnSync(process.execPath, ["tools/stop.mjs"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PREVIEW_CONTROL_DIR: controlDir },
  });
}

test("stop shuts down the registered preview on its custom port", async (t) => {
  const controlDir = await mkdtemp(path.join(os.tmpdir(), "preview-stop-test-"));
  const port = await reservePort();
  const preview = spawn(process.execPath, ["tools/serve.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      PREVIEW_CONTROL_DIR: controlDir,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(async () => {
    if (preview.exitCode === null) preview.kill("SIGTERM");
    await rm(controlDir, { force: true, recursive: true });
  });
  await waitForStartup(preview);

  const stopped = runStop(controlDir);
  assert.equal(stopped.status, 0);
  assert.equal(
    stopped.stdout.trim(),
    `Preview server stopped at http://127.0.0.1:${port}.`,
  );
  const [exitCode, signal] = await waitForExit(preview);
  assert.equal(exitCode, 0);
  assert.equal(signal, null);
  await assert.rejects(
    readFile(getControlRecordPath(root, { controlDir })),
    { code: "ENOENT" },
  );

  const repeated = runStop(controlDir);
  assert.equal(repeated.status, 0);
  assert.equal(repeated.stdout.trim(), "Preview server is not running.");
});

test("a foreign record never terminates its recorded process", async (t) => {
  const controlDir = await mkdtemp(path.join(os.tmpdir(), "preview-stop-test-"));
  const unrelated = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    stdio: "ignore",
  });
  t.after(async () => {
    if (unrelated.exitCode === null) unrelated.kill("SIGTERM");
    await rm(controlDir, { force: true, recursive: true });
  });
  await writeFile(getControlRecordPath(root, { controlDir }), JSON.stringify({
    version: 1,
    root: `${root}-foreign`,
    pid: unrelated.pid,
    host: "127.0.0.1",
    port: 4173,
    token: "f".repeat(64),
  }));

  const result = runStop(controlDir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not belong to this worktree/);
  assert.doesNotThrow(() => process.kill(unrelated.pid, 0));
});
```

Import `spawn`, `spawnSync`, `once`, `mkdtemp`, `readFile`, `rm`, `writeFile`, `createServer as createProbeServer`, `os`, `path`, `test`, and `getControlRecordPath` explicitly at the top.

- [ ] **Step 2: Add scripts and verify RED**

Add to `package.json`:

```json
"stop": "node tools/stop.mjs",
"test:stop": "node --test tools/preview-control.test.mjs tools/preview-stop.test.mjs"
```

Add `npm run test:stop` to `npm test` before site validation. Run `npm run test:stop`.

Expected: FAIL with `MODULE_NOT_FOUND` for `tools/stop.mjs`; test cleanup still terminates only its own child.

- [ ] **Step 3: Implement the CLI without signals**

Create `tools/stop.mjs` with:

```js
import { request } from "node:http";
import { realpath } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  CONTROL_HEADER,
  CONTROL_ROUTE,
  isProcessAlive,
  readControlRecord,
  removeControlRecord,
} from "./preview-control.mjs";

function loopbackTarget(host) {
  if (host === "0.0.0.0") return "127.0.0.1";
  if (host === "::") return "::1";
  return host;
}

export async function stopManagedPreview({
  root,
  controlDir = process.env.PREVIEW_CONTROL_DIR,
  requestTimeoutMs = 2_000,
  shutdownTimeoutMs = 5_000,
} = {}) {
  const canonicalRoot = root ? await realpath(root) : await realpath(path.resolve("."));
  const options = controlDir ? { controlDir } : {};
  const record = await readControlRecord(canonicalRoot, options);
  if (!record) return { status: "not-running" };
  if (!isProcessAlive(record.pid)) {
    await removeControlRecord(record, options);
    return { status: "not-running" };
  }

  try {
    await requestStop(record, requestTimeoutMs);
  } catch (error) {
    if (!isProcessAlive(record.pid)) {
      await removeControlRecord(record, options);
      return { status: "not-running" };
    }
    throw error;
  }

  const deadline = Date.now() + shutdownTimeoutMs;
  while (Date.now() < deadline) {
    const alive = isProcessAlive(record.pid);
    const current = await readControlRecord(canonicalRoot, options);
    if (!alive && current === null) return { status: "stopped", record };
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Preview shutdown timed out for PID ${record.pid}`);
}

function requestStop(record, timeoutMs) {
  return new Promise((resolve, reject) => {
    const outgoing = request({
      host: loopbackTarget(record.host),
      port: record.port,
      path: CONTROL_ROUTE,
      method: "POST",
      headers: {
        [CONTROL_HEADER]: record.token,
        Connection: "close",
        "Content-Length": "0",
      },
    }, (response) => {
      response.resume();
      response.once("end", () => {
        if (response.statusCode === 202) resolve();
        else reject(new Error(`Preview rejected stop request with HTTP ${response.statusCode}`));
      });
    });
    outgoing.once("error", reject);
    outgoing.setTimeout(timeoutMs, () => {
      outgoing.destroy(new Error(`Preview stop request timed out after ${timeoutMs} ms`));
    });
    outgoing.end();
  });
}

async function runCli() {
  try {
    const result = await stopManagedPreview();
    if (result.status === "not-running") {
      console.log("Preview server is not running.");
    } else {
      console.log(`Preview server stopped at http://${result.record.host}:${result.record.port}.`);
    }
  } catch (error) {
    console.error(`Unable to stop preview server: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await runCli();
}
```

The CLI prints exactly:

```text
Preview server is not running.
Preview server stopped at http://<host>:<port>.
```

Errors print `Unable to stop preview server: <message>` once and set exit code 1.

- [ ] **Step 4: Verify GREEN**

Run `npm run test:stop`.

Expected: record, no-op, custom-port shutdown, repeated-stop, and foreign-process safety tests all pass.

- [ ] **Step 5: Run regressions**

```bash
npm test
npm run test:server
git diff --check
```

Expected: all exit 0 without warnings.

- [ ] **Step 6: Commit**

```bash
git add package.json tools/stop.mjs tools/preview-stop.test.mjs
git commit -m "feat: add idempotent preview stop command"
```

---

### Task 4: Codex Action Contract and Documentation

**Files:**
- Create: `tools/environment.test.mjs`
- Modify through Codex editor: `.codex/environments/environment.toml:1-17`
- Modify: `package.json:1-22`
- Modify: `README.md:1-40`
- Modify: `docs/superpowers/specs/2026-08-14-codex-preview-stop-action-design.md:1-4`

**Interfaces:**
- Consumes: `npm run stop`.
- Produces: generated actions in exact `Run`, `Stop`, `Validate` order.

- [ ] **Step 1: Write the failing environment test**

Create `tools/environment.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function field(block, name) {
  return block.match(new RegExp(`^${name} = "([^"]+)"$`, "m"))?.[1];
}

test("Codex exposes Run, Stop, and Validate actions in order", async () => {
  const source = await readFile(".codex/environments/environment.toml", "utf8");
  const actions = source.split("[[actions]]").slice(1).map((block) => ({
    name: field(block, "name"),
    icon: field(block, "icon"),
    command: field(block, "command"),
  }));
  assert.deepEqual(actions, [
    { name: "Run", icon: "run", command: "npm run dev" },
    { name: "Stop", icon: "tool", command: "npm run stop" },
    { name: "Validate", icon: "tool", command: "npm test" },
  ]);
});
```

Add `"test:environment": "node --test tools/environment.test.mjs"` and include it in `npm test`.

- [ ] **Step 2: Verify RED**

Run `npm run test:environment`.

Expected: FAIL because generated actions currently contain only Run and Validate.

- [ ] **Step 3: Regenerate the Codex environment**

In the Codex Desktop environment editor for `aserdargun.com`:

1. Keep setup `npm ci`.
2. Keep Run: icon `run`, command `npm run dev`.
3. Add Stop next: icon `tool`, command `npm run stop`.
4. Keep Validate: icon `tool`, command `npm test`.
5. Save and inspect the regenerated TOML.

Confirm the warning, version `1`, and name remain unchanged.

- [ ] **Step 4: Verify GREEN**

Run `npm run test:environment`.

Expected: one pass, zero fail, with exact literal action mapping.

- [ ] **Step 5: Document usage**

Add to README development instructions:

```markdown
Stop the managed preview from another terminal with:

```bash
npm run stop
```

The Codex environment exposes matching `Run`, `Stop`, and `Validate` actions.
`Stop` affects only the preview registered for the current worktree and is a
successful no-op when no managed preview is running.
```

Do not change Azure deployment instructions. Change the spec status to exactly `Status: Approved`.

- [ ] **Step 6: Run the complete gate**

```bash
npm ci
npm test
npm run test:server
git diff --check
```

Expected: zero dependencies added; every test and validator passes.

- [ ] **Step 7: Commit**

```bash
git add .codex/environments/environment.toml package.json README.md \
  tools/environment.test.mjs \
  docs/superpowers/specs/2026-08-14-codex-preview-stop-action-design.md
git commit -m "chore: add Codex preview stop action"
```

---

### Task 5: Manual Action Verification and Handoff

**Files:**
- Verify only; no planned production edits.

**Interfaces:**
- Consumes: complete Run/Stop/Validate workflow.
- Produces: end-to-end evidence without touching Azure.

- [ ] **Step 1: Verify terminal Run-to-Stop**

Start `npm run dev`. From another terminal run:

```bash
curl -fsS http://127.0.0.1:4173/ >/dev/null
npm run stop
```

Then prove the listener is gone without killing it:

```bash
if curl -fsS --max-time 2 http://127.0.0.1:4173/ >/dev/null 2>&1; then
  exit 1
fi
```

Expected: first curl succeeds, Stop prints the address, Run exits 0, final curl cannot connect.

- [ ] **Step 2: Verify repeated Stop**

Run `npm run stop` again.

Expected: exit 0 and exactly `Preview server is not running.`

- [ ] **Step 3: Verify Codex Desktop actions**

Use Run and confirm the local URL. Use Stop and confirm Run exits cleanly. Use Validate and confirm `npm test` exits 0. Do not trigger the Azure workflow.

- [ ] **Step 4: Run final evidence commands**

```bash
npm test
npm run test:server
git diff --check
git status --short --branch
git log --oneline --decorate -6
```

Expected: zero failures; clean branch; only approved design/control/Stop/action commits.

- [ ] **Step 5: Present integration choices**

Use `superpowers:finishing-a-development-branch` and offer merge locally, push a PR, or keep `codex/preview-stop-action` as-is. Do not merge, push, or deploy before the user chooses.
