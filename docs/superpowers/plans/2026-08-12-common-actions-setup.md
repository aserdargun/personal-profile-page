# Common Actions and Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dependency-free npm development commands and matching Codex `Run` and `Validate` actions for the static portfolio.

**Architecture:** A minimal private npm package owns the shared command contract. A project-local Node.js HTTP server serves the repository exactly as static files, while the existing validation scripts remain the source of truth for site checks; the Codex environment delegates to those npm commands.

**Tech Stack:** Node.js 20+, npm lockfile v3, Node.js standard library, TOML, Markdown

## Global Constraints

- Keep the site free of runtime and development dependencies.
- Use `aserdargun.com` as package and Codex environment name and `1.0.0` as the package version.
- Support Node.js 20 or newer.
- Serve `http://127.0.0.1:4173` by default, with optional `HOST` and `PORT` overrides.
- Do not change production HTML, CSS, JavaScript, images, sitemap, Azure workflow, or Static Web Apps configuration.
- Do not add deployment, publishing, secret, or external-service actions.

---

### Task 1: Establish the npm command contract

**Files:**
- Create: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `scripts.js`, `tools/validate-portrait-canvas.mjs`, and `tools/validate-site.mjs`.
- Produces: `npm run dev`, `npm run check:js`, `npm run test:portrait`, `npm run validate:site`, and `npm test`.

- [ ] **Step 1: Prove the shared npm test command does not exist**

Run `npm test`.

Expected: FAIL with `ENOENT` for the missing `package.json`.

- [ ] **Step 2: Add the minimal private package manifest**

Create `package.json` with exactly:

```json
{
  "name": "aserdargun.com",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "dev": "node tools/serve.mjs",
    "check:js": "node --check scripts.js",
    "test:portrait": "node --test tools/validate-portrait-canvas.mjs",
    "validate:site": "node tools/validate-site.mjs",
    "test": "npm run check:js && npm run test:portrait && npm run validate:site"
  }
}
```

- [ ] **Step 3: Regenerate the lockfile from the manifest**

Run `npm install --package-lock-only --ignore-scripts`.

Expected: exit 0, no packages installed, and root package metadata under
`packages[""]` in `package-lock.json`.

- [ ] **Step 4: Verify setup and all existing validation gates**

Run:

```bash
npm ci
npm test
```

Expected: both commands exit 0; the portrait test reports one passing test and
the site validator prints `Site validation passed.`

- [ ] **Step 5: Commit the command contract**

```bash
git add package.json package-lock.json
git commit -m "chore: add shared development commands"
```

---

### Task 2: Add the dependency-free static preview server

**Files:**
- Create: `tools/serve.mjs`

**Interfaces:**
- Consumes: the `npm run dev` command from Task 1 and the repository root's static files.
- Produces: a long-running HTTP listener at `HOST` and `PORT`, defaulting to `127.0.0.1:4173`; no importable API is exposed.

- [ ] **Step 1: Prove the preview entrypoint is missing**

Run `npm run dev`.

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `tools/serve.mjs`.

- [ ] **Step 2: Implement exact static-file serving behavior**

Create `tools/serve.mjs` with these concrete units:

```js
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = process.env.HOST || "127.0.0.1";
const rawPort = process.env.PORT || "4173";
const port = Number(rawPort);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"],
]);

function sendText(response, statusCode, message, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
    ...extraHeaders,
  });
  response.end(`${message}\n`);
}

function resolveRequestPath(requestUrl) {
  const rawPath = (requestUrl || "/").split("?", 1)[0].split("#", 1)[0];
  const decodedPath = decodeURIComponent(rawPath).replaceAll("\\", "/");

  if (decodedPath.includes("\0")) {
    throw Object.assign(new Error("Invalid request path"), { statusCode: 400 });
  }

  const relativePath = decodedPath.replace(/^\/+/, "");
  const resolvedPath = path.resolve(root, relativePath);
  const rootPrefix = `${root}${path.sep}`;

  if (resolvedPath !== root && !resolvedPath.startsWith(rootPrefix)) {
    throw Object.assign(new Error("Request path escapes the project root"), {
      statusCode: 403,
    });
  }

  return resolvedPath;
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendText(response, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
    return;
  }

  let filePath;
  try {
    filePath = resolveRequestPath(request.url);
  } catch (error) {
    const statusCode = error instanceof URIError ? 400 : error.statusCode || 400;
    sendText(response, statusCode, statusCode === 403 ? "Forbidden" : "Bad Request");
    return;
  }

  try {
    let fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
      fileStats = await stat(filePath);
    }

    if (!fileStats.isFile()) {
      sendText(response, 404, "Not Found");
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": fileStats.size,
      "Content-Type": mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream",
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    const stream = createReadStream(filePath);
    stream.on("error", (error) => {
      console.error(`Unable to read ${filePath}:`, error);
      response.destroy(error);
    });
    stream.pipe(response);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      sendText(response, 404, "Not Found");
      return;
    }

    console.error(`Unable to serve ${filePath}:`, error);
    sendText(response, 500, "Internal Server Error");
  }
});

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Invalid PORT value: ${rawPort}`);
  process.exitCode = 1;
} else {
  server.on("error", (error) => {
    console.error(`Unable to start preview server on ${host}:${port}:`, error);
    process.exitCode = 1;
  });

  server.listen(port, host, () => {
    console.log(`Preview server running at http://${host}:${port}`);
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      server.close((error) => {
        if (error) {
          console.error("Unable to stop preview server cleanly:", error);
          process.exitCode = 1;
        }
      });
    });
  }
}
```

- [ ] **Step 3: Start the preview server**

Run `npm run dev` in a persistent terminal.

Expected: the process remains active and prints
`Preview server running at http://127.0.0.1:4173`.

