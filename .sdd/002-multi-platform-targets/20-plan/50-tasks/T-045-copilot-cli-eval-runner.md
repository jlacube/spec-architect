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
verified_by: [C002-TS-513, C002-TS-526, C002-TS-614, C002-TS-615, C002-TC-513, C002-TC-526, C002-TC-614, C002-TC-615]
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
- The Copilot subscription named in C002-T-002 has allowance left for the sessions of steps 3 and 4
  (C002-RISK-026). These sessions are not billed to the prepaid API key.

## Step outline (no production code)

1. Start Copilot CLI non-interactively with the package and the case prompt, and parse its result.
2. Reuse the caps of `evals/harness/caps.mjs` (C002-T-044) and the host selection of
   `evals/harness/session.mjs` without changing its signature.
3. **Smoke run on E-CPC:** one routing case within $0.50.
4. **Carried Copilot CLI rows on E-CPC:** the Copilot CLI rows of C002-TC-513 (3) and C002-TC-526,
   one run each, at most one rerun after a failure. The release rows (C002-TC-615) run in C002-T-054.
5. If S-08 recorded `copilot_cli_loads_package: false`: follow the row of `10-strategy.md` §4. Steps 3
   and 4 run only the cases the record shows to work without the package; the other rows are
   reported not applicable with the record cited.

## Verification

- `npm test -- cap06`
- `node evals/harness/run.mjs --host copilot-cli --tier dev --filter routing --only <one routing case ID>`
  (one smoke run; `--host` and `--filter` of C002-T-044 step 2)
- `node evals/harness/run.mjs --host copilot-cli --tier dev` with `evals/targets/doctor/TS-513.eval.mjs` and `TS-526.eval.mjs`

## Done when

- [ ] Cap tests pass; smoke run and the carried rows of step 4 recorded (or reported not applicable per step 5)
- [ ] C002-TC-615 listed in the task report as carried to C002-T-054
- [ ] Progress reported: `sdd task set C002-T-045 --status done --commit <sha>`
