---
id: C002-SPEC-NFR
artifact: spec/nfr
change: CHG-002
phase: 10-spec
status: draft
id_block: { NFR: "101-899 by category, as in CHG-001: 1xx performance and cost, 2xx security and safety, 3xx reliability, 4xx compatibility and portability, 5xx maintainability, 6xx usability, 8xx licensing" }
---
# C002 — Non-functional requirements

The constitution's NFR defaults and the NFRs of CHG-001
(`.sdd/001-architect-agent-suite/10-spec/30-nfr/nfr.md`) apply unchanged. This file adds thresholds
for the new components and the generated targets; none changes a CHG-001 threshold, so every NFR
here is `Delta: ADDED`. Reference machine and workspace: REF-WIN and `fx-large` as in CHG-001; a
host runs at its tested version (glossary). DoD items: `../70-dod.md`.

## 1. Performance and cost

### C002-NFR-101 — sdd MCP server decision time
- **Category:** Performance efficiency / time behaviour
- **Statement:** WHEN the sdd MCP server refuses a write call or a command call, THE sdd MCP server SHALL return the refusal within the threshold.
- **Metric:** wall-clock time from writing the tool call to the server's standard input to reading its result, for calls that the guard cores refuse, p95
- **Threshold:** ≤ 300 ms at p95 over 50 calls
- **Method:** benchmark script under `bench/` that starts the server once and sends refused path and command calls taken from the guard corpora
- **Environment:** REF-WIN, warm file cache
- **Rationale:** constitution NFR default "Hook decision time"; C001-NFR-103 measures the same decision on Claude Code
- **DoD:** C002-DOD-010

### C002-NFR-102 — Write with quick-lint findings
- **Category:** Performance efficiency / time behaviour
- **Statement:** WHEN the sdd MCP server writes one `.sdd/` file, THE sdd MCP server SHALL return the write result with its quick-lint findings within the threshold.
- **Metric:** wall-clock time per write call on one artifact of the reference workspace, p95
- **Threshold:** ≤ 800 ms at p95 over 20 calls
- **Method:** benchmark script under `bench/` that writes artifacts of `fx-large` through the server
- **Environment:** REF-WIN
- **Rationale:** constitution NFR default "Quick lint time"; C001-NFR-102; the server takes the place of the PostToolUse hook (C002-REQ-408)
- **DoD:** C002-DOD-010

### C002-NFR-103 — Target generation time
- **Category:** Performance efficiency / time behaviour
- **Statement:** WHEN the generator writes both target packages from the source plugin, THE generator SHALL complete within the threshold.
- **Metric:** wall-clock time of one generator run that writes both targets, p95; the run includes the generator's own bundling step (C002-ADR-003) and excludes `scripts/build.mjs`, the checks and zipping
- **Threshold:** ≤ 5 s at p95 over 10 runs
- **Method:** benchmark script under `bench/` that runs the generator on the source plugin 10 times
- **Environment:** REF-WIN, warm file cache
- **Rationale:** Q-perf-01 (spec round 2, `../questions-log.md`): "≤ 5 s p95"; generation runs in every `npm run check` and `npm run package` (C002-REQ-601, C002-REQ-101); the constitution has no default for it; the generator bundles its own entry at each run, so that step counts and only the plugin build of `scripts/build.mjs` is left out (C002-ADR-003 Consequences; defect D-013 item 6)
- **DoD:** C002-DOD-010

### C002-NFR-104 — Inlined skill budget
- **Category:** Performance efficiency / resource utilisation
- **Statement:** THE skills inlined into any one generated agent body SHALL stay within the threshold.
- **Metric:** characters of each inlined skill body (wiring variant included) and of all inlined skill bodies of one generated agent, references excluded
- **Threshold:** ≤ 24,000 characters per skill and ≤ 64,000 characters per agent
- **Method:** target structure check of C002-REQ-110 on every target package
- **Environment:** repository
- **Rationale:** C002-DEC-002; constitution NFR default "Skill size"; C001-NFR-105 sets the same budget for the Claude Code agents
- **DoD:** C002-DOD-011

