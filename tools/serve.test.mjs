import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { createServer as createProbeServer } from "node:net";
import { request as httpRequest } from "node:http";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

import { CONTROL_HEADER, CONTROL_ROUTE, getControlRecordPath } from "./preview-control.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = "127.0.0.1";
let port;
let serverProcess;
let controlDir;

async function reservePort() {
  const probe = createProbeServer();
  probe.listen(0, host);
  await once(probe, "listening");

  const address = probe.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");

  await new Promise((resolve, reject) => {
    probe.close((error) => error ? reject(error) : resolve());
  });

  return address.port;
}

function waitForStartup(child) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      reject(new Error(`Preview server did not start in time. stderr: ${stderr}`));
    }, 3_000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.includes("Preview server running at")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      reject(new Error(
        `Preview server exited before startup (code=${code}, signal=${signal}). stderr: ${stderr}`,
      ));
    });
  });
}

function request(pathname, method = "GET", headers = {}) {
  return new Promise((resolve, reject) => {
    const outgoingRequest = httpRequest(
      { host, port, path: pathname, method, headers },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          resolve({
            body: Buffer.concat(chunks).toString("utf8"),
            headers: response.headers,
            statusCode: response.statusCode,
          });
        });
      },
    );
    outgoingRequest.on("error", reject);
    outgoingRequest.end();
  });
}

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

after(async () => {
  if (serverProcess?.exitCode === null) {
    serverProcess.kill("SIGTERM");
    const [code, signal] = await once(serverProcess, "exit");
    assert.equal(code, 0);
    assert.equal(signal, null);
  }
  await rm(controlDir, { force: true, recursive: true });
});

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

test("serves the English homepage at root without client navigation", async () => {
  const response = await request("/");

  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"], /^text\/html/);
  assert.equal(response.headers["cache-control"], "no-store");
  assert.match(response.body, /<html lang="en" data-locale="en">/);
  assert.match(
    response.body,
    /<link rel="canonical" href="https:\/\/aserdargun\.com\/">/,
  );
  assert.doesNotMatch(response.body, /window\.location\.replace/);
});

test("serves both localized directory indexes", async () => {
  for (const locale of ["en", "tr"]) {
    const response = await request(`/${locale}/`);
    assert.equal(response.statusCode, 200);
    assert.match(response.body, new RegExp(`<html lang="${locale}"`));
  }
});

test("supports HEAD requests with asset metadata and no body", async () => {
  const response = await request("/styles.css", "HEAD");

  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"], /^text\/css/);
  assert.ok(Number(response.headers["content-length"]) > 0);
  assert.equal(response.body, "");
});

test("emulates Azure cache headers for shared assets", async () => {
  const expectations = new Map([
    ["/styles.css", "public, max-age=86400"],
    ["/scripts.js", "public, max-age=86400"],
    ["/images/serdar-gundogdu-ascii-480.webp", "public, max-age=604800"],
    ["/icons/stackfolio.svg", "public, max-age=604800"],
  ]);

  for (const [pathname, cacheControl] of expectations) {
    const response = await request(pathname, "HEAD");
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["cache-control"], cacheControl);
  }
});

test("returns 404 for a missing resource", async () => {
  const response = await request("/missing-page");

  assert.equal(response.statusCode, 404);
  assert.equal(response.body, "Not Found\n");
});

test("rejects an encoded traversal outside the repository root", async () => {
  const response = await request("/%2e%2e/CLAUDE.md");

  assert.equal(response.statusCode, 403);
  assert.equal(response.body, "Forbidden\n");
});

test("rejects a symbolic link that resolves outside the repository root", async () => {
  const outsideDirectory = await mkdtemp(path.join(os.tmpdir(), "profile-preview-outside-"));
  const linkDirectory = await mkdtemp(path.join(root, ".profile-preview-link-"));
  const outsideFile = path.join(outsideDirectory, "private.txt");
  const linkPath = path.join(linkDirectory, "outside.txt");

  try {
    await writeFile(outsideFile, "outside repository\n", "utf8");
    await symlink(outsideFile, linkPath);

    const response = await request(`/${path.basename(linkDirectory)}/outside.txt`);
    assert.equal(response.statusCode, 403);
    assert.equal(response.body, "Forbidden\n");
  } finally {
    await rm(linkDirectory, { force: true, recursive: true });
    await rm(outsideDirectory, { force: true, recursive: true });
  }
});

test("rejects malformed URL encoding", async () => {
  const response = await request("/%E0%A4%A");

  assert.equal(response.statusCode, 400);
  assert.equal(response.body, "Bad Request\n");
});

test("rejects unsupported HTTP methods", async () => {
  const response = await request("/", "POST");

  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.allow, "GET, HEAD");
});

test("rejects an invalid configured port before listening", () => {
  const result = spawnSync(process.execPath, ["tools/serve.mjs"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PORT: "invalid" },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid PORT value: invalid/);
});
