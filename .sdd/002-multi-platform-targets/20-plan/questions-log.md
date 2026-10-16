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