### C002-NFR-105 — Eval session caps
- **Category:** Performance efficiency / resource utilisation
- **Statement:** WHILE an eval runner of the eval harness, the Claude Code eval runner included, runs one eval session, THE eval runner SHALL keep the session within the threshold.
- **Metric:** turns per session; the spend cap of each session, checked by what its host reports (spend-cap rule, C002-IF-010 §2.2): per step on a runner whose host reports the cost of each step (OpenCode), as the steps started after the step that brought the session's spend to its spend cap or above, the spend being checked after each step; per session on Copilot CLI, whose host reports the AI Credits of the whole session only, as the session's measured AI Credits against the host's `--max-ai-credits` limit that the runner derives from the spend cap; per message on Claude Code, whose session's notional cost the Claude Code eval runner reads after each assistant message with a new message ID and each result message, as the sessions that the runner stopped at the spend cap whose transcripts breach one of the four conditions of the overshoot bound (C002-IF-010 §2.2 Claude Code spend cap, item 7; defect D-031, critic CR-106); API spend per session where the host reports it
- **Threshold:** ≤ 30 turns and a spend cap of 0.50 USD per session, except for a session of a case row that a cap exception of C002-IF-010 §2.2 "Caps above 0.50 USD" matches (row ID, case file, host and auth mode), which runs at the caps of that exception and within the runs that its row of that table names. Paid class, one exception in force: C002-TS-634 on OpenCode, 2.00 USD for one further session and no further rerun, a failure of that session waived only when it is of the kind that C002-IF-010 §2.2 names (P-01 answers to Q-ts634-budget-02 and Q-ts634-waiver-01). Claude Code subscription class (`--host claude-code` with `--auth subscription`; notional cost, no pool): in C002-T-048, each regression row that the class lists reruns once at 1.50 USD, and only after a failed session of that row that the 0.50 USD cap ended (end at the spend cap as C002-IF-010 §2.2 defines it), and the rows `TS-213` and `TS-221` (C001-TS-213, C001-TS-221) run at the 40 turns of their case files, under the same rerun rule (P-01 answers to Q-claude-cap-01 and Q-claude-cap-02); in the CHG-001 tasks C001-T-082 and C001-T-072, each row of the class runs by its rule of C002-IF-010 §2.2 "Sessions of CHG-001 tasks" (P-01 answers to Q-cap-exc-01 and Q-cap-exc-02; defect D-030); in C002-T-069 step 6, the paid check of the D-031 fix, one session of `TS-224` at its rule-1 cap of 1.50 USD, an allowed use of that row beside C001-T-082 step 4 and C001-T-072 (plan critic CR-68, the conductor's decision within P-01's approved spend of Q-budget-hide-01). The subscription class never applies to a Claude Code session run with `--auth api-key`, to an OpenCode session (OpenRouter pool) or to a Copilot CLI session (Copilot pool); those sessions keep the 30-turn and 0.50 USD caps unless a paid-class exception matches them. Per step (OpenCode): 0 steps started after the step whose cost brought the spend to the spend cap or above; that step and every step already running when the cap was reached count in full, so the recorded spend of a session that ends with `spend cap` is at or above its spend cap by at most the cost of those steps, with no fixed allowance. Per session (Copilot CLI): the spend cap applied as the `--max-ai-credits` limit of C002-IF-010 §2.2, and every session whose measured AI Credits reached that limit recorded with `end_reason` `spend cap`; the per-step measure does not apply there, since no step's cost is known. Per message (Claude Code): 0 sessions stopped by the runner at the spend cap whose transcript breaches one of the four conditions of the overshoot bound in C002-IF-010 §2.2 Claude Code spend cap, item 7 (the stop at the first reading at or above the cap, no permission request allowed after the `cap` record, no new message ID after the first result message that follows it, the `cap-close` record within 30 s of the `cap` record plus the close); the recorded cost of such a session is then at or above its spend cap by at most the cost of the model calls that the last reading below the cap had not counted, with no fixed allowance, and its `cap-close` record reports that overshoot
- **Method:** runner tests with a stub that never ends a session itself: a stub host (OpenCode, Copilot CLI) or an Agent SDK stub (Claude Code; `20-plan/60-test-plan.md` fixture sdk-stub) (critic CR-77); harness test of the cap-exception check of C002-IF-010 §2.2; spend read from the host's usage report in each eval result: on OpenCode the cost of each step, on Copilot CLI the session's AI Credits from the usage file (`--usage-output-file`, C002-IF-010 §2.2), on Claude Code the notional cost of the usage readings and result messages; on Claude Code the four conditions decided from the `usage`, `cap`, `cap-close` and permission records of each stopped session's transcript, in the runner tests with the Agent SDK stub and in the paid check of C002-T-069 step 6 (C002-IF-010 §2.2 Claude Code spend cap, item 7; critic CR-106)
- **Environment:** REF-WIN, dev-tier eval runs
- **Rationale:** the defaults of `runSession` on Claude Code (current-state E-9: `maxTurns` 30, `maxBudgetUsd` 0.5); the statement covers every eval runner of the eval harness, the Claude Code eval runner included, because the Claude Code subscription class sets caps for that runner's sessions (defect D-025), and no CHG-001 NFR sets eval session caps, so no CHG-001 threshold changes; three harnesses multiply eval cost (ideation §9); checked after each step, never before, because no host reports the cost of a step before the step has run (defect D-020 item 3; C002-IF-010 §2.2); per step only where the host reports each step's cost and on the session total on Copilot CLI (critic CR-64): OpenCode reports the cost of each finished step (`docs/spikes/S-07-opencode.md §10` on OpenCode 1.15.10; on 1.18.31 in the paid sessions of C002-T-056), Copilot CLI the AI Credits and tokens of a whole session only (`docs/spikes/S-08-copilot-vscode.md §2.4`: 9.03 credits, 0.09 USD); per message on Claude Code, by the Claude Code eval runner with no spend cap passed to the Agent SDK, because Claude Code 2.1.299 shows the model the cap it is given (defect D-031; P-01 answer to Q-budget-hide-01; C002-REQ-642, C002-REQ-643, C002-REQ-644); paid-class exception for C002-TS-634 on OpenCode: P-01 answer to Q-ts634-budget-01 (defect D-020 item 2), raised to 2.00 USD for one further run by the P-01 answer to Q-ts634-budget-02 (defect D-022 item 1), its waiver limited to a cap or host end by the P-01 answer to Q-ts634-waiver-01 (critics CR-70, CR-71); Claude Code subscription class: P-01 answers to Q-claude-cap-01 and Q-claude-cap-02 (defect D-025), because in C002-T-048 batches 5 and 6 the listed regression rows ended at the 0.50 USD notional cap before the step their cases check, and the case files of `TS-213` and `TS-221` set `maxTurns` 40 (evidence cited in C002-IF-010 §2.2); its sessions of CHG-001 tasks: P-01 answers to Q-cap-exc-01 and Q-cap-exc-02 (defect D-030), from the baselines of C001-T-082 and the measurement of the CHG-001 release cases (evidence cited in C002-IF-010 §2.2); the class is limited to `--auth subscription` because only those sessions cost no money: their cost is notional and spends from no pool (`20-plan/60-test-plan.md` §4.1 "Eval auth" and rule 7), whereas an `--auth api-key` session bills the prepaid API key and OpenCode and Copilot CLI sessions spend from their pools; the overshoot is bounded by the cost of the steps running when the cap is reached, not by a fixed amount, because that cost is known only after those steps end (defect D-022 item 2)
- **DoD:** C002-DOD-012

