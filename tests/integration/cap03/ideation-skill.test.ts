// C001-T-032: the phase-ideation skill's step 6 lists every section of C001-REQ-313, in the order
// that LINT-IDE-001 checks, and both phase skills give their steps as `## Step n — title` headings
// (the task list of C001-REQ-219 is built from them).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { IDEATION_SECTIONS } from "../../../src/lint/rules/ide-001.ts";
import { repoRoot } from "../../helpers.ts";

const skill = (n: string) => readFileSync(join(repoRoot(), "plugins", "architect", "skills", n, "SKILL.md"), "utf8");

test("phase-ideation step 6 names the twelve ideation sections in order", () => {
  const text = skill("phase-ideation");
  const step6 = text.slice(text.indexOf("## Step 6"), text.indexOf("## Step 7"));
  const listed = [...step6.matchAll(/^\d+\.\s+\*\*([^*]+)\*\*/gm)].map((m) => m[1]!.trim());
  assert.deepEqual(listed, IDEATION_SECTIONS);
});

for (const name of ["phase-ideation", "phase-spec"]) {
  test(`${name} has eight numbered steps`, () => {
    const steps = [...skill(name).matchAll(/^## Step (\d+) — .+$/gm)].map((m) => Number(m[1]));
    assert.deepEqual(steps, [1, 2, 3, 4, 5, 6, 7, 8]);
  });
}
