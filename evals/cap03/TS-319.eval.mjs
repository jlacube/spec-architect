// C001-TC-319 — verifies C001-TS-319 (C001-AC-317.1, C001-REQ-317): readiness gaps. An ideation draft
// without measurable goals gets a finding on the checklist item "goals measurable" with severity blocker
// or major.
import { checker } from "../harness/assert.mjs";
import { constitution } from "../cap02/drafting.mjs";
import { criticRun, findings, read, section } from "../cap07/critic.mjs";
import { edit, git, sdd, write } from "../harness/workspaces.mjs";

const DIR = ".sdd/001-patient-reminders";
export const REPORT = `${DIR}/00-ideation/critic-report.md`;

const SECTIONS = {
  "Document control": "CHG-001, draft 1.",
  "Problem statement": "Patients miss appointments; the clinic's front desk reports about 40 missed appointments a month (P-01, interview round 1).",
  "Q&A decision record": "Round 1: reminders by SMS (Q-channel-01, answer \"SMS (Recommended)\").",
  "Goals and non-goals": "Goals: make reminders better for patients; improve attendance; keep the front desk happy. Non-goals: marketing messages.",
  "Scope boundary": "In scope: one reminder per appointment by SMS. Out of scope: e-mail, marketing.",
  "Research index": "None yet.",
  "Options and decisions index": "No material decision yet.",
  "Design direction": "A scheduled job sends an SMS reminder 24 hours before each appointment through an SMS provider.",
  "Risks": "SMS delivery failures (medium).",
  "Assumptions": "[ASSUMPTION: patients have a mobile number on file]",
  "Open questions": "Which SMS provider (deferred to the spec, owner P-01).",
  "Sources": "None.",
};

export function given(root) {
  git(root, "init", "-q");
  sdd(root, "init");
  constitution(root, "approved");
  sdd(root, "change", "new", "Patient reminders");
  write(root, `${DIR}/00-ideation/ideation.md`, `# Ideation — Patient reminders\n\n${Object.entries(SECTIONS).map(([h, b], i) => `## ${i + 1}. ${h}\n\n${b}\n`).join("\n")}`);
  edit(root, `${DIR}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1draft"));
  sdd(root, "status", "--write");
}

export const BRIEF = `Brief — critic: ideation readiness review.
- Change: CHG-001 "Patient reminders" · profile full · kind greenfield
- Phase / step: 00-ideation · step 7 — Readiness review
- Task: review the ideation draft against the ideation readiness rubric and give the verdict.
- Inputs: \`${DIR}/00-ideation/ideation.md\`.
- Outputs: \`${REPORT}\` only.
- Quality bar: critique-rubrics, sdd-conventions.
- Return contract: digest (at most 15 lines), the verdict and the report path.`;

export const ideationReview = criticRun(BRIEF, given);

export default {
  id: "TS-319",
  title: "Readiness gaps",
  ...ideationReview,
  assert({ root }) {
    const { failures, check } = checker();
    const text = read(root, REPORT);
    check(text, "no critic-report.md");
    const goalFinding = findings(text).find((f) => /measur/i.test(f.body) && /goal/i.test(f.body));
    const viaRubric = section(text, "Rubric").split("\n").find((l) => /\bI2\b|goals? measurable/i.test(l)) ?? "";
    const id = goalFinding?.id ?? /CR-\d+/.exec(viaRubric)?.[0];
    const f = findings(text).find((x) => x.id === id);
    check(f, `no finding on "goals measurable" (rubric row: ${viaRubric.trim() || "none"})`);
    check(f && /\*\*Severity:\*\*\s*(blocker|major)\b/.test(f.body), `${id}: severity is not blocker or major`);
    return failures;
  },
};
