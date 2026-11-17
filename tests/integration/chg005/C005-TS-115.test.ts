// C005-TC-015 — verifies C005-TS-115 (C005-AC-105.1, C005-REQ-105): Reporting protocol of each source
// hand-off template.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { commands, reportingSection } from "./handoff-section.ts";

for (const profile of ["full", "lite"]) {
  test(`templates/${profile}/20-plan/handoff.md: install line before 4 sdd commands, no plugin path`, () => {
    const text = readFileSync(join(repoRoot(), "plugins", "architect", "templates", profile, "20-plan", "handoff.md"), "utf8");
    const section = reportingSection(text);
    const { install, cli } = commands(section);
    assert.equal(section[install]?.trim(), "npm install -g architect-sdd@{{VERSION}}");
    assert.equal(cli.length, 4);
    assert.ok(cli.every((c) => c.i > install && c.line.startsWith("sdd ")));
    for (const l of section) assert.ok(!l.includes("node ") && !l.includes("scripts/sdd.mjs"), l);
  });
}
