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
