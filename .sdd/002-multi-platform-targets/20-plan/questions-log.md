---
artifact: questions-log
change: CHG-002
phase: 20-plan
---
# CHG-002 — Questions log (plan)

## Round 1 — 2026-10-15

Question from the architect's step 2 hand-back (C002-OA-009, C002-ADR-005).

### Q-replay-01 — If spike S-07 shows that OpenCode cannot be driven by a local scripted model endpoint, how does the corpus replay obtain OpenCode's permission decisions?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4 (C002-OA-009)
- **Options:** 1. Evaluate OpenCode's permission module from its source at the tested tag (Recommended) · 2. Real-model sessions with a low-cost model
- **Rejected:** scripted model endpoint (the question applies only once S-07 shows it infeasible); re-implemented matcher (not OpenCode at its tested version)
- **Answer:** OpenCode's own code (Recommended) — fallback of C002-ADR-005 if S-07 shows the stub-model driver infeasible.
- **Extracted instructions:** none

## Round 2 — 2026-10-16

Question from the test-designer's step 5 hand-back (`60-test-plan.md` §4.1). Context given with the
question: the prepaid API key has about $4.77 left of the $20 top-up of 2026-10-11, so every option
needs a top-up.

### Q-evalbudget-01 — How is CHG-002's eval evidence scoped and funded, given the DoD's 9-of-10-runs rule (~880 paid sessions, ~$130)?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 5
- **Options:** 1. A: dev tier only, revise the DoD, $25 budget (Recommended) · 2. B: keep 9 of 10, fund ~$130 · 3. C: keep 9 of 10, OpenCode evals via the Copilot provider
- **Rejected:** cheapest model tier for all evals (conflicts with C002-REQ-105, C002-DOD-009); stub-host tests instead of evals (removes the real-host evidence of C002-NFR-203)
- **Answer:** A: dev tier, $25 (Recommended) — one run per Examples row with at most one rerun after a failure; the 9-of-10 rule is revised out of C002-DOD-001, 002, 003, 006 and 007 (G2 revision); CHG-002 eval budget $25 on the prepaid API key.
- **Extracted instructions:** none

### Q-evalbudget-02 — Option A conflicts with the constitution's DOD-G-01 ("eval scenarios pass in at least 9 of 10 runs"), kept at G0. How does CHG-002 deviate from it?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 3
- **Options:** 1. Waive for CHG-002 (Recommended) · 2. Amend the constitution (G0 revision) · 3. Keep 9 of 10 after all (withdraw A)
- **Rejected:** none beyond the options
- **Answer:** Waive for CHG-002 (Recommended) — waiver of DOD-G-01's 9-of-10 clause for CHG-002 only, recorded at the G2 re-approval and at G3; the constitution stays as is.
- **Extracted instructions:** none

## Round 3 — 2026-10-16

Question from the planner's step 6 hand-back.

### Q-release-01 — Through which channel does P-01 release the OpenCode and Copilot target packages once the release check passes?
- **Blocking:** no · **Material:** no · **Candidates considered:** 2
- **Options:** 1. Zip per target in dist/, shared like the Claude Code zips today (Recommended) · 2. A git tag with the dist/ zips attached as release assets
- **Rejected:** none
- **Answer:** Zips in dist/ (Recommended)
- **Extracted instructions:** none

## Round 4 — 2026-10-16

Questions from the critic's plan review (`90-critic-report.md`, CR-1, CR-8).

### Q-evalbudget-03 — CHG-001 dev-tier sessions cost 0.20–0.52 USD (one at 0.62 USD), not 0.15 USD; the 108 planned sessions cost about 27–32 USD before reruns. How is CHG-002's eval spend bounded?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 5 (CR-1)
- **Options:** 1. Raise the budget to 40 USD with a ring-fenced reserve for the C002-M-07 release evidence (Recommended) · 2. Keep 25 USD, M-07 release evidence first · 3. Keep 25 USD, stop at the budget and decide then
- **Rejected:** cheapest model tier for every eval; stub-host tests instead of real-host evals (both rejected in Q-evalbudget-01)
- **Answer:** $40 with M-07 reserve (Recommended) — CHG-002 eval budget 40 USD on the prepaid API key with a reserve for the C002-M-07 release evidence; P-01 tops up at least about 35.23 USD before the first paid run.
- **Extracted instructions:** none

