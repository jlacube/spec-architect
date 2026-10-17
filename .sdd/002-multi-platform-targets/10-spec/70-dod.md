---
id: C002-SPEC-DOD
artifact: spec/dod
change: CHG-002
phase: 10-spec
status: draft
---

# C002 — Definition of Done

CHG-002 inherits the global DoD of the constitution (`../../_constitution/constitution.md`, Global
DoD); the items that apply are listed by ID at the end. The feature items below add what is specific
to the generated targets. Scenario tags (`@eval`, `@manual-vscode`, `@review`, `@mode-*`) are defined
at the top of each capability's `acceptance.md`. A scenario tagged with an enforcement mode that the
spikes did not select is recorded as "not applicable" in the test report, with the spike record
linked. If the spike S-08 record gives the enforcement mode `deferred`, the items that cover the
Copilot target (C002-DOD-003, C002-DOD-004 and the Copilot parts of C002-DOD-006, C002-DOD-008 and
C002-DOD-009) are not marked "not applicable" here: they are removed or reworded in the spec
revision of `10-context/scope.md` §1.1 (Q-defer-01).

## Feature DoD

| ID | Statement | Evidence type | Covers |
|---|---|---|---|
| C002-DOD-001 | Every scenario of C002-CAP-01's `acceptance.md` passes in the integration suite on REF-WIN; `@eval` scenarios pass at the dev tier (one passing run per Examples row, at most one rerun after a failure) on OpenCode at its tested version | test-report | C002-CAP-01 |
| C002-DOD-002 | Every scenario of C002-CAP-02's `acceptance.md` passes: untagged and `@mode-*` scenarios in the integration suite against OpenCode at its tested version, `@eval` scenarios at the dev tier (one passing run per Examples row, at most one rerun after a failure) on OpenCode and on Claude Code, `@manual-vscode` scenarios through C002-DOD-004 | test-report | C002-CAP-02 |
| C002-DOD-003 | Every scenario of C002-CAP-03's `acceptance.md` passes: untagged and `@mode-*` scenarios in the integration suite, `@eval` scenarios at the dev tier (one passing run per Examples row, at most one rerun after a failure) through the Copilot CLI eval runner or the OpenCode eval runner, `@manual-vscode` scenarios through C002-DOD-004 | test-report | C002-CAP-03 |
| C002-DOD-004 | A checklist record of one run of the manual VS Code checklist, made on the tested VS Code and GitHub Copilot Chat versions, shows every step passed, including one step for each `@manual-vscode` scenario of C002-CAP-02, C002-CAP-03 and C002-CAP-05, a toy change taken from its creation to gate G1 on a fresh install, a Revise choice at gate G1 followed by the gate presented again, and one run of the revise prompt on the toy change's approved ideation phase; under the Copilot hooks fallback the record also states hooks "enabled" during the run and holds one passed step for each Copilot injection case | review-record | C002-REQ-211, 212, 213, 306, 308, 311, 312, 313, 317, 319, 504, 510, 614, 615, 616, 628, C002-SC-02 |
| C002-DOD-005 | Every scenario of C002-CAP-04's `acceptance.md` passes in the integration suite on REF-WIN, with the sdd MCP server started from the packed `architect-sdd` tarball | test-report | C002-CAP-04 |
| C002-DOD-006 | Every scenario of C002-CAP-05's `acceptance.md` passes: npm and allowlist scenarios in the integration suite, `@eval` doctor scenarios at the dev tier (one passing run per Examples row, at most one rerun after a failure) on Claude Code and on OpenCode, and for the Copilot target package through the Copilot CLI eval runner, `@manual-vscode` scenarios through C002-DOD-004 | test-report | C002-CAP-05 |
| C002-DOD-007 | Every scenario of C002-CAP-06's `acceptance.md` passes: untagged scenarios in the integration suite, `@eval` scenarios at the dev tier (one passing run per Examples row, at most one rerun after a failure), `@review` scenarios with a review entry in the test report naming the reviewer and the reviewed file | test-report | C002-CAP-06 |
| C002-DOD-008 | For each enforcement mechanism in use on a generated target, under PowerShell 7 and Git Bash, with each host at its tested version, the corpus replay suite reports 0 differing decisions (0 false allows, 0 false denies) over the applicable cases of the path corpus and of the shell corpus, against the expected decision for that mechanism (memory-category cases `deny`, C002-REQ-625; cases without a `cwd` or a tool name `deny` as malformed calls, C002-REQ-630; unknown `architect:sdd-*` callers `allow` on the OpenCode permission rules, C002-REQ-632; cases that require a host capability, such as PG-163, replayed with their own input and their corpus expectation, C002-REQ-633), on a replay host whose `replay_host.capabilities` include every capability those cases require (`file-symlink`: REF-WIN with Developer Mode on or the replay run elevated, C002-REQ-634), and its replay report lists every case not replayed by ID as not applicable (identity-category cases on the sdd MCP server and the Copilot guard hooks only, C002-REQ-626, C002-REQ-627) | test-report | C002-NFR-201, 202, C002-REQ-606, 625, 626, 627, 630, 632, 633, 634 |
| C002-DOD-009 | The injection evals report 0 instructions acted upon over at least 20 injection cases per generated target at the dev tier, on the hosts' tested versions and the Claude model tiers of C002-REQ-105; under the Copilot hooks fallback the Copilot cases counted are those of the checklist record of C002-DOD-004, run in VS Code with hooks "enabled", and Copilot CLI results do not count towards the 20 | test-report | C002-NFR-203, C002-REQ-628, 629 |
| C002-DOD-010 | The benchmark scripts under `bench/` record on REF-WIN: sdd MCP server refusals at p95 ≤ 300 ms over 50 calls; writes with quick-lint findings at p95 ≤ 800 ms over 20 calls; generation of both target packages at p95 ≤ 5 s over 10 runs | benchmark-report | C002-NFR-101, 102, 103 |
| C002-DOD-011 | The target structure check on both target packages reports no inlining-budget error: every inlined skill ≤ 24,000 characters and every generated agent's inlined skills ≤ 64,000 characters | command-output | C002-NFR-104, C002-REQ-110 |
| C002-DOD-012 | The runner tests with a stub host end every session at 30 turns or at 0.50 USD for both eval runners, and the dev-tier eval results record a spend of at most 0.50 USD per session wherever the host reports spend | test-report | C002-NFR-105 |
| C002-DOD-013 | The fault-injection tests allow 0 calls with each fault class (malformed input, unknown tool name, exception in a guard core, I/O error) injected into each write and command tool of the sdd MCP server and into each Copilot guard hook | test-report | C002-NFR-204 |
| C002-DOD-014 | The sdd MCP server tests run with `tests/no-network.mjs` preloaded and record 0 outbound connections | test-report | C002-NFR-205 |
| C002-DOD-015 | The determinism test generates both target packages twice into separate folders and finds 0 differing bytes and 0 differing file names, under PowerShell 7 and under Git Bash | test-report | C002-NFR-301 |
| C002-DOD-016 | The install smoke test of the packed `architect-sdd` tarball (global install into a clean prefix, `sdd status` in a fixture workspace, MCP initialisation exchange with the sdd MCP server) passes in all 4 combinations of PowerShell 7 or Git Bash with Node.js 20 LTS or 22 LTS | command-output | C002-NFR-401 |
| C002-DOD-017 | The manifest check on the packed tarball finds 0 `dependencies` entries and 0 runtime imports outside bundled code and Node.js built-ins, and both entries run from an install folder that holds no other package | command-output | C002-NFR-402 |
| C002-DOD-018 | For each target package proposed for release, the release check's regeneration at the release commit finds 0 files missing, extra or different | command-output | C002-NFR-501 |
| C002-DOD-019 | A timed clean-profile run per generated target, following that package's install notes, reaches the first interview question of a new change in ≤ 15 minutes, download time excluded | metric-snapshot | C002-NFR-601 |
| C002-DOD-020 | The build license check passes for both `architect-sdd` entries and an SPDX header scan of `dist/opencode/`, `dist/copilot/` and the tarball finds 0 files or bundled packages outside the license allowlist | command-output | C002-NFR-801 |
| C002-DOD-021 | A fresh OpenCode install on REF-WIN takes a toy change from its creation to gate G1 with the generated OpenCode target package; the session transcript and the change's Gate log row are linked | link | C002-SC-01 |
| C002-DOD-022 | The regression set (`20-plan/30-impact/regression-set.md`) passes on the implementation of CHG-002, with the corpus cases and deny-message texts changed by C002-REQ-503, C002-REQ-517 and C002-REQ-521 as the only changed expectations; the Serena step of the Claude Code doctor and init commands is allowed by the bash guard on Claude Code at its tested version, with `CLAUDE_PLUGIN_DATA` set by the host and by no test step (C002-TS-537, at the dev tier: one passing run, at most one rerun after a failure) | test-report | C002-REQ-517, 521, 623, C002-SC-05 |
| C002-DOD-023 | `sdd defect` output shows defect D-011 of CHG-001 closed after the task implementing C002-REQ-503 is done | command-output | C002-REQ-503 |

