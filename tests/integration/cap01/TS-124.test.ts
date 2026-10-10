// C001-TC-124 — verifies C001-TS-124 (C001-AC-118.1, C001-REQ-118): lite changes get the same rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";

test("a lite requirement without an acceptance criterion is reported as TR-02, with no file-presence error", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    runBundled(["init"], { cwd: ws.root });
    assert.equal(runBundled(["change", "new", "Small fix", "--profile", "lite"], { cwd: ws.root }).code, 0);
    const spec = [
      "---", "id: C001-SPEC", "artifact: spec/lite", "change: CHG-001", "phase: 10-spec", "status: draft", "---",
      "# CHG-001 — Specification (lite)", "", "## Stories", "",
      "### C001-US-101 — Story", "- **Requirements:** C001-REQ-101, C001-REQ-102", "",
      "## Requirements", "",
      "### C001-REQ-101 — Covered", "- **Pattern:** ubiquitous", "- **Statement:** THE sdd CLI SHALL do one thing.", "- **Stories:** C001-US-101", "- **Acceptance:** C001-AC-101.1", "",
      "### C001-REQ-102 — Uncovered", "- **Pattern:** ubiquitous", "- **Statement:** THE sdd CLI SHALL do another thing.", "- **Stories:** C001-US-101", "- **Acceptance:**", "",
      "## Acceptance", "", "#### C001-AC-101.1 — Covered", "```gherkin", "Scenario: C001-TS-101 — s", "  Given a", "  When b", "  Then c", "```", "",
    ].join("\n");
    writeFileSync(join(ws.root, ".sdd", "001-small-fix", "10-spec", "spec.md"), spec);
    runBundled(["status", "--write"], { cwd: ws.root });
    const r = runBundled(["lint", "--json"], { cwd: ws.root });
    const findings = (JSON.parse(r.stdout) as { findings: { code: string; ids?: string[]; path: string; message: string }[] }).findings;
    const tr02 = findings.filter((f) => f.code === "TR-02");
    assert.deepEqual(tr02.map((f) => f.ids), [["C001-REQ-102"]]);
    assert.equal(findings.some((f) => /30-nfr/.test(f.path) || /30-nfr/.test(f.message)), false);
  } finally {
    ws.cleanup();
  }
});
