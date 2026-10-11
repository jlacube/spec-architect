// Shared setup of the spec-writer scenarios (C001-TS-401, 418 … 424): full-profile change 004 whose
// ideation (12 sections, naming the capabilities "billing" and "notifications") is approved through
// the CLI, at the start of 10-spec. The spec-writer runs as a subagent through the eval relay.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { constitution } from "../cap02/drafting.mjs";
import { architectWithStubs, dispatchPrompt } from "../harness/overlay.mjs";
import { edit, git, sdd, write } from "../harness/workspaces.mjs";

export const CHANGE = ".sdd/004-clinic-subscriptions";
export const SPEC = `${CHANGE}/10-spec`;

const SECTIONS = {
  "Document control": "CHG-004, version 1, approved at G1.",
  "Problem statement": "Clinics pay for the booking service by hand-written invoices; patients get no reminders, so 12 % of appointments are missed.",
  "Q&A decision record": "Q-ideation-01: monthly subscription per clinic (answered by P-01 in round 1).",
  "Goals and non-goals": "Goal: clinics are billed monthly by card. Goal: patients get an appointment reminder by SMS or email. Non-goal: insurance claims.",
  "Scope boundary": "In scope: two capabilities — **billing** (subscriptions, invoices, card payments) and **notifications** (appointment reminders by SMS and email). Out of scope: insurance, marketing messages.",
  "Research index": "None.",
  "Options and decisions index": "Monthly subscription chosen in round 1; no option analysis needed.",
  "Design direction": "A billing component charges the clinic's card monthly through the payment provider; a notification component sends reminders 24 hours before an appointment.",
  "Risks": "Card payment failures (medium).",
  "Assumptions": "None.",
  "Open questions": "None blocking.",
  "Sources": "None.",
};

export function specStartFull(root) {
  git(root, "init", "-q");
  sdd(root, "init");
  constitution(root, "approved");
  for (let i = 1; i < 4; i++) sdd(root, "change", "new", `Earlier change ${i}`, "--profile", "lite");
  sdd(root, "change", "new", "Clinic subscriptions", "--profile", "full");
  write(root, `${CHANGE}/00-ideation/ideation.md`, `# Ideation — Clinic subscriptions\n\n${Object.entries(SECTIONS).map(([h, b], i) => `## ${i + 1}. ${h}\n\n${b}\n`).join("\n")}`);
  edit(root, `${CHANGE}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1in-review"));
  sdd(root, "gate", "approve", "004", "00-ideation", "--note", "Approve", "--by", "p01");
  edit(root, `${CHANGE}/change.md`, (t) => t.replace(/^( {2}10-spec: \{ status: )not-started/m, "$1draft").replace(/^phase: 00-ideation$/m, "phase: 10-spec"));
  sdd(root, "status", "--write");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "fixture");
}

export function brief(step, task, outputs, extra = "") {
  return `Brief — spec-writer: ${step}.
- Change: CHG-004 "Clinic subscriptions" · profile full · kind greenfield
- Phase / step: 10-spec · ${step}
- Task: ${task} ${extra}
- Inputs: \`${CHANGE}/00-ideation/ideation.md\` (approved), \`.sdd/_constitution/constitution.md\`.
- IDs to use: allocate with \`sdd id next <TYPE> --change 004\` (capability blocks: CAP-01 → 1nn, CAP-02 → 2nn).
- Outputs: ${outputs}
- Quality bar: user-stories, ears-requirements, nfr-catalogue, sdd-conventions.
- Return contract: digest (at most 15 lines), the paths written, and a questions block for what P-01 alone can decide.`;
}

export const writerRun = (prompt) => ({
  agent: "architect:eval-dispatcher",
  plugins: [architectWithStubs],
  fixture: specStartFull,
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 30,
  prompt: dispatchPrompt("sdd-spec-writer", prompt),
});

export function read(root, rel) {
  try {
    return readFileSync(join(root, ...rel.split("/")), "utf8");
  } catch {
    return "";
  }
}

export function files(dir) {
  try {
    return readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
  } catch {
    return [];
  }
}
