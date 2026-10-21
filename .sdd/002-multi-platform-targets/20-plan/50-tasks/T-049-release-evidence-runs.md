---
id: C002-T-049
title: "Release evidence for OpenCode: corpus replay and dev-tier evals on the tested host"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: done
depends_on: [C002-T-023, C002-T-036, C002-T-041, C002-T-043, C002-T-044, C002-T-048, C002-T-056, C002-T-064]
implements: [C002-NFR-201, C002-NFR-202, C002-NFR-203, C002-NFR-801]
satisfies_ac: [C002-AC-606.1, C002-AC-609.1]
verified_by: [C002-TS-608, C002-TS-609, C002-TS-612, C002-TC-608, C002-TC-609, C002-TC-612]
components: [C002-COMP-008, C002-COMP-009]
risk_refs: []
estimate: M
report: { commit: 8fe19c8, completed_at: 2026-10-21, notes: "Release check dry run: opencode 0.0.1 (sdd-mcp-server) released. OpenRouter key usage 24.67 of 40 (reserve 5.36 of 10). Candidates: injection summary overwritten by a single-row rerun; routing family = cap02 TS-206…212+222 (also TC-613 rows, paid twice); TS-208 fixture placeholder options." }
---

# C002-T-049 — Release evidence for OpenCode: corpus replay and dev-tier evals on the tested host

## Intent

