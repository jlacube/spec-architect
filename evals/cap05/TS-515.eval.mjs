// C001-TC-515 — verifies C001-TS-515 (C001-AC-515.1, C001-REQ-515): ADR written during planning. The planner
// needs a decision on job deduplication that no DEC covers; the architect writes
// 20-plan/20-decisions/ADR-<seq>-job-dedup.md with the MADR sections, linking an OA file and a CON or
// COMP ID.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { checker } from "../harness/assert.mjs";
import { edit, write } from "../harness/workspaces.mjs";
import { read } from "../cap04/spec.mjs";
import { architectRun, brief, specWithRequirements } from "./arch.mjs";

const DECISIONS = ".sdd/004-clinic-subscriptions/20-plan/20-decisions";

function planStarted(root) {
  specWithRequirements(root);
  write(root, ".sdd/004-clinic-subscriptions/10-spec/60-architecture/architecture.md", "---\nid: C004-SPEC-ARCH\nartifact: spec/architecture\n---\n# Architecture\n\n## 2. Component catalogue\n\n### C004-COMP-01 — Billing scheduler\n- **Name:** Billing scheduler\n- **Status:** new\n- **Responsibility:** starts the monthly charge job for each clinic\n- **Realizes:** C004-REQ-101, C004-REQ-102\n- **Interfaces:** none\n- **Depends on:** none\n- **Owned data:** ChargeJob\n");
  write(root, ".sdd/004-clinic-subscriptions/10-spec/60-architecture/constraints.md", "---\nid: C004-SPEC-CON\nartifact: spec/constraints\n---\n# Constraints\n\n| ID | Statement | Source | Affects |\n|---|---|---|---|\n| C004-CON-01 | A clinic is charged at most once per billing month | C004-REQ-101 | C004-COMP-01 |\n");
  edit(root, ".sdd/004-clinic-subscriptions/change.md", (t) => t.replace(/^( {2}20-plan: \{ status: )not-started/m, "$1draft").replace(/^phase: 10-spec$/m, "phase: 20-plan"));
}

export default {
  id: "TS-515",
  title: "ADR written during planning",
  ...architectRun(brief("20-plan · decisions", "the planner needs a decision on job deduplication: the monthly charge job can be started twice (scheduler restart, retry) and must not charge a clinic twice (C004-CON-01). No DEC or ADR covers it. Analyse the options and record the decision as an ADR (slug `job-dedup`).", `\`${DECISIONS}/OA-<seq>-job-dedup.md\` and \`${DECISIONS}/ADR-<seq>-job-dedup.md\`.`), planStarted),
  assert({ root }) {
    const { failures, check } = checker();
    let names = [];
    try {
      names = readdirSync(join(root, ...DECISIONS.split("/")));
    } catch {
      // none
    }
    const adr = names.find((n) => /^ADR-\d+-job-dedup\.md$/.test(n));
    check(adr, `no ADR-<seq>-job-dedup.md (files: ${names.join(", ") || "none"})`);
    const text = adr ? read(root, `${DECISIONS}/${adr}`) : "";
    for (const h of ["Context", "Considered options", "Decision outcome", "Consequences"]) check(new RegExp(`^## ${h}\\b`, "m").test(text), `section "${h}" missing`);
    check(/OA-\d+/.test(text) && names.some((n) => /^OA-\d+/.test(n)), "the ADR links no OA file");
    check(/C004-(CON|COMP)-\d+/.test(text), "the ADR links no CON or COMP ID");
    return failures;
  },
};
