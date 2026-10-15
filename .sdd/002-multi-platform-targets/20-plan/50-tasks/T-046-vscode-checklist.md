---
id: C002-T-046
title: "Manual VS Code checklist and its record template"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-033, C002-T-037, C002-T-038]
implements: [C002-REQ-613, C002-REQ-614, C002-REQ-615, C002-REQ-616, C002-REQ-628]
satisfies_ac: [C002-AC-613.1, C002-AC-614.1, C002-AC-615.1, C002-AC-616.1, C002-AC-628.1]
verified_by: [C002-TS-616, C002-TS-617, C002-TS-618, C002-TS-619, C002-TS-632]
components: [C002-COMP-011]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-046 — Manual VS Code checklist and its record template

## Intent

Write the checklist of C002-IF-009 §4 with stable step IDs (`VSC-01` …). It covers the sdd MCP server
boundary, one interview round and one gate with a skipped answer, and a toy change from creation to G1
on a fresh install. It also covers a Revise choice at G1 with the gate shown again, and one revise
command run (C002-REQ-614). It adds the hooks steps (C002-REQ-616) and the Copilot injection cases
where C002-REQ-613 or C002-REQ-628 applies. The record template carries the fields of C002-REQ-615.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/checklists/vscode-copilot.md` | steps, expected results, and the steps that each `@manual-vscode` scenario of C002-CAP-02, C002-CAP-03 and C002-CAP-05 maps to |
| add | `docs/checklists/records/TEMPLATE.md` | date, VS Code and Copilot Chat versions, mode, hooks state, result per step, P-01's name |
| add | `tests/integration/cap06/checklist.test.ts` | every `@manual-vscode` scenario maps to a step; hooks steps present only under `copilot-hooks` |

## Preconditions

- C002-T-033, C002-T-037 and C002-T-038 done.

## Step outline (no production code)

1. Derive the step list from the `@manual-vscode` scenarios. Find them through the locator, never by a
   fixed change-folder path.
2. Make the record template parseable by the release check (C002-T-047).

## Verification

- `npm test -- cap06`

## Done when

- [ ] Checklist covers every required step; the template parses
- [ ] Progress reported: `sdd task set C002-T-046 --status done --commit <sha>`
