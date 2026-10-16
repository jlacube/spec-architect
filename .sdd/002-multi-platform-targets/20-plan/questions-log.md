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
- **Answer:** pending
