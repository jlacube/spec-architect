// C005-TC-016 — verifies C005-TS-116 (C005-AC-105.1, C005-REQ-105): npm packaging leaves the Reporting
// protocol of the hand-off templates unchanged.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanupFxTgz, fxTgz } from "../../fixtures/fx-tgz.ts";
import { repoRoot } from "../../helpers.ts";
import { reportingSection } from "./handoff-section.ts";

after(cleanupFxTgz);

test("staged hand-off templates: Reporting protocol byte-identical to the source; no ERR-BLD-002", () => {
  const fx = fxTgz();
  assert.deepEqual(fx.scan, []);
  for (const profile of ["full", "lite"]) {
    const rel = `templates/${profile}/20-plan/handoff.md`;
    const src = readFileSync(join(repoRoot(), "plugins", "architect", ...rel.split("/")), "utf8");
    const staged = fx.entries.get(`package/${rel}`)!.toString("utf8");
    assert.deepEqual(reportingSection(staged), reportingSection(src), rel);
  }
});