- [ ] **Step 4: Verify successful pages, HTTP semantics, and error handling**

Run from a second terminal:

```bash
curl --fail --silent --show-error http://127.0.0.1:4173/ >/dev/null
curl --fail --silent --show-error http://127.0.0.1:4173/en/ >/dev/null
curl --fail --silent --show-error http://127.0.0.1:4173/tr/ >/dev/null
test "$(curl --silent --output /dev/null --write-out '%{http_code}' --head http://127.0.0.1:4173/styles.css)" = "200"
test "$(curl --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:4173/missing-page)" = "404"
test "$(curl --path-as-is --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:4173/%2e%2e/CLAUDE.md)" = "403"
test "$(curl --silent --output /dev/null --write-out '%{http_code}' -X POST http://127.0.0.1:4173/)" = "405"
```

Expected: every command exits 0. Stop the server with `Ctrl-C` and confirm a
clean exit.

- [ ] **Step 5: Verify invalid startup configuration**

Run `PORT=invalid npm run dev`.

Expected: exit 1 and `Invalid PORT value: invalid`.

- [ ] **Step 6: Commit the preview server**

```bash
git add tools/serve.mjs
git commit -m "feat: add local static preview server"
```

---

### Task 3: Wire Codex setup/actions and document the workflow

**Files:**
- Modify: `.codex/environments/environment.toml`
- Modify: `README.md:7`

**Interfaces:**
- Consumes: `npm ci`, `npm run dev`, and `npm test` from Tasks 1 and 2.
- Produces: Codex `Run` and `Validate` actions plus contributor-facing instructions.

- [ ] **Step 1: Prove the generated Codex configuration lacks the setup and actions**

Run:

```bash
rg -q '^script = "npm ci"$' .codex/environments/environment.toml
rg -q '^name = "Run"$' .codex/environments/environment.toml
rg -q '^name = "Validate"$' .codex/environments/environment.toml
```

Expected: each command exits 1.

- [ ] **Step 2: Configure the Codex environment**

Use exactly:

```toml
# THIS IS AUTOGENERATED. DO NOT EDIT MANUALLY
version = 1
name = "aserdargun.com"

[setup]
script = "npm ci"

[[actions]]
name = "Run"
icon = "run"
command = "npm run dev"

[[actions]]
name = "Validate"
icon = "tool"
command = "npm test"
```

- [ ] **Step 3: Document setup, preview, and validation**

Replace the current README validation section with `## Development` instructions
for `npm ci` and `npm run dev`, the default `http://127.0.0.1:4173` URL and
`HOST`/`PORT` overrides, followed by `## Validation` instructions for `npm test`
and the three focused scripts.

```bash
npm run check:js
npm run test:portrait
npm run validate:site
```

- [ ] **Step 4: Verify commands and the declared Codex mapping**

Run:

```bash
npm ci
npm test
rg -n '^script = "npm ci"$|^name = "(Run|Validate)"$|^command = "npm run (dev|test)"$' .codex/environments/environment.toml
```

Expected: setup and tests exit 0; `rg` prints the setup, action names, and action commands.

- [ ] **Step 5: Commit the Codex integration and documentation**

```bash
git add .codex/environments/environment.toml README.md
git commit -m "chore: configure Codex project actions"
```

---

### Task 4: Re-run the complete delivery verification

**Files:**
- Verify only; no file changes expected.

**Interfaces:**
- Consumes: every artifact produced by Tasks 1-3.
- Produces: fresh evidence that the branch is ready for review.

- [ ] **Step 1: Run deterministic installation and tests**

```bash
npm ci
npm test
git diff --check origin/main...HEAD
```

Expected: every command exits 0, the portrait test reports one passing test, the
site validator prints `Site validation passed.`, and Git reports no whitespace errors.

- [ ] **Step 2: Re-run the live HTTP acceptance checks**

Start `npm run dev`, run the seven HTTP assertions from Task 2 Step 4, and stop
the server with `Ctrl-C`.

Expected: the server starts at `http://127.0.0.1:4173`, every assertion exits 0,
and shutdown is clean.

- [ ] **Step 3: Inspect final scope and history**

```bash
git status --short --branch
git log --oneline --decorate origin/main..HEAD
git diff --stat origin/main...HEAD
git diff --name-status origin/main...HEAD
```

Expected: only the design, plan, npm contract, server, Codex environment, and
README differ from `origin/main`; the working tree is clean.
