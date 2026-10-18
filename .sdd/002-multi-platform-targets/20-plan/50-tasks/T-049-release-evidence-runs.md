---
id: C002-T-049
title: "Release evidence for OpenCode: corpus replay and dev-tier evals on the tested host"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-036, C002-T-041, C002-T-043, C002-T-044, C002-T-048, C002-T-056]
implements: [C002-NFR-201, C002-NFR-202, C002-NFR-203]
satisfies_ac: [C002-AC-606.1, C002-AC-609.1]
verified_by: [C002-TS-608, C002-TS-609, C002-TS-612, C002-TC-608, C002-TC-609, C002-TC-612]
components: [C002-COMP-008, C002-COMP-009]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-049 — Release evidence for OpenCode: corpus replay and dev-tier evals on the tested host

## Intent

Produce the OpenCode evidence that the release check reads, independently of the Copilot target
(C002-T-054). For each mechanism in use on the OpenCode target, a corpus replay runs under
PowerShell 7 and Git Bash on REF-WIN, with Developer Mode on so that `file-symlink` is present
(C002-DOD-008). The dev-tier routing cases and at least 20 injection cases run on the tested OpenCode
version (C002-DOD-009, C002-NFR-203). These paid sessions bill P-01's OpenRouter account and draw on
the OpenRouter reserve that P-01 ring-fenced for the release evidence (Q-evalbudget-03,
Q-opencode-01).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/opencode/<version>/replay-*.json`, `injection.json` | evidence of the OpenCode target |
| modify | `evals/results/spend-chg002.json` | the spend of step 3 (`provider` `openrouter`, pool `reserve`) and of any step 4 re-run (pool `general`) |

## Preconditions

- C002-T-036, C002-T-041, C002-T-043, C002-T-044, C002-T-048 and C002-T-056 done; OpenCode at its
  tested version.
- The release-candidate commit is the commit recorded by C002-T-048. If a source, harness or root
  file changed since, C002-T-048 step 5 is re-run first.
- The OpenRouter reserve of test plan §4.1 still covers the sessions of step 3; OpenCode uses P-01's
  OpenRouter account with the S-07 model ids.

## Step outline (no production code)

1. Build the release candidate with `npm run package` at the release-candidate commit; this writes
   `dist/opencode/` and `dist/architect-opencode-<version>.zip` (C002-T-034).
2. Run `npm run replay` for every OpenCode mechanism in use, under both shells.
3. **Paid runs on E-OCE (C002-TC-612):** the routing cases (about 10) and at least 20 injection cases,
   one run each, at most one rerun after a failure. Run them before any optional rerun of an earlier
   row. Check the ledger before every session by the stop rule of test plan §4.1 and add its spend
   after it; at the stop, the runs pause and P-01 is asked and decides.
4. Fix product defects found here through the owning task (reopen it), never by editing evidence.
   A fix moves the release-candidate commit. Then re-run, at the new commit:
   - always, unpaid: C002-T-048 step 5 and steps 1 and 2 of this task (package and replay); the
     release check of C002-T-047 reads the new evidence;
   - paid, only the step 3 rows that the fix can change: every row when the fix changed a file that
     the OpenCode package is generated from or that the OpenCode runner loads (`git diff` between the
     two release-candidate commits under `plugins/architect/`, `src/`, `scripts/generate/` or
     `evals/harness/`), plus every row that failed; no paid row when the fix touched only tests,
     documents or the Copilot target.
   The paid re-runs are **general-pool** sessions (test plan §4.1, critic CR-20): each starts only while
   the general pool's stop rule allows it, and the reserve's room is not used for them. When the general
   pool says stop, no re-run starts; the stop and both pool totals go into the task report, and P-01
   decides.

## Verification

- `npm run replay -- --all` for the OpenCode mechanisms
- `node evals/harness/run.mjs --host opencode --tier dev` with the routing and injection cases

## Done when

- [ ] 0 differing decisions in every OpenCode replay report; 0 instructions acted upon over ≥ 20 injection cases
- [ ] The sessions of step 3 are in the ledger within the reserve, and any step 4 re-run within the general pool
- [ ] Progress reported: `sdd task set C002-T-049 --status done --commit <sha>`
