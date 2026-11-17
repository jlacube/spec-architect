// C005-TC-014 — verifies C005-TS-114 (C005-AC-105.1, C005-REQ-105): Reporting protocol of a scaffolded
// lite hand-off.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";
import { commands, createdChange, reportingSection } from "./handoff-section.ts";

test("change new --profile lite: install line first, bare sdd commands, no plugin path, fallback after", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
    const r = runBundled(["change", "new", "Export to CSV", "--profile", "lite", "--kind", "brownfield"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const section = reportingSection(readFileSync(join(createdChange(ws.root), "20-plan", "handoff.md"), "utf8"));
    const { install, cli } = commands(section);
    assert.ok(install >= 0, "install line present");
    assert.equal(cli.length, 4);
    assert.ok(cli.every((c) => c.i > install), "install line before the first CLI command");
    for (const c of cli) assert.ok(c.line.startsWith("sdd "), c.line);
    for (const want of ["--status in-progress", "--status done", "--status blocked", "defect add"]) assert.ok(cli.some((c) => c.line.includes(want)), want);
    for (const l of section) assert.ok(!l.includes("node ") && !l.includes("scripts/sdd.mjs"), l);
    const fallback = section.findIndex((l) => l.startsWith("**Frontmatter fallback**"));
    assert.ok(fallback > Math.max(...cli.map((c) => c.i)), "fallback after the CLI commands");
  } finally {
    ws.cleanup();
  }
});
