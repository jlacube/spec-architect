---
id: C002-T-046
title: "Manual VS Code checklist and its record template"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-033, C002-T-037, C002-T-038, C002-T-058]
implements: [C002-REQ-613, C002-REQ-614, C002-REQ-615, C002-REQ-616, C002-REQ-628]
satisfies_ac: [C002-AC-613.1, C002-AC-614.1, C002-AC-615.1, C002-AC-616.1, C002-AC-628.1]
verified_by: [C002-TS-616, C002-TS-617, C002-TS-618, C002-TS-619, C002-TS-632, C002-TC-616, C002-TC-617, C002-TC-618, C002-TC-619, C002-TC-632]
components: [C002-COMP-011]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-046 — Manual VS Code checklist and its record template

## Intent

Write the checklist of C002-IF-009 §4 (revised for defect D-003) with stable step IDs (`VSC-01` …),
for VS Code Insiders at the S-08 tested version in the Local session type. It covers the sdd MCP
server boundary; one interview round through `ask_user` that records the input shape of the call; one
gate through `ask_user` with a skipped answer that records the result returned without a choice; and
a toy change from creation to G1 on a fresh install, which includes `sdd install copilot` in P-03's
terminal and the selection of `sdd-conductor` as session agent. It also covers a Revise choice at G1
with the gate shown again, and one revise command run (C002-REQ-614). The fresh-install steps confirm
the assumptions the spec leaves to this checklist (C002-IF-005 §3, C002-IF-001 §6.1, C002-REQ-304,
C002-REQ-317): a specialist with `user-invocable: false` is still started as a subagent; the
workspace `sdd-conductor` starts the workspace specialists although plugin agents of the same names
are loaded; the prompt files bind to it and are offered as slash commands; `ask_user` works with and
without `chat.askQuestions.enabled`; Serena starts with the table's context. It adds the hooks steps
(C002-REQ-616) and the Copilot injection cases where C002-REQ-613 or C002-REQ-628 applies (neither
applies under the signed-off S-08 record). The record template carries the fields of C002-REQ-615.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/checklists/vscode-copilot.md` | steps, expected results, and the steps that each `@manual-vscode` scenario of C002-CAP-02, C002-CAP-03 and C002-CAP-05 maps to |
| add | `docs/checklists/records/TEMPLATE.md` | date, VS Code (Insiders) and Copilot Chat versions, session type, mode, hooks state, result per step, the recorded `ask_user` input shape and no-choice result, the outcome of each assumption step, P-01's name |
| add | `tests/integration/cap06/checklist.test.ts` | every `@manual-vscode` scenario maps to a step; hooks steps present only under `copilot-hooks` |

## Preconditions

- C002-T-033, C002-T-037, C002-T-038 and C002-T-058 (the install step names its output) done.

## Step outline (no production code)

1. Derive the step list from the `@manual-vscode` scenarios. Find them through the locator, never by a
   fixed change-folder path.
2. Make the record template parseable by the release check (C002-T-047).

## Verification

- `npm test -- cap06`

## Done when

- [ ] Checklist covers every required step; the template parses
- [ ] Progress reported: `sdd task set C002-T-046 --status done --commit <sha>`
