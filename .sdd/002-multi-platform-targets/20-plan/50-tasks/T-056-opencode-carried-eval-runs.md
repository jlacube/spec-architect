---
id: C002-T-056
title: "OpenCode dev-tier runs of the carried eval rows"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: in-progress
depends_on: [C002-T-038, C002-T-044, C002-T-063]
implements: [C002-REQ-608, C002-REQ-610]
satisfies_ac: [C002-AC-608.1, C002-AC-610.1]
verified_by: [C002-TS-113, C002-TS-132, C002-TS-133, C002-TS-211, C002-TS-215, C002-TS-217, C002-TS-219, C002-TS-221, C002-TS-222, C002-TS-223, C002-TS-230, C002-TS-316, C002-TS-506, C002-TS-507, C002-TS-509, C002-TS-510, C002-TS-511, C002-TS-512, C002-TS-513, C002-TS-514, C002-TS-515, C002-TS-613, C002-TS-634, C002-TS-635, C002-TS-639, C002-TC-113, C002-TC-132, C002-TC-133, C002-TC-211, C002-TC-215, C002-TC-217, C002-TC-219, C002-TC-221, C002-TC-222, C002-TC-223, C002-TC-230, C002-TC-316, C002-TC-506, C002-TC-507, C002-TC-509, C002-TC-510, C002-TC-511, C002-TC-512, C002-TC-513, C002-TC-514, C002-TC-515, C002-TC-613, C002-TC-634, C002-TC-635, C002-TC-639]
components: [C002-COMP-009]
risk_refs: [C002-RISK-015]
estimate: L
report: { commit: null, completed_at: null, notes: "Partial edd5fa9: 12 pass, TS-507 fail (run_command error results rejected by OpenCode MCP client, -32602, defect D-017), 18 sessions 402 (OpenRouter account credit out; valid_run false). T-056 spend 3.92 USD, OpenRouter total 4.22 of 40. Remaining ~31 sessions after top-up and the D-017 fix." }
---

# C002-T-056 — OpenCode dev-tier runs of the carried eval rows

## Intent

Run, on the OpenCode target at its tested version (E-OCE), every OpenCode eval row that earlier tasks
wrote and carried to the OpenCode runner: the generator cases, the question-tool cases, the doctor
cases and the gate cases with the C001-CAP-02 interview and gate cases (test plan §4.2, verification
tooling row). These rows are the evidence of C002-DOD-001, C002-DOD-002 and C002-DOD-006 for OpenCode.
They bill P-01's OpenRouter account from the OpenRouter general pool, outside the reserve for the
release evidence (Q-evalbudget-03, Q-opencode-01).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `evals/results/t056-*.json` | one result per session (host, host version, model IDs, tokens, spend, transcript path) |
| modify | `evals/results/spend-chg002.json` | the spend of every session |
| modify | `evals/targets/**/*.eval.mjs` | only to fix a case defect found here, never to weaken an assertion (case files of C002-T-026, C002-T-027, C002-T-037, C002-T-038, C002-T-044); a product defect reopens the owning task instead |

The infeasible-driver branch of `10-strategy.md` §4 is not taken (S-07 §4: the stub-model driver is
feasible), so C002-TC-133, 211, 222 and 223 stay replay cases of C002-T-042 and no
`evals/targets/opencode-host/TS-{133,211,222,223}.eval.mjs` file is written.

## Preconditions

- C002-T-038 (doctor case files) and C002-T-044 (runner, gate case files) done; C002-T-026,
  C002-T-027 and C002-T-037 done through them.
- C002-T-063 done: the case files of C002-TC-509 and C002-TC-515 follow the revised scenarios (the
  OpenCode rows that need a PATH `sdd` use the package generated for native permission enforcement),
  so no paid session runs an outdated row.
- OpenCode at its tested version (1.18.31, started as the pinned host binary with its own
  `OPENCODE_DB`, C002-ADR-005) with the Claude model tiers of the S-07 record, through P-01's
  OpenRouter account (C002-T-001 step 1); REF-WIN on Node.js 22.22.2 or later.
- The conductor's re-estimate of the checkpoints of test plan §4.1 (S-07 probes, C002-T-044 smoke),
  when one was triggered, has been shown to P-01.
- The general pool's stop rule of test plan §4.1 allows the next session (general-pool total plus H
  within 30 USD; reserve spend does not count against it).

## Step outline (no production code)

1. List the carried rows from the task reports of C002-T-026, C002-T-027, C002-T-037, C002-T-038 and
   C002-T-044 and check the list against the session count of test plan §4.2 (verification tooling
   row, about 48 sessions besides the C002-T-044 smoke).
2. Run the generator, question-tool and doctor rows (C002-TC-113, 132, the OpenCode rows of 215, 217,
   219, 221, C002-TC-230, 316, 506, 507, 509 … 515, 639), one run per Examples row, at most one rerun
   after a failure.
3. Run C002-TC-613 with the C001-CAP-02 interview and gate cases, C002-TC-634 and C002-TC-635, with
   scripted `question` answers (S-07 recorded `question_answerable_by_script: true`).
4. Not used: the infeasible-driver branch of `10-strategy.md` §4 is not taken.
5. Before every session check the ledger by the general pool's stop rule of test plan §4.1 and add the
   session's spend after it, with `provider` `openrouter` and pool `general`. At the stop, pause and
   ask P-01; never spend the reserve here.

## Verification

- `node evals/harness/run.mjs --host opencode --tier dev` with the case files of steps 2 and 3
- The general-pool total of the ledger stays within 30 USD

## Done when

- [ ] Every carried OpenCode row passes, or is reported not applicable with its record cited
- [ ] Every session is in the ledger
- [ ] Progress reported: `sdd task set C002-T-056 --status done --commit <sha>`
