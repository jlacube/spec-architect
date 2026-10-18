// C001-TC-806 — verifies C001-TS-806 (C001-AC-806.1, C001-REQ-806): single-file phase hash, with
// this repository's approved G1, G2 and G3 hashes as golden values.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { idHashes, phaseHash } from "../../../src/gate/hash.ts";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";
import { changeFolder } from "../../helpers/spec-file.ts";
import { runBundled } from "../cli/helpers.ts";

const dir = changeFolder("001");

test("the 00-ideation hash of CHG-001 at G1 equals the G1 value", () => {
  // fx-bootstrap at G1: the ideation as approved on 2026-10-10, before the C001-T-028 revision.
  const r = phaseHash(join(repoRoot(), "tests", "fixtures", "fx-bootstrap-g1"), "00-ideation");
  assert.equal(r.files, 1);
  assert.equal(r.hash, "sha256:c9c7849fb7b87d1bbaca40bbdb5bc3be569788948de38b879c650621b0187401");
});

test("`sdd hash` reproduces every approved_hash of CHG-001 (G1, G2, G3)", () => {
  const phases = splitFrontmatter(readFileSync(join(dir, "change.md"), "utf8")).data?.["phases"] as Record<string, { approved_hash: string }>;
  for (const phase of ["00-ideation", "10-spec", "20-plan"]) {
    const r = runBundled(["hash", "001", phase], { cwd: repoRoot() });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout.trim(), phases[phase]!.approved_hash, phase);
  }
});

test("the per-ID hashes recorded by the prototype at approval are reproduced", () => {
  const approvals = JSON.parse(readFileSync(join(dir, "approvals.json"), "utf8")) as Record<string, { ids: Record<string, string> }>;
  for (const phase of ["10-spec", "20-plan"]) {
    const mine = idHashes(dir, phase);
    for (const [id, hash] of Object.entries(approvals[phase]!.ids)) assert.equal(mine[id], hash, id);
  }
});
