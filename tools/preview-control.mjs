import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { chmod, mkdir, open, readFile, rename, rm } from "node:fs/promises";
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