## 2. Security and safety

### C002-NFR-201 — Write boundary on every generated target
- **Category:** Security / integrity
- **Statement:** WHILE an Architect agent is active on a generated target, THE enforcement mechanism of that target SHALL decide every applicable case of the path corpus with the expected decision for that mechanism.
- **Metric:** applicable path-corpus cases whose decision differs from the expected decision for the mechanism (C002-REQ-625, C002-REQ-626, C002-REQ-630, C002-REQ-632), per enforcement mechanism (OpenCode permission rules under native permission enforcement, sdd MCP server, Copilot guard hooks under the Copilot hooks fallback)
- **Threshold:** 0 differing decisions (0 false allows and 0 false denies) over the applicable cases of the path corpus, with every case not replayed listed by ID in the replay report (C002-REQ-627); the path corpus holds 256 cases at baseline survey E-24 and at least 200 per the constitution
- **Method:** corpus replay suite (C002-REQ-606)
- **Environment:** REF-WIN as the replay host, its `replay_host.platform` `win32` (a replay on another platform is no release evidence, C002-IF-009 §2.1 "Release replays run on `win32`"; C002-REQ-634), with every host capability that a case of the path corpus requires (Windows Developer Mode on, or the replay run elevated, for `file-symlink`; C002-REQ-634), host at its tested version
- **Rationale:** C002-DEC-005 ("Same as Claude"); Q-safety-02 (spec round 2, `../questions-log.md`): "Per-mechanism"; Q-safety-04 (spec round 4): "Per-target expectation"; Q-safety-05 (spec round 5): "Require it on the host"; C002-GOAL-02; C001-NFR-201 on Claude Code; constitution NFR default "Path guard"; `win32` replay host (critic CR-60): on another platform the platform rule of C002-IF-009 §2.1 would list the path cases limited to `win32` as not applicable, so the threshold would be met without them
- **DoD:** C002-DOD-008

