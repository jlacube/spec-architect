// C001-TC-622 — verifies C001-TS-622 (C001-AC-618.1, C001-REQ-616): lite plan structure. For a lite change
// whose spec is approved, the planner writes 20-plan/plan.md with Strategy, Tasks (one sub-section per
// task with the C001-IF-03 §3 fields), Test mapping and Risks, plus handoff.md, and no 50-tasks/ folder.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { checker } from "../harness/assert.mjs";
import { edit, sdd } from "../harness/workspaces.mjs";
import { read } from "../cap04/spec.mjs";
import { liteSpecDrafted } from "../cap02/drafting.mjs";
import { brief, plannerRun } from "./planner.mjs";

const DIR = ".sdd/001-coupon-codes";

function given(root) {
  liteSpecDrafted(root);
  edit(root, `${DIR}/change.md`, (t) => t.replace(/^( {2}10-spec: \{ status: )draft/m, "$1in-review"));
  sdd(root, "gate", "approve", "001", "10-spec", "--note", "Approve", "--by", "p01");
  edit(root, `${DIR}/change.md`, (t) => t.replace(/^( {2}20-plan: \{ status: )not-started/m, "$1draft").replace(/^phase: 10-spec$/m, "phase: 20-plan"));
  sdd(root, "status", "--write");
}

const FIELDS = ["Status", "Depends on", "Implements", "Satisfies AC", "Verified by", "Estimate", "Targets", "Verification", "Done when"];

export default {
  id: "TS-622",
  title: "Lite plan structure",
  ...plannerRun(brief('CHG-001 "Coupon codes" · profile lite · kind greenfield', "plan", `write the complete plan of this lite change from its approved spec \`${DIR}/10-spec/spec.md\` and \`${DIR}/10-spec/dod.md\`.`, `\`${DIR}/20-plan/plan.md\` and \`${DIR}/20-plan/handoff.md\`.`), given),
  assert({ root }) {
    const { failures, check } = checker();
    const plan = read(root, `${DIR}/20-plan/plan.md`);
    check(plan, "plan.md missing");
    for (const s of ["Strategy", "Tasks", "Test mapping", "Risks"]) check(new RegExp(`^##\\s+(\\d+\\.\\s*)?${s}\\b`, "m").test(plan), `plan.md section ${s} missing`);
    const tasks = plan.split(/^### /m).slice(1).filter((t) => /^C001-T-\d+/.test(t));
    check(tasks.length > 0, "no task sub-section");
    for (const t of tasks) for (const f of FIELDS) check(new RegExp(`\\*\\*${f}:?\\*\\*|^[-*]\\s*${f}:|^\\|\\s*${f}\\s*\\|`, "mi").test(t), `${t.split("\n")[0].slice(0, 12)}: field ${f} missing`);
    const handoff = read(root, `${DIR}/20-plan/handoff.md`);
    check(handoff, "handoff.md missing");
    for (const h of ["Reading order", "Rules", "Ordered task list", "Reporting protocol", "Definition of change done"]) check(new RegExp(`^##\\s+(\\d+\\.\\s*)?${h}\\b`, "m").test(handoff), `handoff.md heading ${h} missing`);
    check(!existsSync(join(root, ...DIR.split("/"), "20-plan", "50-tasks")), "a 50-tasks/ folder exists");
    return failures;
  },
};
