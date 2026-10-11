// C001-TC-810 — verifies C001-TS-810 (C001-AC-809.1, C001-REQ-809): waiver persistence.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { isoDate } from "../../../src/workspace/change.ts";
import { runInProcess } from "../cli/helpers.ts";
import { approvedChange } from "./gate-fixture.ts";

test("waivers for CR-3 and TR-15 are recorded in change.md and registry.json", () => {
  const ws = approvedChange(["00-ideation"]);
  try {
    writeFileSync(join(ws.dir, "10-spec", "90-critic-report.md"),
      "---\nartifact: critic-report\n---\n# Critic report\n\n## Findings\n\n### CR-3 — Missing failure mode\n- **Severity:** blocker\n- **Status:** open\n");
    const r = runInProcess(["gate", "approve", "004", "10-spec", "--waive", "CR-3", "--waive", "TR-15", "--note", "accepted risk", "--by", "p01"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const expected = ["CR-3", "TR-15"].map((item) => ({ item, gate: "10-spec", date: isoDate(), note: "accepted risk" }));
    const fm = splitFrontmatter(readFileSync(join(ws.dir, "change.md"), "utf8")).data ?? {};
    assert.deepEqual((fm["waivers"] as Record<string, unknown>[]).map((w) => ({ ...w, date: String(w["date"]) })), expected);
    const registry = JSON.parse(readFileSync(join(ws.root, ".sdd", "registry.json"), "utf8")) as { changes: { id: string; waivers: unknown[] }[] };
    assert.deepEqual(registry.changes.find((c) => c.id === "CHG-004")?.waivers, expected);
    assert.match(readFileSync(join(ws.dir, "change.md"), "utf8"), /\| \*\*Approved with waivers\*\* \| "accepted risk" \| CR-3, TR-15 \| unavailable \|/);
  } finally {
    ws.cleanup();
  }
});
