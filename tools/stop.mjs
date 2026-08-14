import { realpath } from "node:fs/promises";
import { request } from "node:http";
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
    const current = await readControlRecord(canonicalRoot, options);
    if (current === null) return { status: "stopped", record };
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