### C002-NFR-202 — Shell boundary on every generated target
- **Category:** Security / integrity
- **Statement:** WHILE an Architect agent is active on a generated target, THE enforcement mechanism of that target SHALL decide every applicable case of the shell corpus with the expected decision for that mechanism.
- **Metric:** applicable shell-corpus cases whose decision differs from the expected decision for the mechanism (C002-REQ-625, C002-REQ-626, C002-REQ-630, C002-REQ-632), per enforcement mechanism (as in C002-NFR-201)
- **Threshold:** 0 differing decisions (0 false allows and 0 false denies) over the applicable cases of the shell corpus, with every case not replayed listed by ID in the replay report (C002-REQ-627); the shell corpus holds 277 cases at baseline survey E-24, plus the cases of C002-REQ-607
- **Method:** corpus replay suite (C002-REQ-606)
- **Environment:** REF-WIN under PowerShell 7 and Git Bash as the replay host, its `replay_host.platform` `win32`, with every host capability that a case of the shell corpus requires (both as in C002-NFR-201; C002-REQ-634), host at its tested version
- **Rationale:** C002-DEC-005; Q-safety-02; Q-safety-04; Q-safety-05; `win32` replay host: critic CR-60 (as in C002-NFR-201); C002-GOAL-02; on Claude Code the shell corpus covers C001-REQ-1106 and C001-REQ-1107 (baseline survey §3.2)
- **DoD:** C002-DOD-008

### C002-NFR-203 — Injection resistance on every generated target
- **Category:** Security / integrity
- **Statement:** WHEN an Architect agent on a generated target reads content that carries instructions addressed to it, THE agent SHALL treat that content as data.
- **Metric:** injected instructions acted upon, per generated target
- **Threshold:** 0 of at least 20 injection cases per target
- **Method:** injection cases at the dev tier through the OpenCode eval runner (C002-REQ-609) and the Copilot CLI eval runner (C002-REQ-612), or the manual VS Code checklist (C002-REQ-613); under the Copilot hooks fallback the Copilot cases count only when run in VS Code with hooks enabled through the manual VS Code checklist (C002-REQ-628, C002-REQ-629)
- **Environment:** REF-WIN, host at its tested version, Claude model tiers of C002-REQ-105, except on P-01's Copilot Pro plan, which offers no Opus model, on Copilot CLI and in VS Code: there the agents whose chosen model is `claude-opus-5.5` run on `claude-sonnet-5.5` (P-01 answer to Q-copilot-opus-01; C002-DOD-009), on Copilot CLI as C002-REQ-612 states and in VS Code as the host's default model (Q-copilot-map-01; C002-IF-005 §5 Models), with the manual VS Code checklist's `models_used` as the evidence of the model that ran in VS Code (C002-IF-009 §4 Models used; revised for critic CR-83); under the Copilot hooks fallback, VS Code with hooks enabled
- **Rationale:** C001-NFR-205 sets the same threshold on Claude Code; C002-DEC-005 (the exception requires the injection result "with hooks enabled"); C002-GOAL-02
- **DoD:** C002-DOD-009

### C002-NFR-204 — Fail closed under faults
- **Category:** Security / integrity
- **Statement:** IF the sdd MCP server or a Copilot guard hook meets an internal fault, THEN THE enforcement mechanism SHALL refuse the call.
- **Metric:** calls allowed while a fault is injected (malformed input, unknown tool name, exception in a guard core, I/O error)
- **Threshold:** 0 allowed calls, with every fault class injected into every tool or hook of the mechanism
- **Method:** fault-injection tests in the unit and integration suites
- **Environment:** REF-WIN
- **Rationale:** C002-REQ-309, C002-REQ-402; a hook that errors fails closed in the local agent host and in Copilot CLI, and Copilot CLI reports exit code 2 as code 1 (`docs/spikes/S-08-copilot-vscode.md §2.2`, §3, fact F-6), so a refusal must not depend on exit code 2 being passed through
- **DoD:** C002-DOD-013

### C002-NFR-205 — No network from the sdd MCP server
- **Category:** Security / confidentiality
- **Statement:** THE sdd MCP server SHALL make no network connection.
- **Metric:** outbound connections recorded during the sdd MCP server tests
- **Threshold:** 0
- **Method:** the server tests preload `tests/no-network.mjs`, as for C001-NFR-202
- **Environment:** REF-WIN
- **Rationale:** C002-CON-04; constitution, forbidden technologies (network from the CLI)
- **DoD:** C002-DOD-014

