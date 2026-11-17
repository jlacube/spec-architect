// LINT-HAND-003 (error): while the 20-plan phase is draft, in-review or in-revision, the Reporting protocol
// of `handoff.md` has no install line `npm install -g architect-sdd@<major>.<minor>.<patch>` (C005-REQ-108,
// C005-IF-003 §1). The line counts inside or outside a fenced block, outside HTML comments, once trimmed; its
// version is not compared with the CLI's own. A missing section is the finding of LINT-HAND-001.
import { sectionByName, textWithoutComments } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const HANDOFF = "20-plan/handoff.md";
const OPEN = ["draft", "in-review", "in-revision"];
const INSTALL_LINE = /^npm install -g architect-sdd@\d+\.\d+\.\d+$/;

export const hand003: LintRule = {
  code: "LINT-HAND-003",
  severity: "error",
  fix: "Add the install line with the version that `sdd --version` prints",
  scope: "file",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const doc = c.spec.docs.get(HANDOFF);
      if (!doc || !OPEN.includes(c.spec.planStatus ?? "")) continue;
      const rp = sectionByName(doc, "Reporting protocol", 2);
      if (!rp) continue;
      const lines = textWithoutComments(doc, rp.line + 1, rp.end).split("\n");
      if (lines.some((l) => INSTALL_LINE.test(l.trim()))) continue;
      out.push({
        path: `${c.folder}/${HANDOFF}`,
        line: rp.line,
        message: "Reporting protocol has no install line `npm install -g architect-sdd@<major>.<minor>.<patch>`",
      });
    }
    return out;
  },
};
