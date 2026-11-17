// C005-TC-031 — verifies C005-TS-131 (C005-AC-111.1, C005-REQ-111): the source plugin, bundle included, holds
// no plugin-path form.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { scanPluginPaths } from "./plugin-text.ts";

test("no <plugin-root> and no <plugin>/scripts/sdd.mjs in any file of plugins/architect/", () => {
  assert.deepEqual(scanPluginPaths(join(repoRoot(), "plugins", "architect")), []);
});
