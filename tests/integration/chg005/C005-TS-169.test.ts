// C005-TC-067 — verifies C005-TS-169 (C005-AC-121.1, C005-REQ-121): single-file phase hash of
// fx-bootstrap (this repository at G1) unchanged by the lite-plan rule.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { phaseHash } from "../../../src/gate/hash.ts";
import { repoRoot } from "../../helpers.ts";

test("the 00-ideation hash of CHG-001 at G1 keeps its golden value", () => {
  const r = phaseHash(join(repoRoot(), "tests", "fixtures", "fx-bootstrap-g1"), "00-ideation");
  assert.equal(r.files, 1);
  assert.equal(r.hash, "sha256:c9c7849fb7b87d1bbaca40bbdb5bc3be569788948de38b879c650621b0187401");
});
