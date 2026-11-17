// Lite fixture change 004 for C005-TS-167 … 171: a lite change whose `20-plan/plan.md` holds task
// sections and a non-task section with a Status bullet, approved at G3 with the 0.1.1 hash rule
// (the CLI's `phaseHash`) or with the hash that the sdd CLI 0.1.0 stored (C005-IF-005 §4).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileHash, phaseHash, recordApproval } from "../../../src/gate/hash.ts";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { makeWorkspace, REBUILD } from "../cli/helpers.ts";
import { changeMd } from "../workspace-fixtures.ts";

export const DIR = ".sdd/004-x";

export function litePlan(t1Status = "todo"): string {
  const task = (id: string, title: string, status: string, extra: string[]) => [
    `### ${id} — ${title}`,
    `- **Status:** ${status}`,
    ...extra,
    "- **Implements:** C004-REQ-101",
    "- **Satisfies AC:** C004-AC-101.1",
    "- **Verified by:** C004-TS-101, C004-TC-001",
    "- **Estimate:** S",
    "- **Targets:**",
    "  - add `src/export.ts`",
    "- **Steps:**",
    "  1. Write the export.",
    "- **Verification:**",
    "  - `npm test`",
    "- **Done when:**",
    "  - [ ] The export test passes",
    "",
  ];
  return [
    "---",
    'id: "C004-PLAN"',
    "artifact: plan/lite",
    'change: "CHG-004"',
    "phase: 20-plan",
    "status: draft",
    "---",
    "# CHG-004 — Plan (lite)",
    "",
    "## Strategy",
    "",
    "### Milestones",
    "- **Status:** planned",
    "",
    "## Tasks",
    "",
    ...task("C004-T-001", "CSV export", t1Status, ["- **Depends on:**"]),
    ...task("C004-T-002", "Archive CHG-004 into living specs", "todo", ["- **Depends on:** C004-T-001", "- **Archive task:** true"]),
    "## Test mapping",
    "| TC | TS | Level | Location |",
    "|---|---|---|---|",
    "| C004-TC-001 | C004-TS-101 | unit | `tests/export.test.ts` |",
    "",
  ].join("\n");
}

export const LITE_SPEC = [
  "---",
  "id: C004-SPEC",
  "artifact: spec/lite",
  "---",
  "# Spec",
  "",
  "### C004-REQ-101 — Export",
  "- **Statement:** THE app SHALL export CSV.",
  "",
  "#### C004-AC-101.1 — Export",
  "```gherkin",
  "Scenario: C004-TS-101 — export",
  "  Given data",
  "  When exported",
  "  Then CSV",
  "```",
  "",
].join("\n");

export interface LiteWorkspace {
  root: string;
  dir: string;
  cleanup: () => void;
}

/**
 * Change 004 (`profile`, default lite) at G3. `rule` "0.1.1" stores the hash of the current CLI;
 * "0.1.0" stores the hash that sdd 0.1.0 computed: the whole plan, report fields included.
 */
export function liteChange(o: { profile?: "lite" | "full"; rule?: "0.1.1" | "0.1.0"; t1Status?: string } = {}): LiteWorkspace {
  const profile = o.profile ?? "lite";
  const files: Record<string, string> = {
    ".sdd/SDD.md": "# SDD workspace\n",
    ".sdd/registry.json": REBUILD,
    [`${DIR}/change.md`]: changeMd({ nnn: "004", title: "x", profile, phase: "20-plan" }),
    [`${DIR}/10-spec/spec.md`]: LITE_SPEC,
  };
  if (profile === "lite") files[`${DIR}/20-plan/plan.md`] = litePlan(o.t1Status);
  else {
    for (const seq of [1, 2]) {
      const id = `C004-T-00${seq}`;
      files[`${DIR}/20-plan/50-tasks/T-00${seq}-x.md`] =
        `---\nid: ${id}\nchange: CHG-004\nphase: 20-plan\nartifact: plan/task\nstatus: todo\nreport: { commit: null, completed_at: null, notes: null }\n---\n# ${id} — Task\n\n- **Status:** todo\n`;
    }
  }
  const ws = makeWorkspace(files);
  const dir = join(ws.root, ...DIR.split("/"));
  const hash =
    o.rule === "0.1.0" && profile === "lite" ? `sha256:${fileHash(join(dir, "20-plan", "plan.md"))}` : phaseHash(dir, "20-plan").hash;
  writeFileSync(
    join(dir, "change.md"),
    changeMd({
      nnn: "004",
      title: "x",
      profile,
      phase: "20-plan",
      phases: {
        "00-ideation": { status: "approved" },
        "10-spec": { status: "approved" },
        "20-plan": { status: "approved", approved_hash: hash, approved_at: "2026-11-17", approved_by: "p01" },
      },
    }),
  );
  const record = recordApproval(dir, "20-plan", "2026-11-17");
  if (record.hash !== hash) {
    const all = JSON.parse(readFileSync(join(dir, "approvals.json"), "utf8")) as Record<string, { hash: string }>;
    all["20-plan"]!.hash = hash;
    writeFileSync(join(dir, "approvals.json"), JSON.stringify(all, null, 2) + "\n");
  }
  return { root: ws.root, dir, cleanup: ws.cleanup };
}

export function phaseStatus(dir: string, phase: string): string {
  const phases = splitFrontmatter(readFileSync(join(dir, "change.md"), "utf8")).data?.["phases"] as Record<string, { status: string }>;
  return phases[phase]!.status;
}

export function approvedHash(dir: string, phase: string): string {
  return (JSON.parse(readFileSync(join(dir, "approvals.json"), "utf8")) as Record<string, { hash: string }>)[phase]!.hash;
}