### Q-regression-01 — Do the planned test edits that extend existing mirrors (frontend.test.ts command names and ERR-CLI-019/020; smoke.test.ts plugin.json version source) count as changed expectations under C002-REQ-623?
- **Blocking:** no · **Material:** no · **Candidates considered:** 2 (CR-8)
- **Options:** 1. No: additions that extend a mirror are not changed expectations (Recommended) · 2. Yes: raise a spec defect against C002-REQ-623
- **Rejected:** none
- **Answer:** No, additions only (Recommended) — record this reading in regression-set §4 and C002-T-048.
- **Extracted instructions:** none

## Round 5 — 2026-10-16

Question from the critic's plan re-review (`90-critic-report.md`, CR-18).

### Q-evalbudget-04 — Which account pays the model calls of P-01's OpenCode clean-profile run to gate G1 (C002-T-051)?
- **Blocking:** no · **Material:** no · **Candidates considered:** 3 (CR-18)
- **Options:** 1. Prepaid key, from the C002-M-07 reserve (Recommended) · 2. Prepaid key, from the general pool · 3. P-01's own provider account, outside the CHG-002 budget
- **Rejected:** none
- **Answer:** Key, M-07 reserve (Recommended)
- **Extracted instructions:** none

## Round 6 — 2026-10-16

P-01's statements after G3 (chat, with a screenshot of the GitHub Copilot usage page).

### Q-copilot-01 — How is P-01's Copilot usage billed, and which spike runs first?
- **Blocking:** no · **Material:** yes · **Candidates considered:** n/a (P-01 statement)
- **Answer:** P-01: "premium requests doesn't exist anymore, now it's AI Credits, which is similar to per token"; the usage page shows 1,500 included AI credits and additional usage enabled with a 50 USD budget. P-01: "yes, do the updates on the test plan. do first the GitHub Copilot tests."
- **Extracted instructions:** record the AI-Credit estimate (test plan §4.4); run C002-T-002 (S-08) before C002-T-001.

### Q-opencode-01 — OpenCode model inference (open)
- **Blocking:** yes for C002-T-001 · **Material:** yes
- **Statement:** P-01: "for OpenCode, let's discuss afterwards, as we might need to adjust some stuffs, as I actually use only OpenRouter on OpenCode for model inference". The plan bills OpenCode eval sessions to the prepaid Anthropic API key; with OpenRouter they bill P-01's OpenRouter account. To discuss before C002-T-001.
- **Answer (2026-10-18):** P-01: "yes claude to establish the same baseline. yes opencode uses openrouter. no monthly cap, but stop at 40$ and we will advise". OpenCode's agents use Claude models of the C002-REQ-105 tiers through OpenRouter (model ids `openrouter/anthropic/claude-…`, recorded by S-07); OpenCode eval sessions bill P-01's OpenRouter account; stop at 40 USD of OpenRouter spend for CHG-002 and ask P-01. P-01 on the npm check (C002-T-003): "I will check and ask when it is the time".

## Round 7 — 2026-10-17

Questions from the architect's and planner's D-003 hand-backs.

### Q-versions-02 — Which Copilot Chat version did the VS Code Insiders runs of S-08 use?
- **Blocking:** no · **Material:** no · **Candidates considered:** 2
- **Options:** 1. 0.35.3 as written (Recommended) · 2. P-01 reads another version
- **Answer:** 0.35.3 is fine (Recommended) — the tested pair is VS Code Insiders 1.142.0-insider with Copilot Chat 0.35.3.
- **Extracted instructions:** none

### Q-serena-ctx-01 — Which Serena --context does the Copilot mapping table use for VS Code?
- **Blocking:** no · **Material:** no · **Candidates considered:** 2
- **Options:** 1. C002-T-024 takes it from Serena's context list at the tested Serena version and records it; C002-T-050 confirms Serena starts (Recommended) · 2. Name it in the spec (C002-IF-001 §6.2)
- **Answer:** Decide in T-024 (Recommended)
- **Extracted instructions:** none

## Round 8 — 2026-10-18

P-01's statements in chat.

