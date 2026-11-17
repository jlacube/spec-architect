// C005-TC-043 — verifies C005-TS-143 (C005-AC-114.1, C005-REQ-114): the task that implements the product
// feature "Archive old CSV exports" is not marked; only the task that runs `sdd archive 002` is.
import { checker } from "../harness/assert.mjs";
import { architectReal } from "../harness/overlay.mjs";
import { fullTasks } from "./archive-marker.mjs";
import { FULL, fullAtPlan, plannerPrompt } from "./plan-fixtures.mjs";

export default {
  id: "C005-TS-143",
  title: "Task that works on archive features is not marked",
  agent: "architect:eval-dispatcher",
  plugins: [architectReal],
  fixture: fullAtPlan({ cleanup: true }),
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
    const feature = tasks.filter((t) => /implements:\s*\[[^\]]*C002-REQ-102/.test(t.text));
    check(feature.length > 0, "no task implements C002-REQ-102 (Archive old CSV exports)");
    check(feature.every((t) => !t.marked || t.archive), `the task implementing "Archive old CSV exports" carries the marker: ${feature.filter((t) => t.marked).map((t) => t.name).join(", ")}`);
    const marked = tasks.filter((t) => t.marked);
    check(marked.length === 1 && marked[0].archive, `expected only the task running "sdd archive 002" marked, got marked: ${marked.map((t) => `${t.name}${t.archive ? " (archive)" : ""}`).join(", ") || "none"}`);
    return failures;
  },
};
