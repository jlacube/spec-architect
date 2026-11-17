// C005-TC-021 — verifies C005-TS-121 (C005-AC-107.1, C005-REQ-107): the planner rewrites the Reporting
// protocol of a scaffolded lite hand-off (scaffolded by the working-tree CLI with its own version) with the
// version that `sdd --version` prints in its session (0.1.1 through the wrapper).
import { checker } from "../harness/assert.mjs";
import { LITE, liteAtPlan, plannerPrompt, read, reportingSection, sawVersion, wroteFile } from "./plan-fixtures.mjs";
import { architectSdd011, WRAPPED_VERSION } from "./plugin-sdd-0-1-1.mjs";

export default {
  id: "C005-TS-121",
  title: "Planner rewrites the Reporting protocol of a scaffolded lite hand-off",
  agent: "architect:eval-dispatcher",
  plugins: [architectSdd011],
  fixture: liteAtPlan,
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 30,
  prompt: plannerPrompt(
    'CHG-003 "Coupon codes" · profile lite · kind greenfield',
    "plan",
    `write the complete plan of this lite change from its approved spec \`${LITE}/10-spec/spec.md\` and \`${LITE}/10-spec/dod.md\`, and its hand-off (rewrite the scaffolded \`${LITE}/20-plan/handoff.md\`, its Reporting protocol included).`,
    `\`${LITE}/20-plan/plan.md\` and \`${LITE}/20-plan/handoff.md\`.`,
  ),
  assert({ root, transcript }) {
    const { failures, check } = checker();
    const text = read(root, `${LITE}/20-plan/handoff.md`);
    check(text, "handoff.md missing");
    const section = reportingSection(text);
    check(section.some((l) => l.trim() === `npm install -g architect-sdd@${WRAPPED_VERSION}`), `Reporting protocol has no line "npm install -g architect-sdd@${WRAPPED_VERSION}": ${section.join(" / ").slice(0, 300)}`);
    check(!text.includes("<version>"), 'handoff.md holds "<version>"');
    check(!text.includes("{{"), 'handoff.md holds a "{{" placeholder');
    check(sawVersion(transcript, WRAPPED_VERSION), `no Bash call ran sdd --version and saw ${WRAPPED_VERSION}`);
    check(wroteFile(transcript, "20-plan/handoff.md"), "the planner wrote no handoff.md through Write/Edit (guard-path through the wrapper)");
    return failures;
  },
};
