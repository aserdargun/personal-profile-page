import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalRoot = await realpath(root);
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

function isWithin(basePath, candidatePath) {
  return candidatePath === basePath || candidatePath.startsWith(`${basePath}${path.sep}`);
}

async function resolveExistingPath(filePath) {
  const canonicalPath = await realpath(filePath);
  if (!isWithin(canonicalRoot, canonicalPath)) {
    throw Object.assign(new Error("Request path escapes the project root"), {
      statusCode: 403,
    });
  }
  return canonicalPath;
}

function resolveRequestPath(requestUrl) {
  const rawPath = (requestUrl || "/").split("?", 1)[0].split("#", 1)[0];
  const decodedPath = decodeURIComponent(rawPath).replaceAll("\\", "/");

  if (decodedPath.includes("\0")) {
    throw Object.assign(new Error("Invalid request path"), { statusCode: 400 });
  }

  const relativePath = decodedPath.replace(/^\/+/, "");
  const resolvedPath = path.resolve(root, relativePath);

  if (!isWithin(root, resolvedPath)) {
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
    filePath = await resolveExistingPath(filePath);
    let fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      filePath = await resolveExistingPath(path.join(filePath, "index.html"));
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
    if (error.statusCode === 403) {
      sendText(response, 403, "Forbidden");
      return;
    }

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
