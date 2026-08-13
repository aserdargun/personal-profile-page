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
