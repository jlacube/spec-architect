---
id: C002-PLAN-OBS
artifact: plan/observability
change: CHG-002
phase: 20-plan
status: draft
---

# CHG-002 — Observability plan

The suite runs no service. Its "signals" are benchmark results, test and replay reports, eval
results and P-01's records, produced on REF-WIN during development and at release. Each NFR of
`../10-spec/30-nfr/nfr.md` has one row; the threshold column repeats the NFR's threshold in short
form so that a reader can compare a result with it (the NFR stays the source).

Where measured: **bench** (`npm run bench`, results under `bench/results/`), **test** (`npm test`,
no-network preload), **check** (`npm run check` or a script of `scripts/check/`), **smoke** (install
smoke test of the packed tarball), **replay** (`npm run replay`, reports under
`docs/releases/<target>/<version>/`), **eval** (`node evals/harness/run.mjs --host <host> --tier dev`, results under
`evals/results/`), **release** (`node scripts/release-check.mjs`), **manual** (P-01 record).

| NFR | Signal | Kind | Where measured | Threshold | Produced by task |
|---|---|---|---|---|---|
| C002-NFR-101 | p95 of `bench/mcp-refusals.mjs` in `bench/results/` | metric | bench | ≤ 300 ms p95 over 50 refused calls | C002-T-020 |
| C002-NFR-102 | p95 of `bench/mcp-writes.mjs` in `bench/results/` | metric | bench | ≤ 800 ms p95 over 20 writes | C002-T-020 |
| C002-NFR-103 | p95 of `bench/generate.mjs` in `bench/results/generate-*.json` (C002-TC-905; generator run with its bundling step, `scripts/build.mjs`, checks and zipping excluded) | metric | bench | ≤ 5 s p95 over 10 runs | C002-T-036 |
| C002-NFR-104 | Inlining-budget findings of the target structure check, per skill and per agent | log | check | ≤ 24,000 characters per skill, ≤ 64,000 per agent | C002-T-028, C002-T-035 |
| C002-NFR-105 | Turns, spend, `end_reason` and the caps the session ran with (`caps`, C002-IF-010 §3) per session in each eval result; on OpenCode the cost of each step, on Copilot CLI the session's measured AI Credits against its `--max-ai-credits` limit (per session, C002-IF-010 §2.2); stub-host cap test report (C002-TC-614, 677, 678) and the harness test of the cap exceptions (C002-TC-679); CHG-002 spend ledger `evals/results/spend-chg002.json`, checked before every paid OpenRouter session against the limit of the session's pool, 30 USD general pool or 10 USD release-evidence reserve, of the 40 USD of OpenRouter spend, and before every Copilot CLI session against the 30 USD Copilot pool (test plan §4.1, Q-evalbudget-03, Q-evalbudget-04, Q-opencode-01; defect D-019 item 4); for each `partial` OpenCode session, the standard-output line `ledger: <id> reconciled from the OpenRouter key usage: …` with the entry's `openrouter_usage`, or the standard-error line `eval: spend of <id> stays partial …` (C002-IF-010 §2.3; C002-TC-921 … 923) | metric | test, eval | ≤ 30 turns per session; spend cap 0.50 USD per session, or 2.00 USD for the cap exception C002-TS-634 on OpenCode (C002-IF-010 §2.2; P-01 answer to Q-ts634-budget-02), on OpenCode checked after each step: 0 steps started after the step that brought the spend to the cap or above, that step and any step already running counted in full, the overshoot bounded by their cost with no fixed allowance; on Copilot CLI checked per session: `end_reason` `spend cap` for every session whose measured AI Credits reached its limit | C002-T-001 (ledger), C002-T-044, C002-T-045, C002-T-065 (spend-cap rule tests, cap-exception check, `caps` field), C002-T-056 step X0 (2.00 USD exception, H of an exception row, `cap` and `step-after-cap` records of the overshoot), C002-T-067 (reconciliation of a `partial` OpenCode spend) |
| C002-NFR-201 | Path-corpus replay report per enforcement mechanism: differing decisions, the IDs of cases not replayed with the rule of each, and `replay_host.platform` (`win32` for release evidence, C002-TS-683) | log | replay | 0 differing decisions; every case not replayed listed with its rule; replayed on `win32` | C002-T-040, C002-T-041, C002-T-042, C002-T-049, C002-T-054, C002-T-065 (platform rule, `win32` check of the release check) |
| C002-NFR-202 | Shell-corpus replay report per enforcement mechanism, under PowerShell 7 and Git Bash, with `replay_host.platform` | log | replay | 0 differing decisions; every case not replayed listed with its rule; replayed on `win32` | C002-T-040, C002-T-041, C002-T-042, C002-T-049, C002-T-054, C002-T-065 |
| C002-NFR-203 | Injection summary `injection.json` per target (Copilot: from the Copilot CLI runner under the signed-off S-08 record), from the rows of the host's injection case set (`TS-359` included on Copilot CLI) and merged fail-closed by `run.mjs`, each entry naming its result file and models (C002-IF-010 §5.2); on Copilot CLI each result's `session_model` and `agent_models` (C002-IF-010 §3); only under the hooks fallback or `copilot_cli_loads_package: false`, the injection rows of the VS Code checklist record | metric | eval, manual | 0 of at least 20 injection cases per target | C002-T-044, C002-T-045, C002-T-049, C002-T-054, C002-T-066 (case sets, merge, `result` and `models`, `session_model`, `agent_models`), C002-T-050 |
| C002-NFR-204 | Fault-injection test report for every tool of the sdd MCP server and the Copilot guard hook (deny decision on standard output, exit 2) | log | test | 0 allowed calls per fault class | C002-T-020, C002-T-032 |
| C002-NFR-205 | Outbound-connection log of `tests/no-network.mjs` during the server tests | metric | test | 0 connections | C002-T-016 |
| C002-NFR-301 | Determinism test report of C002-TC-904 (`tests/integration/cap01/determinism.test.ts`: two generations compared byte by byte) under PowerShell 7 and Git Bash | log | test | 0 differing bytes and file names | C002-T-025, C002-T-036 |
| C002-NFR-401 | Install smoke results for the 4 shell and Node.js combinations in `bench/results/` | log | smoke | 4 of 4 pass | C002-T-023 |
| C002-NFR-402 | Manifest check output on the packed tarball (`scripts/check/tarball.mjs`) | log | check | 0 `dependencies`, 0 unbundled runtime imports | C002-T-023 |
| C002-NFR-501 | Regeneration diff of the release check against `dist/<target>/` and the target zip, stored in the release record | log | release | 0 files missing, extra or different | C002-T-047 |
| C002-NFR-601 | Timed clean-profile runs in `docs/releases/clean-profile-runs.md` | metric | manual | ≤ 15 minutes per target | C002-T-051, C002-T-057 |
| C002-NFR-801 | Build licence check over both metafiles (ERR-BLD-001) and the SPDX header scan of the tarball, `dist/opencode/` and `dist/copilot/` (`scripts/check/tarball.mjs … --spdx dist/opencode --spdx dist/copilot`, findings under the code `C002-NFR-801`) | log | check | 0 files or packages outside the allowlist | C002-T-021, C002-T-023 (tarball scan and the `--spdx` option), C002-T-049 (the `--spdx dist/opencode --spdx dist/copilot` run at the release-candidate commit) |

Alerting is not applicable (no running service). The release check (C002-T-047) reads the replay,
injection and checklist evidence at the tested versions; a miss of any other threshold is raised as
a defect against the NFR (`sdd defect add --ref C002-NFR-<n>`). The results are collected as the
evidence of C002-DOD-008 … C002-DOD-020 (DOD-G-05).
