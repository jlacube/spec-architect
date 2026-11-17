// C005-TC-042 — verifies C005-TS-142 (C005-AC-114.1, C005-REQ-114): the planner marks the task section of a
// lite plan that runs the change's own archive, and only that section.
import { checker } from "../harness/assert.mjs";
import { architectReal } from "../harness/overlay.mjs";
import { liteTasks } from "./archive-marker.mjs";
import { LITE, liteAtPlan, plannerPrompt } from "./plan-fixtures.mjs";

export default {
  id: "C005-TS-142",
  title: "Archive task of a lite plan marked",
  agent: "architect:eval-dispatcher",
  plugins: [architectReal],
  fixture: liteAtPlan,
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 30,
  prompt: plannerPrompt(
    'CHG-003 "Coupon codes" · profile lite · kind greenfield',
    "plan",
    `write the plan of this lite change from its approved ideation \`${LITE}/00-ideation/ideation.md\` and spec \`${LITE}/10-spec/spec.md\` and \`${LITE}/10-spec/dod.md\`.`,
    `\`${LITE}/20-plan/plan.md\` only.`,
  ),
  assert({ root }) {
    const { failures, check } = checker();
    const tasks = liteTasks(root);
    check(tasks.length > 0, "no task section written");
    const archive = tasks.filter((t) => t.archive);
    check(archive.length === 1, `expected one task section whose steps run "sdd archive 003", got ${archive.map((t) => t.name).join(", ") || "none"}`);
    check(archive.every((t) => t.marked), `the archive task section ${archive.map((t) => t.name).join(", ")} carries no "- **Archive task:** true"`);
    const others = tasks.filter((t) => !t.archive && t.marked);
    check(others.length === 0, `other task sections carry the marker: ${others.map((t) => t.name).join(", ")}`);
    return failures;
  },
};
