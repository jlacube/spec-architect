---
id: C001-T-063
title: "Delegation eval suite (claude plugin eval)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: done
depends_on: [C001-T-060, C001-T-029]
implements: [C001-REQ-1116]
satisfies_ac: [C001-AC-1116.1]
verified_by: [C001-TS-1117, C001-TC-1117, C001-TC-213, C001-TC-214, C001-TC-215, C001-TC-817]
components: [C001-COMP-12]
risk_refs: [C001-RISK-005]
estimate: M
report: { commit: b4f18b7, completed_at: 2026-10-23, notes: "Routing milestone 126/126 re-graded (72/126 raw, timeouts after correct routing), all 42 cases 3/3, off-topic 6/6, conductor rule 12/12; implicit 4/5 (reported apart); D-013 cases TS-213 9/10 (10-run check), TS-214 3/3, TS-817-stop 3/3, TS-215 1/3 waived by P-01 under D-017; npm run check exit 0 (Node 22.22.3); ~$64 notional on Max" }
---

# C001-T-063 — Delegation eval suite (claude plugin eval)

## Intent

Write ≥ 40 routing prompts (≥ 3 must-route and ≥ 1 must-not-route per agent) and tune agent descriptions until ≥ 90% correct.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/evals/` | the 42 `claude plugin eval` case folders (`prompt.md` and `graders/`): ≥ 3 must-route and ≥ 1 must-not-route per agent, plus off-topic cases. This is the PLG-EVAL-001 input. Conductor cases follow the C001-REQ-1116 note: each must-route case declares a check that its last reply contains the literal `claude --agent architect:sdd-conductor` and a check that allows 0 Architect subagent starts; each must-not-route case declares a check that fails on that literal (C001-TS-1117) |
| add | `evals/delegation/suite.mjs` | reads the case files under `plugins/architect/evals/`, reports the counts per agent and kind, and runs the suite at the tiers of C001-ADR-003; results go to `evals/results/delegation-*.json` |
| add | `scripts/check/evals.mjs` | the PLG-EVAL-001 module (`../../10-spec/50-interfaces/plugin-layout.md`): suite size, spread per agent and the declared conductor checks of C001-TS-1117 |
| modify | `scripts/package.mjs › CLAUDE_EXCLUDES` | `evals` excluded, so no package or staged plugin holds the eval cases |
| modify | `evals/cap02/TS-213.eval.mjs`, `TS-214.eval.mjs`, `TS-215.eval.mjs` | D-013 rework: the checks no longer depend on the Haiku stand-ins (planted hand-back files for TS-213 and TS-215, a fixture spec without critic blockers for TS-214). With the real specialists each case reaches the step it checks |
| modify | `evals/cap08/TS-817.eval.mjs › stop fixture` | D-013: the fixture gains the ideation critic report, so the gate is presented before the stop |
| modify | `plugins/architect/agents/*.md` | description wording only |

## Preconditions

- T-060, T-029
- Dependencies done: C001-T-060, C001-T-029

## Step outline (no production code)

1. Write prompts from IF-09 trigger-word ownership; conductor prompts per the C001-REQ-1116 note (hand-over literal, 0 Architect subagent starts).
2. Add the PLG-EVAL-001 module and the `evals` package exclude; C001-TC-1117 passes without a model session.
3. Rework TS-213, TS-214 and TS-215 for the real specialists and fix the TS-817 stop fixture (D-013); run them at dev tier.
4. Run the routing suite at milestone tier; tune descriptions; rerun.

## Verification

- C001-TC-1117 passes
- Routing accuracy ≥ 90% (C001-SC-05)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Results stored in evals/results/delegation-*.json
- [ ] C001-TC-213, C001-TC-214 and C001-TC-215 reach their checked step with the real specialists, and C001-TC-817 presents the gate before the stop (D-013)
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-063 --status done --commit <sha>` (or frontmatter fallback before T-026). That commit is the resolution evidence for closing D-013 and D-016.
