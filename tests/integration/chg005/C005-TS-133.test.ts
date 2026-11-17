// C005-TC-033 — verifies C005-TS-133 (C005-AC-111.1, C005-REQ-111): CLAUDE_PLUGIN_ROOT invocation lines are
// not reported.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { scanPluginPaths } from "./plugin-text.ts";

test("agents/sdd-conductor.md holds ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs and no finding names it", () => {
  const plugin = join(repoRoot(), "plugins", "architect");
  const text = readFileSync(join(plugin, "agents", "sdd-conductor.md"), "utf8");
  assert.ok(text.includes("${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"));
  assert.deepEqual(scanPluginPaths(plugin).filter((f) => f.startsWith("agents/sdd-conductor.md:")), []);
});
