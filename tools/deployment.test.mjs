import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflowsDirectory = path.join(root, ".github/workflows");
const targetWorkflowPath = path.join(
  workflowsDirectory,
  "azure-static-web-apps-red-tree-06630f303.yml",
);

function setting(source, name) {
  const match = source.match(new RegExp(`^\\s*${name}:\\s*["']?([^"'#\\r\\n]+)`, "m"));
  return match?.[1].trim();
}

const targetWorkflow = await readFile(targetWorkflowPath, "utf8");
const staticConfig = JSON.parse(
  await readFile(path.join(root, "staticwebapp.config.json"), "utf8"),
);

test("Azure deployment root contains every public route and shared asset", async () => {
  const appLocation = setting(targetWorkflow, "app_location");
  assert.ok(appLocation, "Azure upload job must define app_location");

  const relativeAppLocation = appLocation.startsWith("/")
    ? `.${appLocation}`
    : appLocation;
  const deploymentRoot = path.resolve(root, relativeAppLocation);
  const requiredPaths = [
    "index.html",
    "en/index.html",
    "tr/index.html",
    "styles.css",
    "scripts.js",
    "staticwebapp.config.json",
    "images/serdar-gundogdu-ascii.png",
    "images/serdar-gundogdu-ascii-480.avif",
    "images/serdar-gundogdu-ascii-720.avif",
    "icons/stackfolio.svg",
  ];
  const missingPaths = [];

  for (const requiredPath of requiredPaths) {
    try {
      await stat(path.join(deploymentRoot, requiredPath));
    } catch {
      missingPaths.push(requiredPath);
    }
  }

  assert.deepEqual(
    missingPaths,
    [],
    `app_location ${JSON.stringify(appLocation)} excludes required deployed paths`,
  );
});

test("Azure bypasses build discovery for the dependency-free static site", () => {
  assert.equal(
    setting(targetWorkflow, "skip_app_build"),
    "true",
    "Azure must upload the static files without invoking Oryx",
  );
});

test("Azure serves a self-canonical English homepage directly at root", async () => {
  const rootHomepage = await readFile(path.join(root, "index.html"), "utf8");

  assert.equal(
    staticConfig.routes?.some(({ route }) => route === "/"),
    false,
    "root must use its own index.html instead of rewriting another canonical URL",
  );
  assert.match(rootHomepage, /<html lang="en" data-locale="en">/);
  assert.match(
    rootHomepage,
    /<link rel="canonical" href="https:\/\/aserdargun\.com\/">/,
  );
  assert.doesNotMatch(rootHomepage, /window\.location\.replace/);
});

test("Azure caches static assets without long-caching HTML", () => {
  const routeMap = new Map(
    (staticConfig.routes ?? []).map((rule) => [rule.route, rule]),
  );

  assert.equal(
    routeMap.get("/styles.css")?.headers?.["Cache-Control"],
    "public, max-age=86400",
  );
  assert.equal(
    routeMap.get("/scripts.js")?.headers?.["Cache-Control"],
    "public, max-age=86400",
  );
  assert.equal(
    routeMap.get("/images/*")?.headers?.["Cache-Control"],
    "public, max-age=604800",
  );
  assert.equal(
    routeMap.get("/icons/*")?.headers?.["Cache-Control"],
    "public, max-age=604800",
  );
  assert.equal(routeMap.get("/")?.headers, undefined);
});

test("Azure serves AVIF portraits with the browser image MIME type", () => {
  assert.equal(staticConfig.mimeTypes?.[".avif"], "image/avif");
});

test("main pushes trigger exactly one Azure Static Web Apps deployment", async () => {
  const workflowFiles = (await readdir(workflowsDirectory))
    .filter((file) => /\.ya?ml$/.test(file))
    .sort();
  const deploymentWorkflows = [];

  for (const workflowFile of workflowFiles) {
    const source = await readFile(path.join(workflowsDirectory, workflowFile), "utf8");
    if (
      source.includes("Azure/static-web-apps-deploy@v1") &&
      /push:\s*[\s\S]*?branches:\s*[\s\S]*?- main/.test(source)
    ) {
      deploymentWorkflows.push(workflowFile);
    }
  }

  assert.deepEqual(
    deploymentWorkflows,
    ["azure-static-web-apps-red-tree-06630f303.yml"],
    "main must deploy only the red-tree production app",
  );
});
