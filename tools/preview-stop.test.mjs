import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer as createProbeServer } from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { getControlRecordPath } from "./preview-control.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
    const timer = setTimeout(() => {
      reject(new Error(`Preview startup timed out: ${output}`));
    }, 3_000);

    child.stdout.on("data", (chunk) => {
      output += chunk;
      if (output.includes("Preview server running at")) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Preview exited before startup with code ${code}: ${output}`));
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

test("stop succeeds when no managed preview exists", async (t) => {
  const controlDir = await mkdtemp(path.join(os.tmpdir(), "preview-stop-test-"));
  t.after(() => rm(controlDir, { force: true, recursive: true }));

  const result = runStop(controlDir);

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "Preview server is not running.");
  assert.equal(result.stderr, "");
});

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
    if (preview.exitCode === null) {
      preview.kill("SIGTERM");
      await waitForExit(preview);
    }
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
    if (unrelated.exitCode === null) {
      unrelated.kill("SIGTERM");
      await waitForExit(unrelated);
    }
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
