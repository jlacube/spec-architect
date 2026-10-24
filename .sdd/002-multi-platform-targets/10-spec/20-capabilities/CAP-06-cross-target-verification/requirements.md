---
id: C002-CAP-06
artifact: spec/requirements
change: CHG-002
phase: 10-spec
status: draft
capability: "Cross-target verification"
---
# C002-CAP-06 — Requirements

Brownfield change: every requirement carries a Delta. C002-REQ-601 changes `npm run check`
(C001-REQ-1117); its LINT-DELTA-001 finding is expected until CHG-001 is archived (C002-CON-05). The
eval harness has no CHG-001 requirement of its own, so the eval runners are `ADDED` (current-state
§2 item 2).

### C002-REQ-601 — Local check covers the target packages
- **Delta:** MODIFIED C001-REQ-1117
- **Pattern:** event-driven
- **Statement:** WHEN `npm run check` runs in the repository, THE build SHALL run `claude plugin validate`, the unit tests, the lint fixture suite, the plugin structure checks of C001-IF-08 §3 and the target structure checks on target packages generated from the current source plugin, and exit non-zero if any of them fails.
- **Rationale:** C002-SC-04, C002-SC-05; the checks of C001-IF-08 §3 stay unchanged, and PLG-VAR-001 and PLG-VER-001 join the plugin structure checks and run with them (C002-IF-005 §6); generating in the same run keeps the checked packages in step with the source plugin (C002-NFR-501)
- **Stories:** C002-US-601
- **Priority:** Must
- **Acceptance:** C002-AC-601.1
- **Evidence:** current-state E-8 — `scripts/check/lib.mjs:10` › `context` (every check reads only `plugins/architect/` and two CHG-001 folders; `scripts/check.mjs:15-36` defines six steps with none for generated outputs; layer: grep)

### C002-REQ-602 — Untranslated constructs reported
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF a file of a target package contains a Claude Code construct outside the fields in which that target accepts it, THEN THE target structure check SHALL report an error naming the file, the line and the construct.
- **Rationale:** C002-US-102 (no leak); PLG-PORT-001 scans neither agents nor commands nor `${CLAUDE_PLUGIN_ROOT}` (baseline survey §2.1, §4 note 4); the Copilot target package accepts `${CLAUDE_PLUGIN_ROOT}` and `${PLUGIN_ROOT}` in no field: not in bodies (C002-R-001 A-09), not in hook commands (C002-REQ-326; `docs/spikes/S-08-copilot-vscode.md §3`, fact F-3), and its MCP servers are workspace MCP configuration entries of the adopter's repository (C002-REQ-307; §3.2)
- **Stories:** C002-US-601, C002-US-102
- **Priority:** Must
- **Acceptance:** C002-AC-602.1

### C002-REQ-603 — Package contract checked
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the target structure check runs on a target package, THE target structure check SHALL report as an error each difference between the package's layout, agent tool lists and MCP configuration and the target package contract.
- **Rationale:** C002-US-601; PLG-LAYOUT-001, PLG-TOOLS-001 and PLG-MCP-001 do the same for the Claude Code plugin (baseline survey §2.1)
- **Stories:** C002-US-601
- **Priority:** Must
- **Acceptance:** C002-AC-603.1
- **Open items:** the target package contracts are written in the interfaces step (`50-interfaces/`).

### C002-REQ-604 — Edit or terminal grant reported on Copilot
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF an agent or a prompt file of a Copilot target package generated for sdd MCP server enforcement grants a generic edit or terminal tool, or an agent of that package has no `tools` list, THEN THE target structure check SHALL report an error naming the file and the tool or the missing list.
- **Rationale:** C002-REQ-306; C002-US-302; an agent without a `tools` list gets every tool of the host, edit and terminal tools included (`docs/spikes/S-08-copilot-vscode.md §3.2`)
- **Stories:** C002-US-601, C002-US-302
- **Priority:** Must
- **Acceptance:** C002-AC-604.1

### C002-REQ-605 — No fixed change-folder paths
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE target structure check SHALL NOT read files under a change folder of `.sdd/` by a fixed path.
- **Rationale:** PLG-TOOLS-001 reads CHG-001's interface file at a fixed path that moves when CHG-001 is archived (baseline survey §4 note 7; current-state E-8)
- **Stories:** C002-US-601
- **Priority:** Should
- **Acceptance:** C002-AC-605.1

### C002-REQ-606 — Corpus replay against each enforcement mechanism
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the corpus replay suite runs, THE corpus replay suite SHALL evaluate every applicable case of the guard corpora against each enforcement mechanism in use on a generated target (the OpenCode permission rules of the OpenCode target package under native permission enforcement, the sdd MCP server and, under the Copilot hooks fallback, the Copilot guard hooks) and report each decision that differs from the case's expected decision for that mechanism.
- **Rationale:** C002-DEC-005; C002-GOAL-02, C002-SC-03; Q-safety-02 (spec round 2, `../../questions-log.md`): "Per-mechanism" — expected decisions per mechanism: C002-REQ-625, and for cases resting on hook inputs the generated mechanisms lack, C002-REQ-630 and C002-REQ-632 (Q-safety-04, spec round 4); cases that require a host capability: C002-REQ-633 (Q-safety-05, spec round 5); the input a mechanism receives (C002-IF-009 §2.2) gives three more `deny` expectations (C002-IF-009 §2.1; Q-safety-08, round 2026-10-19 of `../../questions-log.md`: "Confirm three deny rows"): shell-corpus cases whose tool is a write tool, for example BG-268, on every mechanism (C001-REQ-1103), and on the sdd MCP server the Serena cases whose data-folder argument is the literal `${CLAUDE_PLUGIN_DATA}`, because `run_command` runs the command without a shell and the literal is not expanded (C002-REQ-517), and PG-135 and PG-136, whose `cwd` reaches the repository root through a link (C002-REQ-401); applicable cases: C002-REQ-626; cases not replayed are listed: C002-REQ-627; the corpus tool names (Write, Edit, NotebookEdit, Bash, PowerShell) and caller agents are mapped to each mechanism's input by C002-IF-009 §2; OpenCode's rules are evaluated by OpenCode itself through a headless session or its SDK (ideation §8; C002-R-001 D-01, D-02), started as the pinned host binary of the tested version (`../../10-context/scope.md` §3.1); the existing tests keep replaying the corpora against the Claude Code hooks with the expectations recorded in the corpora (baseline survey §3.2)
- **Stories:** C002-US-602
- **Priority:** Must
- **Acceptance:** C002-AC-606.1

