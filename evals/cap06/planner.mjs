// Shared setup of the planner scenarios (C001-T-043): the planner dispatched as a subagent through the eval
// relay on a change whose spec is approved.
import { architectWithStubs, dispatchPrompt } from "../harness/overlay.mjs";

export const plannerRun = (prompt, fixture) => ({
  agent: "architect:eval-dispatcher",
  plugins: [architectWithStubs],
  fixture,
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 30,
  prompt: dispatchPrompt("sdd-planner", prompt),
});

export function brief(change, step, task, outputs) {
  return `Brief — planner: ${step}.
- Change: ${change}
- Phase / step: 20-plan · ${step}
- Task: ${task}
- Outputs: ${outputs}
- Quality bar: planning, sdd-conventions.
- Return contract: digest (at most 15 lines), the paths written, and a questions block for what P-01 must decide.`;
}
