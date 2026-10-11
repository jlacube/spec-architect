// Shared setup of the architect scenarios (C001-T-042): change 004 "Clinic subscriptions" (full profile,
// ideation approved) with stories, requirements and acceptance scenarios of two capabilities written,
// the architect dispatched as a subagent through the eval relay.
import { execFileSync } from "node:child_process";
import { architectWithStubs, dispatchPrompt } from "../harness/overlay.mjs";
import { CLI, write } from "../harness/workspaces.mjs";
import { SPEC, specStartFull } from "../cap04/spec.mjs";

export { SPEC };
export const ARCH = `${SPEC}/60-architecture`;
export const IFS = `${SPEC}/50-interfaces`;

const REQS = {
  "CAP-01-billing": [
    ["101", "Monthly charge", "WHEN a billing month ends, THE billing service SHALL charge each active clinic's card the subscription price."],
    ["102", "Failed charge", "IF a card charge fails, THEN THE billing service SHALL retry the charge once after 24 hours."],
  ],
  "CAP-02-notifications": [["201", "Reminder", "WHEN an appointment is 24 hours away, THE notification service SHALL send the patient a reminder by the patient's preferred channel."]],
};

function capFiles(root) {
  for (const [cap, reqs] of Object.entries(REQS)) {
    const n = cap.slice(4, 6);
    const us = `C004-US-${n === "01" ? "1" : "2"}01`;
    write(root, `${SPEC}/20-capabilities/${cap}/stories.md`, `---\nid: C004-CAP-${n}\nartifact: spec/stories\n---\n\n### ${us} — ${cap.slice(7)}\n- **As a** clinic manager\n- **I want** ${cap.slice(7)}\n- **So that** the clinic runs smoothly\n- **Value / outcome:** fewer manual steps\n- **Priority:** Must · **Size hint:** M · **Capability:** C004-CAP-${n}\n- **Context & notes:** none\n- **Requirements:** ${reqs.map(([id]) => `C004-REQ-${id}`).join(", ")}\n- **Traces to:** IDEA\n`);
    write(root, `${SPEC}/20-capabilities/${cap}/requirements.md`, `---\nid: C004-CAP-${n}\nartifact: spec/requirements\n---\n\n${reqs.map(([id, t, s]) => `### C004-REQ-${id} — ${t}\n- **Pattern:** ${s.startsWith("IF") ? "unwanted-behaviour" : "event-driven"}\n- **Statement:** ${s}\n- **Rationale:** ideation Goals\n- **Stories:** ${us}\n- **Priority:** Must\n- **Acceptance:** C004-AC-${id}.1\n`).join("\n")}`);
    write(root, `${SPEC}/20-capabilities/${cap}/acceptance.md`, `---\nid: C004-CAP-${n}\nartifact: spec/acceptance\n---\n\n${reqs.map(([id, t]) => `## C004-REQ-${id}\n\n#### C004-AC-${id}.1 — ${t}\n\`\`\`gherkin\nScenario: C004-TS-${id} — ${t.toLowerCase()}\n  Given an active clinic with a card on file\n  When the ${t.toLowerCase()} is due\n  Then the expected outcome of REQ-${id} is observed\n\`\`\`\n`).join("\n")}`);
  }
}

export function specWithRequirements(root) {
  specStartFull(root);
  capFiles(root);
}

export function brief(step, task, outputs, extra = "") {
  return `Brief — architect: ${step}.
- Change: CHG-004 "Clinic subscriptions" · profile full · kind greenfield
- Phase / step: ${step}
- Task: ${task} ${extra}
- Inputs: \`${SPEC}/20-capabilities/CAP-01-billing/\`, \`${SPEC}/20-capabilities/CAP-02-notifications/\` (stories, requirements, acceptance with TS IDs), \`.sdd/004-clinic-subscriptions/00-ideation/ideation.md\`.
- IDs to use: allocate COMP, IF, CON, ADR, OA IDs with \`sdd id next <TYPE> --change 004\`.
- Outputs: ${outputs}
- Quality bar: diagramming, architecture-decisions, options-analysis, sdd-conventions.
- Return contract: digest (at most 15 lines), the paths written, and a questions block for decisions only P-01 can take.`;
}

export const architectRun = (prompt, fixture = specWithRequirements) => ({
  agent: "architect:eval-dispatcher",
  plugins: [architectWithStubs],
  fixture,
  allowTools: ["Agent", "Write", "Edit", "Bash", "ToolSearch"],
  maxTurns: 30,
  prompt: dispatchPrompt("sdd-architect", prompt),
});

/** Lint findings of change 004 (all rules) as `{ code, message, path }`. */
export function lint(root) {
  let out;
  try {
    out = execFileSync(process.execPath, [CLI, "lint", "004", "--json"], { cwd: root, encoding: "utf8" });
  } catch (e) {
    out = e.stdout ?? "{}";
  }
  return JSON.parse(out || "{}").findings ?? [];
}