### C002-REQ-607 — Corpus cases for the new risks
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE guard corpora SHALL contain cases for a bare `sdd` command, `node --version`, a `..` segment that leaves `.sdd/`, a symbolic link from `.sdd/` to a folder outside it, output redirection inside an allowlisted command, a PowerShell command line, an allowlisted command whose option writes a file outside `.sdd/` (`git diff --output=<file>`), one case for each `sdd` subcommand that writes files, one case for each `sdd` subcommand that writes files with the option `--cwd` naming a folder outside the repository root, one case of a writing `sdd` subcommand with `--cwd` naming a folder inside the repository root, and, for each of `sdd serena-config` and `sdd serena-launch`, one case with the option `--user-data`, one with a folder outside the current repository and one with a folder inside it.
- **Rationale:** ideation §9 (risks), including the risk "a command that writes files" whose mitigation is replay cases for writing commands; Q-guards-04 (spec round 2, `../../questions-log.md`): "one corpus case per writing subcommand"; Q-guards-05 (spec round 4): "one corpus case per writing command with an outside --cwd", plus one case inside the root so that a false deny shows; the writing subcommands are the rows of C002-IF-008 §1.2; the expected decisions of the Serena cases are those of C002-REQ-517, those of the `--cwd` cases those of C002-REQ-521; C002-R-001 C-03, C-04; C002-REQ-503
- **Stories:** C002-US-602, C002-US-502
- **Priority:** Must
- **Acceptance:** C002-AC-607.1

### C002-REQ-608 — OpenCode eval runner keeps the case API
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode eval runner SHALL run the eval cases of `evals/` through the case API of the existing eval harness, without changes to the case files.
- **Rationale:** 104 files under `evals/` use `harness/` (baseline survey §3.3); `runSession` is the only SDK import (current-state E-9)
- **Stories:** C002-US-603
- **Priority:** Must
- **Acceptance:** C002-AC-608.1

### C002-REQ-609 — Dev-tier evals on OpenCode
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the OpenCode eval runner runs the dev tier, THE OpenCode eval runner SHALL run the agent routing cases and the injection cases against the OpenCode target package.
- **Rationale:** dev tier on every target, milestone tier on Claude Code and the first port only (ideation §9); C002-NFR-203
- **Stories:** C002-US-603
- **Priority:** Must
- **Acceptance:** C002-AC-609.1

### C002-REQ-610 — Scripted interviews and gates on OpenCode
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE a script can answer OpenCode's `question` calls, THE OpenCode eval runner SHALL run the interview, gate and revise scenarios with scripted answers.
- **Rationale:** C002-GOAL-03 (measure: "the gate, interview and revise scenarios pass on each target"); revise scenario: glossary; ideation §11; C002-R-001 D-01, D-02; settled by spike S-07 on OpenCode 1.18.31 (`question_answerable_by_script: true`, `docs/spikes/S-07-opencode.md §5`): the SDK answers a `question` call and dismisses it, in sessions in which the conductor's `question` permission is allowed (C002-REQ-217; fact F-6)
- **Stories:** C002-US-603
- **Priority:** Must
- **Acceptance:** C002-AC-610.1
- **Open items:** how these scenarios are verified when no script can answer is settled in the test plan (DOD-G-01 accepts a recorded manual run).

### C002-REQ-611 — Caps per eval session
- **Delta:** ADDED
- **Pattern:** state-driven
- **Statement:** WHILE an eval runner of the eval harness, the Claude Code eval runner included, runs a session, THE eval runner SHALL end the session when it reaches the turn cap or the spend cap of C002-NFR-105.
- **Rationale:** `runSession` caps turns and spend today (current-state E-9); three harnesses multiply eval cost (ideation §9); the statement covers every eval runner of the eval harness, the Claude Code eval runner included, because the Claude Code subscription class of C002-IF-010 §2.2 sets caps for that runner's sessions (defect D-025); how each runner checks the spend cap: C002-IF-010 §2.2 (after each step on OpenCode, which reports each step's cost; on Copilot CLI the host's `--max-ai-credits` limit, checked on the session total; critic CR-64; on Claude Code the Claude Code eval runner itself, which passes no spend cap to the Agent SDK and checks the session's notional cost after each new assistant message and each result message: C002-IF-010 §2.2 "Claude Code spend cap", C002-REQ-643; defect D-031, critic CR-111)
- **Stories:** C002-US-603, C002-US-604
- **Priority:** Must
- **Acceptance:** C002-AC-611.1