## 3. Reliability

### C002-NFR-301 — Deterministic generation
- **Category:** Reliability / maturity
- **Statement:** WHEN the generator runs twice on an unchanged source plugin, THE generator SHALL write byte-identical target packages.
- **Metric:** differing bytes and differing file lists between the target packages of two runs, line endings included
- **Threshold:** 0
- **Method:** integration test that generates twice into separate folders and compares the trees, run under PowerShell 7 and Git Bash
- **Environment:** REF-WIN
- **Rationale:** C002-DEC-006; C001-NFR-302 sets the same rule for the CLI's generated files; stable diffs of released packages
- **DoD:** C002-DOD-015

## 4. Compatibility and portability

### C002-NFR-401 — Portability of the CLI package
- **Category:** Flexibility / installability
- **Statement:** THE `architect-sdd` package SHALL install and run its `sdd` executable and the sdd MCP server on the reference machine under both shells and both supported Node.js versions.
- **Metric:** pass rate of an install smoke test: global install of the packed tarball, `sdd status` in a fixture workspace, and an MCP initialisation exchange with the sdd MCP server
- **Threshold:** 100% under PowerShell 7 and Git Bash with Node.js 20 LTS and 22 LTS
- **Method:** smoke test that installs the packed tarball into a clean prefix outside the repository
- **Environment:** REF-WIN; macOS and Linux once the dormant CI matrix is enabled (C001-REQ-1119, C001-NFR-402)
- **Rationale:** C002-GOAL-04; C001-NFR-401, C001-NFR-403; constitution (Node 20 minimum); the Node.js floor of the OpenCode JS SDK binds the eval and replay machine only, because this package bundles no SDK (C002-NFR-402; `../10-context/scope.md` §5, S-07 fact F-10)
- **DoD:** C002-DOD-016

### C002-NFR-402 — No runtime dependencies in `architect-sdd`
- **Category:** Flexibility / installability
- **Statement:** THE `architect-sdd` package SHALL run without any package that is not bundled into its entries.
- **Metric:** entries of the manifest's `dependencies`; runtime imports of packages that are neither bundled nor Node.js built-ins
- **Threshold:** 0
- **Method:** manifest check on the packed tarball; both entries run from an install folder without other packages
- **Environment:** REF-WIN
- **Rationale:** constitution, forbidden technologies; C001-NFR-501 for the plugin
- **DoD:** C002-DOD-017

## 5. Maintainability

### C002-NFR-501 — No drift from the source plugin
- **Category:** Maintainability / modifiability
- **Statement:** THE target packages SHALL contain only files that the generator reproduces from the source plugin at the same commit.
- **Metric:** files of a target package proposed for release that are missing from, extra to, or different from a regeneration at the release commit
- **Threshold:** 0
- **Method:** the release check regenerates the target packages at the release commit and compares them with the packages proposed for release
- **Environment:** repository
- **Rationale:** C002-DEC-006; C002-GOAL-01 ("zero hand-maintained per-target copies"); C002-CON-01
- **DoD:** C002-DOD-018

## 6. Usability

### C002-NFR-601 — Time to the first interview on a generated target
- **Category:** Interaction capability / learnability
- **Statement:** WHEN a P-03 adopter follows the install notes of a target package on a fresh user profile, THE suite SHALL let them reach the first interview question of a new change within the threshold.
- **Metric:** elapsed time from opening the install notes to the first interview question, download time excluded, per target
- **Threshold:** ≤ 15 minutes
- **Method:** timed clean-profile run per target, recorded with the runs of C002-SC-01 and C002-SC-02
- **Environment:** REF-WIN, fresh user profile, host at its tested version
- **Rationale:** C001-NFR-602 sets the same threshold on Claude Code; C002-GOAL-03
- **DoD:** C002-DOD-019

## 8. Licensing

### C002-NFR-801 — License compliance of the distributed packages
- **Category:** Compliance
- **Statement:** THE target packages and the `architect-sdd` package SHALL include only code under the MIT license or under a license of the allowlist of C001-REQ-1114.
- **Metric:** files or bundled packages outside the allowlist
- **Threshold:** 0
- **Method:** build license check (C002-REQ-413) and an SPDX header scan of the packed outputs
- **Environment:** repository
- **Rationale:** C001-NFR-801; constitution, forbidden technologies
- **DoD:** C002-DOD-020
