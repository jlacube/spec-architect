---
id: C002-T-038
title: "Doctor host rows, version checks and the toolchain record per host"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-05
status: todo
depends_on: [C002-T-013, C002-T-014, C002-T-028, C002-T-060]
implements: [C002-REQ-504, C002-REQ-505, C002-REQ-506, C002-REQ-507, C002-REQ-508, C002-REQ-509, C002-REQ-510]
satisfies_ac: [C002-AC-504.1, C002-AC-505.1, C002-AC-506.1, C002-AC-507.1, C002-AC-508.1, C002-AC-509.1, C002-AC-510.1]
verified_by: [C002-TS-506, C002-TS-507, C002-TS-508, C002-TS-509, C002-TS-510, C002-TS-511, C002-TS-512, C002-TS-513, C002-TS-514, C002-TS-515, C002-TS-516, C002-TS-526, C002-TS-639, C002-TC-506, C002-TC-507, C002-TC-508, C002-TC-509, C002-TC-510, C002-TC-511, C002-TC-512, C002-TC-513, C002-TC-514, C002-TC-515, C002-TC-516, C002-TC-526, C002-TC-639]
components: [C002-COMP-014, C002-COMP-015, C002-COMP-016, C002-COMP-002]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-038 — Doctor host rows, version checks and the toolchain record per host

## Intent

Make the doctor table and the toolchain record host-dependent through wiring variants (C002-IF-006).
The table gains a host row (C002-REQ-504), an sdd CLI row on the generated targets with the exact
version check (C002-REQ-509) and an `untested` status for an unrecorded host version
(C002-REQ-508). On Copilot in VS Code it gains a hooks row in both enforcement modes, because the
Copilot subagent guard hook is a PreToolUse hook in both (C002-REQ-510, C002-REQ-327): `ok` only when
hooks are read as enabled, `error` when they are disabled or the state cannot be read. The failure conditions of
C002-REQ-505 apply. On Claude Code the minimum-version row stays (C002-REQ-506), and the source
`commands/doctor.md` text does not change, so `TS-1116` stays green.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/targets/{opencode,copilot}/wiring/doctor-*.md` | final host rows, probes (`sdd host-version`, `sdd --version`), outcome and remedies with the tested versions from the tables; the Copilot variant probes `sdd host-version vscode-insiders` while the table's tested VS Code version ends in `-insider` (the S-08 tested build, C002-IF-007), else `vscode` |
| modify | `plugins/architect/targets/{opencode,copilot}/wiring/code-discovery-toolchain.md` | toolchain record with the host and the sdd CLI rows (C002-REQ-507) |
| add | `evals/targets/doctor/TS-506.eval.mjs`, `TS-507`, `TS-509` … `TS-515`, `TS-526`, `TS-639` (`.eval.mjs` each) | `@eval` doctor cases with fake host shims (`tests/fixtures/cfg-*` pattern), beside `TS-537.eval.mjs` of C002-T-010; the Claude Code rows run in step 4, the OpenCode rows in C002-T-056, the Copilot CLI rows in C002-T-045 |
| add | `tests/integration/cap05/doctor-variants.test.ts` | generated doctor bodies per target; the Claude Code doctor unchanged |
| modify | `evals/results/spend-chg002.json` | the spend of step 4 |

## Preconditions

- C002-T-013, C002-T-014 and C002-T-028 done; C002-T-060 (eval auth switch) done.
- For step 4: the sessions run with `--auth subscription` (test plan §4.1 "Eval auth"); a session run
  with `--auth api-key` needs P-01's decision for that session first and bills the prepaid key,
  outside the OpenRouter budget (test plan §4.1).

## Step outline (no production code)

1. Write the remedies rows with the install command for the package's own `architect-sdd` version
   (C002-REQ-509).
2. Report a `.cmd`-only tool as `error` with a native-install fix under server mode (C002-IF-006 §2).
   Write the Copilot hooks row into the Copilot doctor variant of both modes, not only the fallback's
   (C002-REQ-510).
3. Write the case files; the integration test must be green before any paid run.
4. **Paid runs on E-CC at the C002-M-05 exit:** the Claude Code rows of C002-TC-506, 509, 510 and
   511, and the doctor eval of regression-set §5 row 1 (`evals/cap11/doctor-no-ripwire.eval.mjs`),
   one run each, at most one rerun after a failure. The other §5 rows run only if a source agent,
   command or skill text changed (it should not, C002-CON-10). Run them with `--auth subscription`
   and add each session to the ledger with its `provider` and `auth` after it (test plan §4.1). The OpenCode rows are carried to C002-T-056 and the
   Copilot CLI rows of C002-TC-513 and C002-TC-526 to C002-T-045; the `@manual-vscode` cases to the
   checklist.

## Verification

- `npm test -- cap05` and `npm test -- cap11` (`TS-1116.test.ts`)
- `node evals/harness/run.mjs <case files> --tier dev` with the Claude Code doctor cases of step 4 as
  positional case files (`evals/targets/doctor/TS-506.eval.mjs`, `TS-509`, `TS-510`, `TS-511` and
  `evals/cap11/doctor-no-ripwire.eval.mjs`; `--only` for the Claude Code Examples rows) and
  `--auth subscription`, no `--host`:
  C002-T-038 does not wait for C002-T-044, which adds `--host` and `--filter`

## Done when

- [ ] Generated doctor variants pass the integration test; Claude Code doctor text byte-unchanged
- [ ] The sessions of step 4 pass and their spend is in the ledger; carried rows listed in the task report with their carrying task
- [ ] Progress reported: `sdd task set C002-T-038 --status done --commit <sha>`