### Q-evalauth-01 — Billing route of the Claude Code eval sessions
- **Blocking:** no · **Material:** yes · **Candidates considered:** n/a (P-01 statement)
- **Answer:** P-01 upgraded to the Claude Max plan ("upgrade to Max done") and asked for an eval auth switch: "add some small work to make the eval runs through the Claude Code subscription instead of the API (with a flag/config to switch)", then "first to add to D-003 fix round and then start building and validate". Built and validated as C002-T-060 (98e6353, 6de8656); Claude Code eval sessions run with `--auth subscription`; `--auth api-key` stays available.
- **Extracted instructions:** none

## Round 9 — 2026-10-18

Question from the planner's billing revision.

### Q-openrouter-01 — Should a 40 USD credit limit be set on a dedicated OpenRouter key for CHG-002, as a hard backstop to the ledger's stop rule?
- **Blocking:** no · **Material:** no · **Candidates considered:** 2
- **Options:** 1. Yes, a 40 USD limit on a dedicated CHG-002 key (Recommended) · 2. No key limit; ledger stop rule only
- **Answer:** Yes, $40 key limit (Recommended) — P-01 creates a dedicated OpenRouter key for CHG-002 with a 40 USD credit limit and configures OpenCode with it (C002-T-001 step 1).
- **Extracted instructions:** none

## Round 10 — 2026-10-18

P-01's statements on the prerequisites of C002-T-001 and C002-T-003.

### Q-prereq-01 — OpenRouter key and npm account
- **Blocking:** no · **Material:** no · **Candidates considered:** n/a (P-01 statements)
- **Answer:** P-01: "OpenRouter key with 50$ limit created"; "npm account jlacube - valid and package name architect-sdd free"; npm 2FA: "2FA on for publish"; budget: "Keep: stop at $40, key $50 (Recommended)" — the ledger stop rule stays at 40 USD of OpenRouter spend; the 50 USD key limit is the hard backstop. The OpenRouter key lives only in OpenCode's credential store (`opencode auth list` shows one OpenRouter credential; OpenCode 1.15.10), never in the repository.
- **Extracted instructions:** none

## Round 11 — 2026-10-18

Questions on the S-07 record (C002-T-001).

### Q-s07-01 — S-07 sign-off, OpenCode version pin, spec facts
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 2 per question
- **Answer:** sign-off: "Sign off"; version: "Re-test on 1.18.31 (Recommended)" — the PATH `opencode` (npm shim, 1.18.31) becomes the tested version; the free stub-model sample is re-run on 1.18.31 and the record updated (outcomes that change are put to P-01 again); spec facts: "One spec revision now (Recommended)" — one defect for the S-07 facts plus D-004…D-008, one revision round, then G2/G3; C002-T-024 waits for it.
- **Extracted instructions:** none

### Q-s07-02 — S-07 re-test on 1.18.31 and the Node version of REF-WIN
- **Blocking:** no · **Material:** yes · **Candidates considered:** 2 per question
- **Answer:** re-test: "Confirm" — OpenCode 1.18.31 is the tested version, the harness pins its binary; Node: "Upgrade Node (Recommended)" — P-01 updates REF-WIN to the current Node 22.x LTS (≥ 22.22.2, F-10); the conductor re-runs `npm run check` afterwards.
- **Extracted instructions:** none

## Round 2026-10-23 — defect D-029 (found in C001-T-076)

### Q-tc-lint-01 — CHG-002 test plan against LINT-TC-001 (C001-REQ-609)
- **Options:** 1. CHG-002 plan revision: Fixture column renamed Test data, the CHG-002 levels recorded as integration with the former name kept as a sub-kind, an Executor column for manual cases; no test meaning changes (Recommended) · 2. CHG-001 spec revision widening C001-REQ-609 to the extra levels and a Fixture column
- **Answer:** P-01: "Revise CHG-002 plan (Recommended)"; commit order: "After the fix (Recommended)" (C001-T-076 lands with the revision)
- **Extracted instructions:** none

## Round 2026-10-23 — defects D-023, D-024, D-028

### Q-c002-defects-01 — scope of the open CHG-002 defects
- **Options:** 1. One CHG-002 revision and one fix task for D-028, D-024 and D-023 item 2 (automatic spend reconciliation); D-023 item 1 (proportionate rework path after a Revise) deferred to a later change, D-023 closed as deferred (Recommended) · 2. Fix all, including the rework path with paid evals on three hosts · 3. Defer all three
- **Answer:** P-01: "Fix most, defer D-023(1) (Recommended)"
- **Extracted instructions:** none