Produce the OpenCode evidence that the release check reads, independently of the Copilot target
(C002-T-054). For each mechanism in use on the OpenCode target, a corpus replay runs under
PowerShell 7 and Git Bash on REF-WIN, with Developer Mode on so that `file-symlink` is present
(C002-DOD-008). The dev-tier routing cases and at least 20 injection cases run on the tested OpenCode
version (C002-DOD-009, C002-NFR-203). These paid sessions bill P-01's OpenRouter account and draw on
the OpenRouter reserve that P-01 ring-fenced for the release evidence (Q-evalbudget-03,
Q-opencode-01). It also takes the C002-DOD-020 evidence at the release-candidate commit: the SPDX
header scan of the tarball and of both generated target folders (`--spdx dist/opencode --spdx
dist/copilot`, C002-IF-005 §6), moved here from C002-T-023 (plan critic CR-33). One `npm run package`
writes both folders, so the scan needs no Copilot release task.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/opencode/<version>/replay-*.json`, `injection.json` | evidence of the OpenCode target |
| modify | `evals/results/spend-chg002.json` | the spend of step 3 (`provider` `openrouter`, pool `reserve`) and of any step 4 re-run (pool `general`) |

## Preconditions

- C002-T-023 (the tarball check with its `--spdx` option), C002-T-036, C002-T-041, C002-T-043,
  C002-T-044, C002-T-048 and C002-T-056 done; OpenCode at its tested version.
- C002-T-064 done: the server's error results are text-only and the `sdd-mcp-server` adapter reads
  their code from the text (C002-IF-009 §2.3); the release check requires the replay reports of the
  mechanisms of the package's mode only (C002-IF-009 §5, revised for D-016 item 5: under
  `sdd-mcp-server`, `replay-sdd-mcp-server.json`; under `native-permissions`,
  `replay-opencode-permissions.json`).
- The release-candidate commit is the commit recorded by C002-T-048. If a source, harness or root
  file changed since, C002-T-048 step 5 is re-run first.
- The OpenRouter reserve of test plan §4.1 still covers the sessions of step 3; OpenCode uses P-01's
  OpenRouter account with the S-07 model ids.

## Step outline (no production code)

1. Build the release candidate with `npm run package` at the release-candidate commit; this writes
   `dist/opencode/` and `dist/architect-opencode-<version>.zip` (C002-T-034), with `dist/copilot/`
   and the tarball. Then run the tarball check with both target folders (C002-DOD-020 evidence:
   TGT-NPM-001 and the SPDX scan of the tarball, `dist/opencode/` and `dist/copilot/`); a finding is
   a product defect of the owning task (step 4).
2. Run `npm run replay` for every OpenCode mechanism in use, under both shells.
3. **Paid runs on E-OCE (C002-TC-612):** the OpenCode case set of C002-IF-010 §5.1 (named by
   revision D-026 item 2): the routing family, the eight rows `TS-206` … `TS-212` and `TS-222`, one in
   each of `evals/cap02/TS-206.eval.mjs` … `evals/cap02/TS-212.eval.mjs` and
   `evals/cap02/TS-222.eval.mjs`, and the injection family `INJ-01` … `INJ-22` of
   `evals/injection/injection.eval.mjs`, 30 sessions; one run each, at most one rerun after a
   failure. Run them before any optional rerun of an earlier row. Check the ledger before every
   session by the stop rule of test plan §4.1 and add its spend after it; at the stop, the runs pause
   and P-01 is asked and decides. The eight routing rows are also interview cases of C002-TC-613
   (C002-T-056); they run here again at the release-candidate commit (C002-IF-010 §5.1 "Overlap on
   OpenCode").

**Revision D-026/D-027 (after this task was done).** This step ran in commit 8fe19c8 with exactly
that case set (the eight routing rows, `TS-208` with one rerun after its assertion fix, and the 22
injection rows), so the revision changes no row and no session reruns. The committed
`docs/releases/opencode/0.0.1/injection.json` holds all 22 rows of the OpenCode injection case set,
0 acted upon, and validates against the revised `$defs/injectionSummary`, whose `result` and
`models` are optional: the merge of C002-IF-010 §5.2 accepts it as the base of a later run, and the
release check reads it as before. It was written before `run.mjs` gave entries `result` and `models`
(C002-T-066), so its entries name no result file. For the clause of C002-DOD-009 that each entry
names the result file of its session, P-01 answered Q-inj-result-01 "Backfill, no spend
(Recommended)" (`../../10-spec/questions-log.md`): C002-T-066 step 8 copies `result` and `models`
into each entry from the counted `t049-INJ-*` result file of its row, by script and without a
session, with `acted_upon` and the entry count unchanged. C002-T-066 is the catch-up of the revision, not
a fix of a defect this step found in the product: it changes no file the OpenCode package is
generated from, and under `evals/harness/` only the summary writing, the model options of
`run.mjs` and the Copilot CLI runner, none of which changes what an OpenCode session does. The paid
re-run rule of step 4 therefore does not apply to it, and no OpenCode row reruns; the unpaid re-runs
of step 4 (C002-T-048 step 5, steps 1 and 2 of this task, the release check) follow the new
release-candidate commit as usual.
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

- `node scripts/check/tarball.mjs dist/architect-sdd-<version>.tgz --spdx dist/opencode --spdx dist/copilot`
  (C002-DOD-020 evidence, at the release-candidate commit)
- `npm run replay -- --all` for the OpenCode mechanisms
- `node evals/harness/run.mjs --host opencode --tier dev --pool reserve` with the case files of the
  OpenCode case set of C002-IF-010 §5.1 (`evals/cap02/TS-206.eval.mjs` … `TS-212.eval.mjs`,
  `evals/cap02/TS-222.eval.mjs`, `evals/injection/injection.eval.mjs`)

## Done when

- [ ] The tarball check with `--spdx dist/opencode --spdx dist/copilot` reports 0 findings at the release-candidate commit (C002-DOD-020)
- [ ] 0 differing decisions in every OpenCode replay report, each in the format of C002-IF-009 §2 as revised (`detail` holding the server's result text, the total `sdd-mcp-server` mapping of §2.3); 0 instructions acted upon over ≥ 20 injection cases
- [ ] Every result record and result file of step 3 carries `auth` and `api_key_source` `openrouter-key-file` (C002-IF-010 §3), and no key text occurs in a result, transcript or log line
- [ ] The sessions of step 3 are in the ledger within the reserve, and any step 4 re-run within the general pool
- [ ] Progress reported: `sdd task set C002-T-049 --status done --commit <sha>`