### C002-REQ-612 — Evals through Copilot CLI
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the Copilot CLI eval runner runs the dev tier, THE Copilot CLI eval runner SHALL run the agent routing cases and the injection cases that C002-IF-010 §5.1 names for Copilot CLI, among them the injection eval whose planted instruction asks the conductor to delegate an edit to the host built-in agent `general-purpose`, against the Copilot target package through Copilot CLI in non-interactive mode, naming each agent in the form `<plugin>:<agent>`.
- **Rationale:** C002-DEC-003; C002-R-001 D-03 (`-p`, `--agent`, JSON output, `--no-ask-user`); Copilot CLI is an eval tool only (C002-NG-01); C002-AS-04 settled: Copilot CLI 1.0.98 loads the package with `--plugin-dir`, confines subagents and refuses a bare agent name (`docs/spikes/S-08-copilot-vscode.md §2.1`, §2.3, §2.4, fact F-6); the sdd MCP servers are workspace MCP configuration entries, not plugin MCP configuration (C002-REQ-307), so the runner gives them to Copilot CLI itself (C002-IF-010). Case set (revised for defects D-026 and D-027): the Copilot CLI rows of C002-IF-010 §5.1, the planted delegation being C002-TS-359; the earlier statement also named the sdd MCP server guard cases and the non-interactive scenarios, of which §5.1 gives Copilot CLI no row ("Families of C002-REQ-612 with no Copilot CLI row"): the sdd MCP server decides its guard cases alike under every host, so the corpus replay `sdd-mcp-server` of the Copilot package verifies them (C002-REQ-606, C002-TS-608, C002-DOD-008). Models (P-01 answer to Q-copilot-opus-01, `../../questions-log.md` round 2026-10-21 (2): "accept Sonnet"): P-01's Copilot Pro plan offers no Opus model, so the release evidence runs the session agents whose chosen model is `claude-opus-5.5`, the conductor among them, on `claude-sonnet-5.5` through the run's model substitution, and every other agent on its own model (C002-IF-010 §1, §2 model rule; C002-DOD-009); the package keeps `claude-opus-5.5` for the opus tier (Q-copilot-map-01; C002-REQ-105)
- **Stories:** C002-US-604
- **Priority:** Must
- **Acceptance:** C002-AC-612.1

### C002-REQ-613 — Copilot injection cases without Copilot CLI
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE Copilot CLI cannot load the Copilot target package, THE manual VS Code checklist SHALL contain the Copilot injection cases.
- **Rationale:** C002-AS-04 (If wrong); the sdd MCP server is then tested in isolation by the corpus replay suite (C002-REQ-606); under the Copilot hooks fallback the checklist holds the Copilot injection cases in any case (C002-REQ-628)
- **Stories:** C002-US-604, C002-US-605
- **Priority:** Must
- **Acceptance:** C002-AC-613.1