### Q-key-redact-01 — OpenRouter key in host- or model-emitted text (C002-REQ-639)
- **Options:** 1. The runner replaces the key's value with [REDACTED] in every line and file it writes, host and model output included (Recommended) · 2. Runner's own writes only, stated in the REQ-639 rationale
- **Answer:** P-01: "Redact host text too (Recommended)"
- **Extracted instructions:** none

### Q-model-refusal-01 — missing-model refusal on an injection row (critic CR-95)
- **Options:** 1. Count it as a no-run refusal: no entry, no lock; the record keeps host_versions and spend unreported (Recommended) · 2. Keep it a real session and state the lock in the spec
- **Answer:** P-01: "Count as no-run (Recommended)"
- **Extracted instructions:** none

### Q-t067-order-01 — do T-052 and T-055 wait for C002-T-067 (planner)
- **Options:** 1. No dependency; land T-067 before the release checks where possible (Recommended) · 2. T-052 and T-055 depend on T-067
- **Answer:** P-01: "No dependency (Recommended)"
- **Extracted instructions:** none

### Q-ts208-fixture-01 — D-026 item 3 (TS-208 fixture placeholder options) (planner)
- **Options:** 1. Defer with D-023 item 1 to a later change (Recommended) · 2. Fix in CHG-002 with a spec revision and one more paid OpenCode session
- **Answer:** P-01: "Defer with D-023(1) (Recommended)"
- **Extracted instructions:** none

## Round 2026-10-24 — defect D-030 (found in C001-T-082)

### Q-cap-exc-01 — eval caps for the CHG-001 cases `TS-223` and `TS-224`
- **Options:** 1. Add rows to the C002-IF-010 §2.2 cap-exception table like TS-215 (1.50 USD, subscription), with caps.mjs and its test; the scenarios stay as approved (Recommended) · 2. Change `TS-223`/`TS-224` to dispatch the cartographer directly (about 0.30 USD a run), a CHG-001 G2 change
- **Answer:** P-01: "Add cap exceptions (Recommended)"
- **Extracted instructions:** none

### Q-cap-exc-02 — release cases without capped Max-plan evidence (architect)
- **Options:** 1. Measure now: one Max-plan session per case at 0.50 USD (CHG-001 cases `TS-802`, `TS-804-unattended`, `TS-320`, `TS-507`, `TS-508`, `TS-711`, `TS-1001`, `TS-1013`; about 3 USD notional), then add rows in this revision (Recommended) · 2. Leave them at the defaults
- **Answer:** P-01: "Measure now (Recommended)"
- **Extracted instructions:** none

## Round 2026-10-24 — defect D-031 (found in C001-T-082)

### Q-budget-hide-01 — the model sees its session budget in Claude Code evals
- **Options:** 1. Hide the budget: the eval harness stops a session itself when the cost reaches the cap and passes no budget to Claude Code; narrow CHG-002 revision, harness change with offline tests, one paid check (about 3 USD notional) (Recommended) · 2. Raise caps for the affected rows · 3. Accept as is under RISK-038
- **Answer:** P-01: "Hide the budget (Recommended)"
- **Extracted instructions:** none

## Round 2026-10-24 — defect D-033 (found in C001-T-082)

### Q-cap-level-01 — rerun cap for full-flow CHG-001 cases now that the budget is hidden
- **Options:** 1. Rule-1 rows of the Claude Code subscription class run at 3 USD notional; measure after the CHG-001 D-019 fixes (Recommended) · 2. Keep 1.50 USD
- **Answer:** P-01: "Raise to $3 (Recommended)"
- **Extracted instructions:** none

### Q-release-base-01 — CHG-002 release base after the CHG-001 fixes (critic CR-71)
- **Options:** 1. Retake after the fixes: release from a commit with all CHG-001 fixes; before T-052 re-run the unpaid steps and the ~31 paid OpenCode rows from the general pool (about 5.40 USD of OpenRouter spend) (Recommended) · 2. Release an older release-candidate commit before the CHG-001 fixes, no paid re-run
- **Answer:** P-01: "Retake after fixes (Recommended)"
- **Extracted instructions:** none

