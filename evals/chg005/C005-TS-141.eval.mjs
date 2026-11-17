// C005-TC-041 — verifies C005-TS-141 (C005-AC-114.1, C005-REQ-114): the planner marks the task of a full plan
// that runs the change's own archive, and only that task.
import { checker } from "../harness/assert.mjs";
import { architectReal } from "../harness/overlay.mjs";
import { fullTasks } from "./archive-marker.mjs";
import { FULL, fullAtPlan, plannerPrompt } from "./plan-fixtures.mjs";

export default {
  id: "C005-TS-141",
  title: "Archive task of a full plan marked",
  agent: "architect:eval-dispatcher",
  plugins: [architectReal],
  fixture: fullAtPlan(),
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 30,
  prompt: plannerPrompt(
    'CHG-002 "CSV export" · profile full · kind greenfield',
    "tasks",
    `write the task files of this change from its approved ideation \`${FULL}/00-ideation/ideation.md\` and spec \`${FULL}/10-spec/\`, with the milestones in \`${FULL}/20-plan/10-strategy.md\`.`,
    `\`${FULL}/20-plan/10-strategy.md\` and the task files under \`${FULL}/20-plan/50-tasks/\` only.`,
  ),
  assert({ root }) {
    const { failures, check } = checker();
    const tasks = fullTasks(root);
    check(tasks.length > 0, "no task file written");
    const archive = tasks.filter((t) => t.archive);
    check(archive.length === 1, `expected exactly one task file whose steps run "sdd archive 002", got ${archive.map((t) => t.name).join(", ") || "none"}`);
    check(archive.every((t) => t.marked), `the archive task ${archive.map((t) => t.name).join(", ")} carries no archive_task: true`);
    const others = tasks.filter((t) => !t.archive && t.marked);
    check(others.length === 0, `other task files carry the marker: ${others.map((t) => t.name).join(", ")}`);
    return failures;
  },
};
