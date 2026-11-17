// C005-TC-066 — verifies C005-TS-168 (C005-AC-121.1, C005-REQ-121): hash invariance, one row per
// Examples row; the lite rows use the lite plan of the fixture, the full rows a full change.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { phaseHash } from "../../../src/gate/hash.ts";
import { approvedChange } from "../cap08/gate-fixture.ts";
import { liteChange } from "./lite-fixture.ts";

const edit = (path: string, f: (s: string) => string) => writeFileSync(path, f(readFileSync(path, "utf8")));
const REQ = ["10-spec", "20-capabilities", "CAP-01-a", "requirements.md"];
const TASK1 = (s: string) => s.indexOf("### C004-T-001");

type Row = { profile: "full" | "lite"; phase: "10-spec" | "20-plan"; edit: string; same: boolean; apply: (dir: string) => void };

const rows: Row[] = [
  { profile: "full", phase: "10-spec", edit: "convert LF to CRLF", same: true, apply: (d) => edit(join(d, ...REQ), (s) => s.split("\n").join("\r\n")) },
  {
    profile: "full", phase: "10-spec", edit: "add trailing spaces to 3 lines", same: true,
    apply: (d) => edit(join(d, ...REQ), (s) => { const l = s.split("\n"); for (const i of [1, 5, 6]) l[i] += "   "; return l.join("\n"); }),
  },
  { profile: "full", phase: "10-spec", edit: 'change frontmatter "status" field', same: true, apply: (d) => edit(join(d, ...REQ), (s) => s.replace("artifact: spec/requirements", "artifact: spec/requirements\nstatus: approved")) },
  { profile: "full", phase: "10-spec", edit: "regenerate 80-traceability.md", same: true, apply: (d) => writeFileSync(join(d, "10-spec", "80-traceability.md"), "# Traceability\n\nregenerated\n") },
  { profile: "full", phase: "10-spec", edit: "change one word in a requirement statement", same: false, apply: (d) => edit(join(d, ...REQ), (s) => s.split("do one thing").join("do two things")) },
  {
    profile: "full", phase: "20-plan", edit: 'change the "status" key and add the "report" key in the frontmatter of a task file', same: true,
    apply: (d) => {
      const dir = join(d, "20-plan", "50-tasks");
      const f = join(dir, readdirSync(dir)[0]!);
      edit(f, (s) => s.replace(/^status: \w[\w-]*$/m, "status: done\nreport: { commit: a1b2c3d, completed_at: 2026-11-18, notes: null }"));
    },
  },
  { profile: "lite", phase: "20-plan", edit: 'change the Status field of a task section of "plan.md" from "todo" to "done"', same: true, apply: (d) => edit(join(d, "20-plan", "plan.md"), (s) => s.slice(0, TASK1(s)) + s.slice(TASK1(s)).replace("- **Status:** todo", "- **Status:** done")) },
  {
    profile: "lite", phase: "20-plan", edit: 'add the Commit, Notes and Completed at fields to a task section of "plan.md"', same: true,
    apply: (d) => edit(join(d, "20-plan", "plan.md"), (s) => s.split("  1. Write the export.\n").join("  1. Write the export.\n- **Commit:** a1b2c3d\n- **Notes:** CSV export done\n- **Completed at:** 2026-11-18\n")),
  },
  { profile: "lite", phase: "20-plan", edit: 'change one word in the steps of a task section of "plan.md"', same: false, apply: (d) => edit(join(d, "20-plan", "plan.md"), (s) => s.split("Write the export.").join("Write the import.")) },
  { profile: "lite", phase: "20-plan", edit: 'change the Archive task field of a task section of "plan.md" from "true" to "false"', same: false, apply: (d) => edit(join(d, "20-plan", "plan.md"), (s) => s.split("- **Archive task:** true").join("- **Archive task:** false")) },
  { profile: "lite", phase: "20-plan", edit: 'change a "- **Status:**" bullet in a section of "plan.md" that is no task section', same: false, apply: (d) => edit(join(d, "20-plan", "plan.md"), (s) => s.split("- **Status:** planned").join("- **Status:** done")) },
  { profile: "lite", phase: "10-spec", edit: 'add the line "- **Status:** done" under a requirement of "spec.md"', same: false, apply: (d) => edit(join(d, "10-spec", "spec.md"), (s) => s + "- **Status:** done\n") },
];

for (const row of rows) {
  test(`${row.profile} ${row.phase}: ${row.edit} → ${row.same ? "identical" : "different"}`, () => {
    const ws = row.profile === "full" ? approvedChange() : liteChange();
    try {
      const before = phaseHash(ws.dir, row.phase).hash;
      row.apply(ws.dir);
      const after = phaseHash(ws.dir, row.phase).hash;
      if (row.same) assert.equal(after, before);
      else assert.notEqual(after, before);
    } finally {
      ws.cleanup();
    }
  });
}
