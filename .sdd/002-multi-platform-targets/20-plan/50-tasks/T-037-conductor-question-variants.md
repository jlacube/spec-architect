---
id: C002-T-037
title: "Conductor: interview and gate variants for the host question tools"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-05
status: todo
depends_on: [C002-T-028]
implements: [C002-REQ-211, C002-REQ-212, C002-REQ-213, C002-REQ-214, C002-REQ-311, C002-REQ-312]
satisfies_ac: [C002-AC-211.1, C002-AC-212.1, C002-AC-213.1, C002-AC-214.1, C002-AC-311.1, C002-AC-312.1]
verified_by: [C002-TS-215, C002-TS-216, C002-TS-217, C002-TS-218, C002-TS-219, C002-TS-220, C002-TS-221, C002-TS-316, C002-TS-317, C002-TS-318, C002-TS-319, C002-TC-215, C002-TC-216, C002-TC-217, C002-TC-218, C002-TC-219, C002-TC-220, C002-TC-221, C002-TC-316, C002-TC-317, C002-TC-318, C002-TC-319]
components: [C002-COMP-014, C002-COMP-016, C002-COMP-002]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-037 — Conductor: interview and gate variants for the host question tools

## Intent

Complete the interview-protocol and gate-protocol wiring variants of both targets, so that the
conductor asks through the host's question tool in rounds of at most four (C002-REQ-211, C002-REQ-212,
C002-REQ-213). On OpenCode the conductor keeps headers within 30 characters and gives every option a
description (C002-REQ-214). It treats a result without a choice as no answer and no approval
(C002-REQ-311), and in VS Code without `vscode/askQuestions` it asks nothing and names the setting to
enable (C002-REQ-312). The Claude Code text stays unchanged.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/targets/opencode/wiring/interview-protocol.md`, `…/gate-protocol.md` | final OpenCode variants |
| modify | `plugins/architect/targets/copilot/wiring/interview-protocol.md`, `…/gate-protocol.md` | final Copilot variants |
| add | `evals/targets/question-tool/TS-215.eval.mjs`, `TS-217.eval.mjs`, `TS-219.eval.mjs`, `TS-221.eval.mjs`, `TS-316.eval.mjs` | case files for the `@eval` scenarios through the existing case API; the Claude Code rows run in step 4, the OpenCode rows in C002-T-056 |
| modify | `evals/harness/fixtures.mjs` | builder of fixture fx-gate of test plan §2 (change 002 with 10-spec in review; variant with 00-ideation approved; variant ready to archive), from the CHG-001 gate helpers; also used by C002-TC-132, 613, 634 and 635; additive only |
| add | `tests/integration/cap02/question-variants.test.ts` | generated conductor bodies contain the rules, per target |
| modify | `evals/results/spend-chg002.json` | the spend of step 4 |

## Preconditions

- C002-T-028 done (variant mechanism and first drafts).
- For step 4: the ledger check of test plan §4.1 allows the sessions.

## Step outline (no production code)

1. Write each variant to the result shapes recorded by S-07 and S-08 (skipped, dismissed and empty
   results).
2. Keep the verbatim-words rule of the gate unchanged (C001-REQ-802 as modified by C002-REQ-212).
3. Run the generated-body test now.
4. **Paid runs on E-CC (the Claude Code rows of C002-TC-215, 217 and 219):** once the integration
   test is green, run each Claude Code Examples row once with the existing harness (`--host claude`
   is the default), at most one rerun after a failure. Check the ledger before every session and add
   each session's spend after it. The OpenCode rows of these cases and C002-TC-221 and C002-TC-316
   are carried to C002-T-056; the `@manual-vscode` cases to the checklist (C002-T-046, C002-T-050).

## Verification

- `npm test -- cap02` and `npm run generate -- --out <tmp>`
- `node evals/harness/run.mjs --tier dev --filter evals/targets/question-tool` (Claude Code rows)

## Done when

- [ ] Integration test green; the Claude Code rows of step 4 pass and their spend is in the ledger
- [ ] Carried cases listed in the task report: OpenCode rows to C002-T-056, `@manual-vscode` cases to C002-T-050
- [ ] Progress reported: `sdd task set C002-T-037 --status done --commit <sha>`
