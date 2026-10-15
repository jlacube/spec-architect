---
id: C002-T-045
title: "Copilot CLI eval runner"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-002, C002-T-033, C002-T-044]
implements: [C002-REQ-611, C002-REQ-612, C002-NFR-105]
satisfies_ac: [C002-AC-611.1, C002-AC-612.1]
verified_by: [C002-TS-614, C002-TS-615]
components: [C002-COMP-009]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-045 — Copilot CLI eval runner

## Intent

Run the routing cases, the injection cases, the sdd MCP server guard cases and the non-interactive
scenarios against the Copilot target package through Copilot CLI in non-interactive mode
(C002-REQ-612), within the same caps (C002-REQ-611). If S-08 recorded
`copilot_cli_loads_package: false`, the injection cases move to the checklist (C002-REQ-613,
C002-T-046).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `evals/harness/runners/copilot-cli.mjs` | runner on Copilot CLI at its tested version; shared caps |
| add | `tests/integration/cap06/copilot-runner.test.ts` | cap and argument tests with the stub host |

## Preconditions

- C002-T-002, C002-T-033 and C002-T-044 done.

## Step outline (no production code)

1. Start Copilot CLI non-interactively with the package and the case prompt, and parse its result.
2. Run one paid smoke run within $0.50.

## Verification

- `npm test -- cap06`
- `node evals/harness/run.mjs --host copilot-cli --tier dev --filter routing` (one smoke run)

## Done when

- [ ] Cap tests pass; smoke run recorded
- [ ] Progress reported: `sdd task set C002-T-045 --status done --commit <sha>`
