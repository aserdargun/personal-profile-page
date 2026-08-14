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
