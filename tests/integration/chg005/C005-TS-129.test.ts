// C005-TC-029 — verifies C005-TS-129 (C005-AC-110.1, C005-REQ-110): the README hand-off step matches the
// plugin version. It fails at a version bump until step 6 names the new version (C005-IF-003 §5).
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { readmeVersionProblem } from "./plugin-text.ts";

test("plugins/architect/README.md step 6: npm install -g architect-sdd@<plugin.json version>, then sdd task set", () => {
  assert.equal(readmeVersionProblem(join(repoRoot(), "plugins", "architect")), null);
});