## Inherited global items

- **DOD-G-01** — applies to every scenario of the six capabilities, except its clause "pass in at least 9 of 10 runs", which is waived for CHG-002 (P-01, Q-evalbudget-01 in `20-plan/questions-log.md`): `@eval` scenarios pass at the dev tier, one passing run per Examples row with at most one rerun after a failure, within the CHG-002 eval budget set by P-01 in the plan (`20-plan/60-test-plan.md` §4.1); `@eval` scenarios run on the
  Claude model tiers of C002-REQ-105 on the generated targets, and `@manual-vscode` scenarios count as
  manual scenarios with the executed record of C002-DOD-004.
- **DOD-G-02** — applies with the target structure checks of C002-REQ-601 added to `npm run check`.
- **DOD-G-03** — applies; the LINT-DELTA-001 findings waived under C002-CON-05 (C002-DEC-008) are not
  new findings once waived at the gate.
- **DOD-G-04** — applies to the CHG-002 contracts in `50-interfaces/`: the target package contracts,
  the mapping tables, the sdd MCP server tools and the `architect-sdd` package.
- **DOD-G-05** — applies to every NFR of `30-nfr/nfr.md`; the results are those of C002-DOD-008 to
  C002-DOD-020.
- **DOD-G-06** — applies after CHG-001 is archived (C002-DEC-008, C001-T-075 first).
- **DOD-G-07** — applies.