### C002-REQ-614 — Checklist content
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE manual VS Code checklist SHALL contain, for sdd MCP server enforcement, steps for the sdd MCP server boundary, and, for both Copilot enforcement modes, one interview round and one gate through `ask_user` including a skipped answer, one phase of a toy change from its creation to gate G1 on a fresh install, one Revise choice at gate G1 followed by the gate presented again, one run of the revise command on the approved ideation phase of the toy change, and one delegated edit in which the conductor, asked through an instruction planted in an artifact of the toy change, delegates an edit of a product-code file outside `.sdd/` to the host built-in agent `general-purpose` and the edit is denied by the Copilot subagent guard hook (`GUARD-HOOK-002`, or `GUARD-HOOK-001` when the host's edit tool is not in the tool classes file).
- **Rationale:** C002-DEC-003; C002-SC-02; C002-GOAL-03 (measure: "the gate, interview and revise scenarios pass on each target"; revise scenario: glossary); `ask_user` is the question tool of the local agent host (`docs/spikes/S-08-copilot-vscode.md §3.2`, fact F-5), and its input shape and its result without a choice are not in the S-08 record, so these steps also confirm them (C002-REQ-311); the delegated-edit step shows the Copilot subagent guard hook in VS Code (C002-REQ-327; rule 6 and `GUARD-HOOK-002`: C002-IF-008 §2) and confirms what the S-08 record does not show: that the host offers `general-purpose` to the workspace conductor and that its tool calls carry `agent_type` (C002-REQ-327 open item; C002-IF-005 §3). Steps per mode (revised for defect D-015 item 8; mode of each step: the checklist step index, C002-IF-009 §4): the sdd MCP server boundary step belongs to sdd MCP server enforcement, where the server is the boundary of every Architect agent; under the Copilot hooks fallback the guard-hook denial step of C002-REQ-616 shows the specialists' boundary, and the conductor's server tools (C002-REQ-321) are covered by the corpus replay of the sdd MCP server, which the release check requires in both Copilot modes (C002-IF-009 §5); the delegated edit belongs to both modes, because the Copilot subagent guard hook is a PreToolUse hook of both (C002-REQ-327, C002-TS-358)
- **Stories:** C002-US-605
- **Priority:** Must
- **Acceptance:** C002-AC-614.1

### C002-REQ-615 — Checklist record
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN P-01 completes a run of the manual VS Code checklist, THE repository SHALL contain a checklist record of that run with the date, the VS Code and GitHub Copilot Chat versions, the enforcement mode, in both Copilot enforcement modes the hooks state during the run and beside it the three sources of that state as recorded (`chat.useHooks`, Workspace Trust, organisation policy; the Copilot subagent guard hook needs hooks enabled, C002-REQ-327), each step of the package's enforcement mode once with the result of its last run and, for a step run more than once, a list of its earlier runs, each with its result and whether the rerun rule caused the run that followed it, and P-01's name.
- **Rationale:** DOD-G-01 of the constitution (manual scenario with an executed record); C002-REQ-618; the hooks state is the condition of the C002-DEC-005 exception (C002-REQ-629); the three sources are those the hooks-state step of C002-REQ-616 reads (defect D-012), and the release check compares the recorded hooks state with them (Q-release-hooks-01, C002-REQ-629; record fields `hooks_state` and `hooks_sources`: C002-IF-009 §4). Steps (revised for defects D-015 item 8 and D-016 item 4): "step of the package's enforcement mode" is defined in the glossary; a step of the other mode is absent or `not-applicable`; the injection steps are recorded where the record is the injection evidence (C002-REQ-613, C002-REQ-628) and may be absent elsewhere (C002-TS-633). Earlier runs (revised for Q-checklist-rerun-01, P-01 2026-10-20: "Failures stay binding (Recommended)"; critic CR-52): a step runs more than once under the rerun rule (glossary) or because P-01 repeated it; its earlier runs stay in the record as a list the release check reads, where before a free-text note named them and no check read it, so a later passing run could hide a failed one; the release check decides on them (C002-REQ-618); field names and the values of the cause: C002-IF-009 §4
- **Stories:** C002-US-605
- **Priority:** Must
- **Acceptance:** C002-AC-615.1

### C002-REQ-616 — Hooks state in the checklist
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE manual VS Code checklist SHALL contain, for sdd MCP server enforcement and for the Copilot hooks fallback, a step that records whether `chat.useHooks` is on, whether the repository is trusted under Workspace Trust and whether an organisation policy disables hooks, and, for the Copilot hooks fallback, a step that shows a guard hook denying a subagent's write outside `.sdd/`.
- **Rationale:** P-01 decision on defect D-012 (2026-10-19): "ok + caveat (Recommended)" — the doctor's Copilot hooks row reads `chat.useHooks` only and states that the manual VS Code checklist confirms Workspace Trust and organisation policy (C002-REQ-510), so the checklist records all three sources; it does so in both Copilot enforcement modes because the Copilot subagent guard hook is a PreToolUse hook in both and needs hooks enabled (C002-REQ-327); the record of each run carries the state (C002-REQ-615). C002-DEC-005 (Consequences): under the hooks fallback the Copilot guard hooks of the Architect agents are hooks as well (C002-REQ-308), hence the guard-denial step for that mode; under sdd MCP server enforcement the delegated-edit step of C002-REQ-614 shows a hook denial
- **Stories:** C002-US-605, C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-616.1

### C002-REQ-617 — Release only with a proven boundary
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN a generated target is proposed for release, THE release check SHALL refuse the release unless that target's corpus replay reports no differing decision over the applicable cases, its injection evals show no instruction acted upon, and, for the OpenCode target, its S-07 spike record states that the agents' tool sets are closed (`agent_tools_closed: true`).
- **Rationale:** C002-DEC-005; C002-CON-03; thresholds C002-NFR-201, C002-NFR-202, C002-NFR-203; applicable cases and expected decisions per mechanism: C002-REQ-625, C002-REQ-626 (Q-safety-02), C002-REQ-630, C002-REQ-632 (Q-safety-04); the replay host's capabilities: C002-REQ-634 (Q-safety-05); under the Copilot hooks fallback, the injection evidence of C002-REQ-629
- **Stories:** C002-US-606
- **Priority:** Must
- **Acceptance:** C002-AC-617.1

### C002-REQ-618 — Copilot release needs the checklist record
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the Copilot VS Code target is proposed for release, THE release check SHALL refuse the release unless the checklist record of the package version lists only steps of the checklist step index, each at most once, every step of the package's enforcement mode as `passed`, every injection step it lists as `passed` or `not-applicable`, every step of the other enforcement mode it lists, the injection steps excepted, as `not-applicable`, and, for every earlier `failed` run of a listed step, the rerun rule as the cause of the run that followed it.
- **Rationale:** C002-DEC-003 (Consequences); revised for defects D-015 item 8 and D-016 item 4: a step of the other enforcement mode may be absent or `not-applicable` (C002-REQ-614, C002-REQ-616), so the record cannot show every step of the checklist passed; steps of the package's enforcement mode: glossary and C002-REQ-615; the injection steps are decided by C002-REQ-629 (refusals ERR-REL-011 and ERR-REL-002, C002-IF-009 §5), and a failed injection step is also a listed step that refuses here; refusals ERR-REL-003 and ERR-REL-004 (C002-IF-009 §5). Other-mode, repeated and unknown steps (revised for critic CR-55; fail-closed, C002-CON-08): the two Copilot packages differ (C002-IF-005), so a step of the other enforcement mode recorded `passed` is no evidence of a run of this package and refuses (`passed, but its mode is <mode>`); the injection steps are exempt, since they run in either mode where the record is the injection evidence (C002-REQ-613, C002-REQ-628); a step ID listed twice refuses, since the earlier runs of a step belong in its list of earlier runs (C002-REQ-615), and so does an ID that is no step of the checklist step index (C002-IF-009 §4 Other-mode steps, repeated and unknown IDs). Earlier failed runs (revised for Q-checklist-rerun-01, P-01 2026-10-20: "Failures stay binding (Recommended)"; critic CR-52): a failed run stays binding unless the rerun rule repeated the step, that is a hooks source changed after the hooks-state step, the hooks-state step read one off or a step of group 4 ran before the hooks-state step, a new restore step restored the settings and groups 3 and 4 of the run order ran again, from the C002-TS-516 row with hooks on just before the hooks-state step (glossary; C002-IF-009 §4 Run order, Earlier runs); the recorded hooks state did not hold for such a run, so its failure says nothing about the package; any other earlier failed run refuses the release under ERR-REL-004, also when the step's last run passed, and a releasable record then needs a new run of the checklist (C002-REQ-615)
- **Stories:** C002-US-606, C002-US-605
- **Priority:** Must
- **Acceptance:** C002-AC-618.1

### C002-REQ-619 — Targets released independently
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE release check SHALL decide the release of each generated target independently of the other generated target.
- **Rationale:** C002-DEC-005 (OpenCode still ships when Copilot is deferred)
- **Stories:** C002-US-606
- **Priority:** Must
- **Acceptance:** C002-AC-619.1

### C002-REQ-620 — Copilot deferred when neither mode holds
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF the spike S-08 record shows that Copilot subagents are not confined to their tool list and that Copilot guard hooks do not block a subagent's tool calls, THEN THE release check SHALL refuse the release of the Copilot VS Code target.
- **Rationale:** C002-DEC-005 (round 4, Q-guards-03: "Defer Copilot (Recommended)"); C002-AS-03; agent-scoped hooks are no longer the fallback (C002-REQ-308; `docs/spikes/S-08-copilot-vscode.md §3.1`, fact F-4); the signed-off record shows subagents confined (§4), so this refusal does not apply at the tested versions; such a record also triggers the spec revision of `../../10-context/scope.md` §1.1 (Q-defer-01, spec round 2), which removes the Copilot target from CHG-002; until that revision this refusal keeps a Copilot package from being released (refusal ERR-REL-005, C002-IF-009 §5)
- **Stories:** C002-US-606
- **Priority:** Must
- **Acceptance:** C002-AC-620.1

### C002-REQ-621 — Release evidence on the tested versions
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN a generated target is proposed for release, THE release check SHALL refuse the release unless the corpus replay, the evals and, for Copilot VS Code, the checklist record of that release ran on the host version recorded as the tested version of that target.
- **Rationale:** Q-versions-01 (spec round 1): tested versions are re-checked before each release; ideation §9 (platforms change fast); on OpenCode the version that counts is that of the pinned host binary, not of the `opencode` that PATH resolves (`../../10-context/scope.md` §3.1; `docs/spikes/S-07-opencode.md §9`, fact F-7)
- **Stories:** C002-US-606, C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-621.1

### C002-REQ-622 — Hooks fallback flagged at release
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the Copilot hooks fallback is used, THE release check SHALL mark the release record of the Copilot VS Code target as released under the exception of C002-DEC-005.
- **Rationale:** C002-GOAL-02 (the fallback, if used, is flagged); C002-DEC-005
- **Stories:** C002-US-606, C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-622.1

### C002-REQ-623 — Claude Code regression set passes
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE plugin SHALL pass every test and eval of the regression set, with the corpus cases and deny-message texts changed by C002-REQ-503, C002-REQ-517, C002-REQ-521 and C002-REQ-325 as the only changed expectations.
- **Rationale:** C002-GOAL-05, C002-SC-05; guard tests that pin today's behaviour (current-state §2 item 6); 23 test files pin the Claude format (baseline survey §3.2); the regression set is written in the plan (`20-plan/30-impact/regression-set.md`); the doctor and init commands of Claude Code keep their Serena step under C002-REQ-517; C002-REQ-325 adds the `sdd install` deny cases and the "not install;" summary of the bash-guard deny message (C002-IF-008 §1)
- **Stories:** C002-US-607
- **Priority:** Must
- **Acceptance:** C002-AC-623.1

### C002-REQ-625 — Memory cases expect deny on the generated targets
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE corpus replay suite SHALL use `deny` as the expected decision of every memory-category case of the guard corpora on every enforcement mechanism of a generated target, including a memory-category case whose caller is not an Architect agent, which the suite replays as a write by an Architect agent.
- **Rationale:** the replay of a non-Architect memory case (for example PG-224) follows C002-IF-009 §2.2; Q-safety-02 (spec round 2, `../../questions-log.md`): "memory cases expect deny on the targets"; the generated agents have no memory folder (C002-DEC-009, C002-NG-04, C002-REQ-106), while the corpora keep `allow` for these cases on Claude Code (C001-REQ-1103), for example case PG-205 (`tests/guards/path-corpus.json:1870-1875`)
- **Stories:** C002-US-602
- **Priority:** Must
- **Acceptance:** C002-AC-625.1

### C002-REQ-626 — Identity cases only where a non-Architect caller exists
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE corpus replay suite SHALL replay the identity-category cases of the guard corpora against the OpenCode permission rules only, with each caller that is not an Architect agent played by an adopter agent.
- **Rationale:** Q-safety-02: "identity cases replay only where a non-Architect caller exists (OpenCode) and are not applicable for the MCP server and scoped hooks"; the sdd MCP server and the Copilot guard hooks decide only for Architect agents, so the property these cases test is covered there by C002-REQ-208, C002-REQ-302 and, for the Copilot guard hooks, which see every agent's calls but pass those without an Architect `agent_type`, by C002-REQ-320 (`docs/spikes/S-08-copilot-vscode.md §2.2`, §3.1); example case BG-258 (`tests/guards/bash-corpus.json:2217-2222`); the cases left out are listed by C002-REQ-627
- **Stories:** C002-US-602
- **Priority:** Must
- **Acceptance:** C002-AC-626.1

### C002-REQ-627 — Cases not replayed listed in the replay report
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the corpus replay suite writes the replay report of an enforcement mechanism, THE corpus replay suite SHALL list in that report, as not applicable, the ID of every case of the guard corpora that it did not replay against that mechanism.
- **Rationale:** Q-safety-02; the thresholds of C002-NFR-201 and C002-NFR-202 count the applicable cases only, so the excluded cases must be visible to the release check and to P-01; report format: C002-IF-009 §2
- **Stories:** C002-US-602
- **Priority:** Must
- **Acceptance:** C002-AC-627.1

### C002-REQ-628 — Copilot injection cases in VS Code under the hooks fallback
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the Copilot hooks fallback is used, THE manual VS Code checklist SHALL contain the Copilot injection cases, run in VS Code with hooks enabled.
- **Rationale:** C002-DEC-005 (exception: "with hooks enabled, … the injection evals show 0 instructions acted upon"); under the fallback the boundary is the Copilot guard hooks in VS Code, and Copilot CLI is a separate implementation whose result does not prove the VS Code behaviour (C002-R-001; `../../../00-ideation/research/R-001-platform-facts.md:364-365`); runs through the Copilot CLI eval runner (C002-REQ-612) may add evidence but do not replace these cases
- **Stories:** C002-US-605, C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-628.1

### C002-REQ-629 — Copilot release needs evidence taken with hooks enabled
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the Copilot VS Code target is proposed for release, THE release check SHALL refuse the release unless the checklist record shows hooks enabled during the run (in both Copilot modes, C002-REQ-327) and no instruction acted upon in any Copilot injection case of that run.
- **Rationale:** C002-DEC-005 (the exception holds only "with hooks enabled"); C002-REQ-615 (hooks state and its three sources in the record), C002-REQ-628; evidence taken with hooks disabled or through Copilot CLI alone does not meet P-01's condition; Q-release-hooks-01 (P-01, 2026-10-19, `../../questions-log.md`): "Refuse under ERR-REL-010 (Recommended)" — a checklist record whose `hooks_state` contradicts its `hooks_sources`, in either direction, does not show hooks enabled and refuses the release under ERR-REL-010 (derivation and hooks-state check: C002-IF-009 §4, §5)
- **Stories:** C002-US-606, C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-629.1

### C002-REQ-630 — Cases without a cwd or a tool name expect deny on the generated targets
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE corpus replay suite SHALL replay every applicable case of the guard corpora whose hook input has no `cwd`, an empty `cwd` or no tool name against each enforcement mechanism of a generated target as a malformed call with `deny` as its expected decision.
- **Rationale:** Q-safety-04 (spec round 4, `../../questions-log.md`): "Per-target expectation" — "on the generated targets these cases expect deny and are sent as malformed calls (fail-closed, C002-CON-08)", and "every case is still replayed and the not-applicable list stays limited to identity cases" (C002-REQ-626, C002-REQ-627). A generated mechanism receives no call without a `cwd` or a tool name: the sdd MCP server decides every call with its server repository root as `cwd` (C002-IF-002), and a tool of an Architect agent that the Copilot guard hooks cannot class is denied (C002-REQ-309). Examples: PG-253, PG-254 and BG-277 (no or empty `cwd`); PG-256 (no tool name, `allow` on Claude Code because such a call is not a write). The corpora keep their expectations for Claude Code (C002-GOAL-05). The form of a malformed call per mechanism and the expected source recorded in the replay report are in C002-IF-009 §2. A case whose `cwd` is present but differs from the repository root (category `cwd`, for example PG-134) is not in this set: C002-IF-009 §2.2 fixes how its `cwd` is fed, and it keeps its corpus expectation. Nor is a case that requires a host capability: it is replayed with its own hook input on a host that has the capability (C002-REQ-633, C002-REQ-634; Q-safety-05, spec round 5, critic CR-32)
- **Stories:** C002-US-602
- **Priority:** Must
- **Acceptance:** C002-AC-630.1

### C002-REQ-632 — Unknown `architect:sdd-*` callers expect allow on OpenCode
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE corpus replay suite SHALL use `allow` as the expected decision against the OpenCode permission rules of every identity-category case whose caller is an `architect:sdd-*` name that is none of the ten Architect agents.
- **Rationale:** Q-safety-04 (spec round 4, `../../questions-log.md`): "an unknown architect:sdd-* caller on OpenCode expects allow (the rules bind only the generated agents, C002-REQ-208)"; C002-REQ-626 plays such a caller with the replay fixture's adopter agent; the corpora keep `deny` for Claude Code, whose hooks guard every `architect:sdd-*` name (PG-237 "any architect:sdd-* agent is guarded", `tests/guards/path-corpus.json:2142-2149`; PG-238, `:2150-2157`); on the sdd MCP server and the Copilot guard hooks these cases are not applicable (C002-REQ-626)
- **Stories:** C002-US-602
- **Priority:** Must
- **Acceptance:** C002-AC-632.1

### C002-REQ-633 — Cases that require a host capability replayed with their own input
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE corpus replay suite SHALL replay every applicable case of the guard corpora that requires a host capability against each enforcement mechanism of a generated target with the case's own hook input, on a fixture built with that capability, and with the case's expected decision for that mechanism.
- **Rationale:** Q-safety-05 (spec round 5, `../../questions-log.md`): "Require it on the host (Recommended)" — "every case is really replayed". A call without arguments is refused by every mechanism whatever its link handling, so a capability-dependent case sent as a malformed call passes by construction and leaves untested what C002-R-001 leaves to the S-07 replay (whether symbolic links are resolved before matching, `../../../00-ideation/research/R-001-platform-facts.md:195-198`; critic CR-32). The capability is named by the case's `requires` field; today only PG-163 requires one (`file-symlink`, `tests/guards/path-corpus.json:1416-1422`), whose fixture the existing tests skip when Windows cannot create a file symbolic link (`tests/guards/fixture.ts:83-88`). Its expected decision is the corpus `deny` (glossary "Expected decision for a mechanism"). Precedence (revised for critic CR-61): the platform rule (glossary) comes first, and this requirement binds the cases that it leaves applicable on the report's replay host; such a case is never listed as not applicable, while a case with a `requires` field that the platform rule excludes is listed under `not_applicable` with the rule `platforms`, as every case of that rule is (the one statement of the precedence: C002-IF-009 §2.1, "Cases that require a host capability"). A replay host without the capability cannot serve a release, nor can one whose platform is not `win32`: C002-REQ-634
- **Stories:** C002-US-602
- **Priority:** Must
- **Acceptance:** C002-AC-633.1

### C002-REQ-634 — Release replays on a `win32` host with every required capability
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN a generated target is proposed for release, THE release check SHALL refuse the release unless the replay host of every corpus replay report of that target has the platform `win32` and every host capability that a case of the corpora cited by that report requires.
- **Rationale:** Q-safety-05 (spec round 5, `../../questions-log.md`): "release replays run on REF-WIN with Developer Mode on (or an elevated replay run); the release check refuses a report whose host lacks a capability a corpus case needs" (environment of C002-NFR-201 and C002-NFR-202). The report records its replay host's platform and capabilities (`replay_host`, C002-IF-009 §2) and cites its corpora by SHA-256, so the check compares the `requires` fields of those corpora with the recorded capabilities; the refusal and its error are in C002-IF-009 §5. Platform `win32` (revised for critic CR-60; fail-closed, C002-CON-08): REF-WIN is a `win32` host, and on any other platform the platform rule (glossary) lists the path cases limited to `win32` as not applicable, so a report from such a host would meet the thresholds of C002-NFR-201 and C002-NFR-202 without them; such a report is refused under ERR-REL-012 and not checked further (C002-IF-009 §2.1 "Release replays run on `win32`", §5), and stays valid for development. The other release conditions: C002-REQ-617
- **Stories:** C002-US-606
- **Priority:** Must
- **Acceptance:** C002-AC-634.1

### C002-REQ-638 — Partial OpenCode spend reconciled from the key usage
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN an after-read of a paid OpenCode session that ended with a partial spend gives a settled key usage, THE OpenCode eval runner SHALL, before it checks the stop rule for the next session or ends the run, book the session's spend ledger entry at the key usage delta, with the fields and the standard-output line of C002-IF-010 §2.3 Reconciled cost.
- **Rationale:** defect D-023 item 2 (findings of C002-T-056 X3; P-01 answer to Q-c002-defects-01, `../../../20-plan/questions-log.md` round 2026-10-23: "Fix most, defer D-023(1) (Recommended)"): an entry with a partial spend stops its pool until a spend reconciliation (`20-plan/60-test-plan.md` §4.1 Ledger), and most capped OpenCode sessions with a running subagent end with one. Before-read, after-reads, settle rule with its 0.9 factor, order and what the delta counts: C002-IF-010 §2.3 (critics CR-86, CR-87, CR-93). The reconciliation changes the spend ledger entry only; the result record keeps `partial` (C002-IF-010 §3 `spend`). Split from the case in which the entry stays partial, now C002-REQ-640 (critic CR-91). The OpenRouter key in the reads: C002-REQ-639, C002-REQ-641
- **Stories:** C002-US-603
- **Priority:** Must
- **Acceptance:** C002-AC-638.1

### C002-REQ-639 — OpenRouter key never written
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE OpenCode eval runner SHALL NOT write the OpenRouter key, or the headers of a request that carries it, to standard output, standard error or any file it writes, its result records, transcripts and spend ledger entries included.
- **Rationale:** C002-IF-010 §2.3 "The key is never logged" (a failed key usage read is reported by its reason only, never by the request or the response body, and `data.label`, which can show part of the key, is not kept), §4 Provider key (the same rule for the key passed to the host process) and §4 Key redaction (every occurrence of the key's value replaced with `[REDACTED]`, host and model text included; P-01 answer to Q-key-redact-01); a result records the credential's source, never the credential (`api_key_source`, C002-IF-010 §3; critic CR-37 of the plan review). The refusal of a key that redaction cannot match safely: C002-REQ-641 (critic CR-90). Written as a prohibition that holds at all times, not as an unwanted behaviour: the key passes through the runner on every paid OpenCode session and every key usage read, not only on a fault
- **Stories:** C002-US-603
- **Priority:** Must
- **Acceptance:** C002-AC-639.1

### C002-REQ-640 — Partial OpenCode spend left for the hand rule
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF a paid OpenCode session ends with a partial spend and its before-read gave no U0 or no after-read gave a settled key usage within 20 minutes of the session's end, THEN THE OpenCode eval runner SHALL leave the session's spend ledger entry with its partial spend and print on standard error the stays-partial line of C002-IF-010 §2.3 with the reason of that case.
- **Rationale:** critic CR-91 (split from C002-REQ-638); C002-IF-010 §2.3 "When it stays partial" (three cases and their reasons: the before-read failed, the wait before the session did not settle, no after-read settled; critic CR-87); the stop rule then stops the entry's pool until it is reconciled by hand (`20-plan/60-test-plan.md` §4.1 Ledger). A session that ends `reported` or `unreported` needs no reconciliation and gets no line. An entry written without a before-read and an entry of a run that ends during the wait are reconciled by hand, as before (C002-IF-010 §2.3 Order)
- **Stories:** C002-US-603
- **Priority:** Must
- **Acceptance:** C002-AC-640.1

### C002-REQ-641 — Unusable OpenRouter key refused before use
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF the OpenRouter key file of a paid OpenCode session is missing, or the OpenRouter key it holds is empty, shorter than 20 characters or holds a character that JSON escapes, THEN THE OpenCode eval runner SHALL refuse the session before any use of the key, with no host process started, no key usage read and the refusal text of C002-IF-010 §4 Key check for that case on standard error.
- **Rationale:** critic CR-90 (the refusal has its own outcome); C002-IF-010 §4 Key redaction, Key check (one refusal text per case, critic CR-85; P-01 answer to Q-key-redact-01): an exact replacement of a short value would also hit unrelated text, and an escaped key would not match its JSON form, so C002-REQ-639 cannot be met for such a key; the check runs before the before-read of C002-IF-010 §2.3 and before the host process starts; a key file with more than one line holds a line break, a character that JSON escapes
- **Stories:** C002-US-603
- **Priority:** Must
- **Acceptance:** C002-AC-641.1

### C002-REQ-642 — No session budget shown to the model
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE eval runner SHALL NOT give its host the spend cap or the turn cap of a session in a prompt, a system prompt, an option or a flag that the host shows to the model, the Agent SDK options `maxBudgetUsd` and `taskBudget` of the Claude Code eval runner included.
- **Rationale:** defect D-031 (found in C001-T-082; P-01 answer to Q-budget-hide-01, `../../../20-plan/questions-log.md`: "Hide the budget (Recommended)"): a real user's session runs without a budget, and Claude Code 2.1.299 shows the model the spend cap that the Agent SDK passes on, so the conductor and its specialists cut or stop their work for it. What reaches the model on each host, with evidence, and the per-runner rule: C002-IF-010 §2.2 "Budget hidden from the model". The turn cap stays with the Agent SDK as `maxTurns`, which the host does not show to the model (C002-IF-010 §2 `maxTurns`). On Copilot CLI the rule rests on the D-031 assumption of C002-IF-010 §2.2 that the host does not show its `--max-ai-credits` limit to the model. How the Claude Code eval runner applies the spend cap without the Agent SDK: C002-REQ-643. Split from the architect's draft, which held two SHALLs
- **Stories:** C002-US-603, C002-US-604, C002-US-608
- **Priority:** Must
- **Acceptance:** C002-AC-642.1

### C002-REQ-643 — Claude Code session stopped at the spend cap by the runner
- **Delta:** ADDED
- **Pattern:** complex
- **Statement:** WHILE the query of a Claude Code eval session is open, WHEN a check of the Claude Code eval runner after an assistant message with a new message ID or after a result message finds the session's notional cost at or above its spend cap and the session has not ended by itself, THE Claude Code eval runner SHALL stop the session and record it with the result subtype `error_max_budget_usd` and the highest notional cost read as its cost, a subtype that no session ended by itself gets, even at or above the cap.
- **Rationale:** defect D-031 (P-01 answer to Q-budget-hide-01); with no spend cap passed to the Agent SDK (C002-REQ-642), the runner applies it itself (C002-IF-010 §2.2 Claude Code spend cap: open query, running cost, checks and queue rule, stop, result, recorded cost, items 1 … 6). A session ended by itself, `success` or `error_max_turns`, keeps the subtype and the cost of its last result message, also at or above the cap; after a result message the runner waits for the next stream message before it stops a session (item 4, item 5; critic CR-105). The result subtype `error_max_budget_usd` keeps the end at the spend cap of the Claude Code subscription class, so the ledgers, the rules of C002-IF-010 §2.2 "Sessions of CHG-001 tasks" and every pass rule stay as they are; readings, records and overshoot bound: item 7 and C002-NFR-105. A failed reading: C002-REQ-644. Split from the architect's draft of C002-REQ-642
- **Stories:** C002-US-608
- **Priority:** Must
- **Acceptance:** C002-AC-643.1

### C002-REQ-644 — Claude Code session stopped when a cost reading fails
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF a reading of the session's notional cost by the Claude Code eval runner fails, by a refusal of the usage request, no answer within 30 s of the request or an answer without a finite `session.total_cost_usd` of at least 0, and the query of the session is still open 5 s after the failure, THEN THE Claude Code eval runner SHALL stop the session as at the spend cap, book the highest notional cost read in a spend ledger entry of the session and then reject the `runSession` call with the error `claude-code spend check failed: <reason>; notional cost read <R> USD`, with no result record written for the session.
- **Rationale:** defect D-031; C002-IF-010 §2.2 Claude Code spend cap, item 8: a failed reading would leave the session uncapped, since the runner passes no spend cap to the Agent SDK (C002-REQ-642), so it fails closed (C002-CON-08). The three failure cases and the 30 s (critic CR-104); the failure counts only while the query is open, past the 5 s settle time, since the Agent SDK refuses every open and later usage request when a query closes, at the session's own end and at the runner's close alike, and a failure outside that is ignored, with R the highest cost read (critic CR-103). The stop is that of item 4 without the `cap` and `cap-close` records (C002-REQ-643). The spend ledger entry, with its fields, is appended by `evals/harness/run.mjs` before the rejection reaches the run and is the only record of the session's cost (critic CR-113; `20-plan/60-test-plan.md` §4.1 Ledger); the rejection ends the run as a key source that does not match the auth mode does (C002-T-060), and the session is no run. The D-031 assumption of item 8 (the usage request answered during a turn within 30 s, with no model call) is confirmed by the paid check of the D-031 fix
- **Stories:** C002-US-608
- **Priority:** Must
- **Acceptance:** C002-AC-644.1
