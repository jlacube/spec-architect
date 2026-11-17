// C005-TC-020 — verifies C005-TS-120 (C005-AC-107.1, C005-REQ-107): the planner writes the hand-off of a full
// plan with the install line of the version that `sdd --version` prints in its session (0.1.1 through the
// wrapper of plugin-sdd-0-1-1.mjs). The tasks are written; the planner writes the hand-off.
import { checker } from "../harness/assert.mjs";
import { git, sdd, write } from "../harness/workspaces.mjs";
import { FULL, fullAtPlan, plannerPrompt, read, reportingSection, sawVersion, wroteFile } from "./plan-fixtures.mjs";
import { architectSdd011, WRAPPED_VERSION } from "./plugin-sdd-0-1-1.mjs";

const TASK = (n, title, extra = "") => `---
id: C002-T-00${n}
title: ${title}
milestone: C002-M-1
status: todo
depends_on: [${n === 2 ? "C002-T-001" : ""}]
implements: [C002-REQ-101]
satisfies_ac: [C002-AC-101.1]
verified_by: [C002-TS-101]
components: []
risk_refs: []
estimate: S
${extra}report: { commit: null, completed_at: null, notes: null }
---
# C002-T-00${n} — ${title}

## Intent
${title}.
## Targets
| Kind | Target | Change |
|---|---|---|
| add | src/export.ts | new |
## Preconditions
-
## Step outline
1. ${n === 2 ? "Run `sdd archive 002`." : "Write the export."}
## Verification
- npm test
## Done when
- [ ] done
`;

function given(root) {
  fullAtPlan()(root);
  write(root, `${FULL}/20-plan/10-strategy.md`, "---\nid: C002-PLAN-STRATEGY\nartifact: plan/strategy\n---\n# Strategy\n\n| Milestone | Goal | Exit criterion | Tasks |\n|---|---|---|---|\n| C002-M-1 | export | tests pass | C002-T-001, C002-T-002 |\n");
  write(root, `${FULL}/20-plan/50-tasks/T-001-export.md`, TASK(1, "Export endpoint"));
  write(root, `${FULL}/20-plan/50-tasks/T-002-archive.md`, TASK(2, "Archive CHG-002 into living specs", "archive_task: true\n"));
  sdd(root, "status", "--write");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "tasks");
}

export default {
  id: "C005-TS-120",
  title: "Planner writes the hand-off of a full plan with the session's sdd version",
  agent: "architect:eval-dispatcher",
  plugins: [architectSdd011],
  fixture: given,
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 30,
  prompt: plannerPrompt(
    'CHG-002 "CSV export" · profile full · kind greenfield',
    "hand-off",
    `the tasks of \`${FULL}/20-plan/50-tasks/\` and the strategy \`${FULL}/20-plan/10-strategy.md\` are written; write the hand-off from them (do not change the tasks).`,
    `\`${FULL}/20-plan/handoff.md\` only.`,
  ),
  assert({ root, transcript }) {
    const { failures, check } = checker();
    const text = read(root, `${FULL}/20-plan/handoff.md`);
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