### Q-copilot-retake-01 — retake the 24 paid Copilot CLI release sessions too (planner, C002-T-071)
- **Options:** 1. Retake them too at the release-candidate commit with the CHG-001 fixes (about 3.4 USD, Copilot pool) (Recommended) · 2. Keep the C002-T-054 sessions
- **Answer:** conductor, under P-01's standing approval and Q-release-base-01 ("Retake after fixes"): option 1, within the approved Copilot limit of 30 USD
- **Extracted instructions:** none

## Round 2026-10-24 — defect D-034 (found in C001-T-082)

### Q-early-stop-01 — full-flow sessions run to the cap after their check
- **Options:** 1. Stop when checked: each case declares when its check is decided, and the runner ends the session there; narrow revision, harness task, one small paid check (Recommended) · 2. Keep 3 USD and run to the cap
- **Answer:** P-01: "Stop when checked (Recommended)"
- **Extracted instructions:** none

### Q-weekly-reset-01 — weekly reset for the remaining paid runs
- **Answer:** P-01: "It seems I won't have any free weekly reset, it only applies to 5-hours limits under certain conditions" — the week stays capped at 95 %; long eval blocks span the weekly reset (Tuesday 23:00 UTC)

### Q-inj21-01 — INJ-21 capped and acted upon, OpenCode 0.0.1 refused (C002-T-071)
- **Options:** 1. Version 0.0.2 and a 1 USD cap exception for INJ-21 (OpenCode, and Copilot CLI if needed); retake both targets' paid evidence (Recommended) · 2. Release only Copilot at 0.0.1 · 3. Pause
- **Answer:** P-01: "0.0.2 + cap for INJ-21 (Recommended)"
- **Extracted instructions:** none

### Q-pool-retake-01 — the 0.0.2 retake's OpenCode rows from the release reserve (planner, C002-T-071)
- **Options:** 1. Use the reserve for the remainder the general pool's stop rule refuses, keeping 1.40 USD for C002-T-051 step 3; total within 40 USD (Recommended) · 2. Stop at the general pool
- **Answer:** P-01: "Yes, use the reserve (Recommended)"
- **Extracted instructions:** none


### P-01 instruction 2026-10-24 — secure the Claude Code and Copilot CLI versions first (critic CR-81)
- **Words:** "ok finish and secure Claude Code + GH Copilot CLI version. I will handle VScode GH Copilot tests tomorrow or on Monday"
- **Effect:** conductor exception recorded in the handoff: C001-T-082's TS-213 sessions and C002-T-071 run before C002-T-072.

### Correction note (2026-10-28, critic CR-81)
- The Q-weekly-reset-01 gloss first said "Monday 23:00 UTC"; the usage readout gives Tuesday 2026-10-27 23:00 UTC (P-01 pointed out the weekday). It was corrected in place on 2026-10-24.

### Q-copilot-002-01 — run the 24 Copilot CLI release sessions at 0.0.2 (C002-T-071)
- **Answer:** P-01: "Run Copilot now (Recommended)"

### Q-opencode-defer-01 — OpenCode release after INJ-21 capped again at 0.0.2 (C002-T-071)
- **Options:** 1. Defer OpenCode: release Copilot (and npm architect-sdd) first; OpenCode waits for a proper fix (early stop or bounded case for OpenCode injection rows) in a later version; no more OpenRouter spend now (Recommended) · 2. Try once more at 0.0.3 with a 2 USD cap · 3. Fix the INJ-21 case, then 0.0.3
- **Answer:** P-01: "Defer OpenCode (Recommended)"
- **Extracted instructions:** none

### Q-noask-01 — conductor without a question tool (found in C002-T-071)
- **Options:** 1. Text fallback: the conductor asks its question or presents the gate as plain text in its reply and ends its turn; Copilot 0.0.3 with its 24 sessions retaken (Recommended) · 2. Harness change only (question tool on with scripted answers) · 3. Pause releases
- **Answer:** P-01: "Text fallback + 0.0.3 (Recommended)"
- **Extracted instructions:** none

### Q-opencode-scope-01 — the deferred OpenCode release: in CHG-002 or a new change (critic CR-85)
- **Options:** 1. Move to a new change: a scope revision drops C002-T-051 and C002-T-052, marks the OpenCode DoD items as moved, and a later CHG-003 "OpenCode release" carries the early-stop or INJ-21 fix; CHG-002 closes after the Copilot release (Recommended) · 2. Keep it in CHG-002 at a later version
- **Answer:** P-01: "Move to a new change (Recommended)"
- **Extracted instructions:** none
