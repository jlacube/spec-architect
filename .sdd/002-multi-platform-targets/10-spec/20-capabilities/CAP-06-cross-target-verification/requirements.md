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
- **Rationale:** C002-SC-04, C002-SC-05; the 14 existing checks stay unchanged; generating in the same run keeps the checked packages in step with the source plugin (C002-NFR-501)
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
- **Rationale:** C002-DEC-005; C002-GOAL-02, C002-SC-03; Q-safety-02 (spec round 2, `../../questions-log.md`): "Per-mechanism" — expected decisions per mechanism: C002-REQ-625, and for cases resting on hook inputs the generated mechanisms lack, C002-REQ-630 and C002-REQ-632 (Q-safety-04, spec round 4); cases that require a host capability: C002-REQ-633 (Q-safety-05, spec round 5); applicable cases: C002-REQ-626; cases not replayed are listed: C002-REQ-627; the corpus tool names (Write, Edit, NotebookEdit, Bash, PowerShell) and caller agents are mapped to each mechanism's input by C002-IF-009 §2; OpenCode's rules are evaluated by OpenCode itself through a headless session or its SDK (ideation §8; C002-R-001 D-01, D-02), started as the pinned host binary of the tested version (`../../10-context/scope.md` §3.1); the existing tests keep replaying the corpora against the Claude Code hooks with the expectations recorded in the corpora (baseline survey §3.2)
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
- **Statement:** WHILE an eval runner of a generated target runs a session, THE eval runner SHALL end the session when it reaches the turn cap or the spend cap of C002-NFR-105.
- **Rationale:** `runSession` caps turns and spend today (current-state E-9); three harnesses multiply eval cost (ideation §9)
- **Stories:** C002-US-603, C002-US-604
- **Priority:** Must
- **Acceptance:** C002-AC-611.1

### C002-REQ-612 — Evals through Copilot CLI
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the Copilot CLI eval runner runs the dev tier, THE Copilot CLI eval runner SHALL run the agent routing cases, the injection cases, the sdd MCP server guard cases and the non-interactive scenarios against the Copilot target package through Copilot CLI in non-interactive mode, naming each agent in the form `<plugin>:<agent>`.
- **Rationale:** C002-DEC-003; C002-R-001 D-03 (`-p`, `--agent`, JSON output, `--no-ask-user`); Copilot CLI is an eval tool only (C002-NG-01); C002-AS-04 settled: Copilot CLI 1.0.98 loads the package with `--plugin-dir`, confines subagents and refuses a bare agent name (`docs/spikes/S-08-copilot-vscode.md §2.1`, §2.3, §2.4, fact F-6); the sdd MCP servers are workspace MCP configuration entries, not plugin MCP configuration (C002-REQ-307), so the runner gives them to Copilot CLI itself (C002-IF-010)
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
- **Statement:** THE manual VS Code checklist SHALL contain steps for the sdd MCP server boundary, one interview round and one gate through `ask_user` including a skipped answer, one phase of a toy change from its creation to gate G1 on a fresh install, one Revise choice at gate G1 followed by the gate presented again, one run of the revise command on the approved ideation phase of the toy change, and one delegated edit in which the conductor, asked through an instruction planted in an artifact of the toy change, delegates an edit of a product-code file outside `.sdd/` to the host built-in agent `general-purpose` and the edit is denied by the Copilot subagent guard hook (`GUARD-HOOK-002`, or `GUARD-HOOK-001` when the host's edit tool is not in the tool classes file).
- **Rationale:** C002-DEC-003; C002-SC-02; C002-GOAL-03 (measure: "the gate, interview and revise scenarios pass on each target"; revise scenario: glossary); `ask_user` is the question tool of the local agent host (`docs/spikes/S-08-copilot-vscode.md §3.2`, fact F-5), and its input shape and its result without a choice are not in the S-08 record, so these steps also confirm them (C002-REQ-311); the delegated-edit step shows the Copilot subagent guard hook in VS Code (C002-REQ-327; rule 6 and `GUARD-HOOK-002`: C002-IF-008 §2) and confirms what the S-08 record does not show: that the host offers `general-purpose` to the workspace conductor and that its tool calls carry `agent_type` (C002-REQ-327 open item; C002-IF-005 §3)
- **Stories:** C002-US-605
- **Priority:** Must
- **Acceptance:** C002-AC-614.1

### C002-REQ-615 — Checklist record
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN P-01 completes a run of the manual VS Code checklist, THE repository SHALL contain a checklist record of that run with the date, the VS Code and GitHub Copilot Chat versions, the enforcement mode, the hooks state during the run (both Copilot modes: the subagent guard hook needs hooks enabled, C002-REQ-327), the result of each step and P-01's name.
- **Rationale:** DOD-G-01 of the constitution (manual scenario with an executed record); C002-REQ-618; the hooks state is the condition of the C002-DEC-005 exception (C002-REQ-629)
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
- **Statement:** WHEN the Copilot VS Code target is proposed for release, THE release check SHALL refuse the release unless a checklist record shows every step of the manual VS Code checklist passed.
- **Rationale:** C002-DEC-003 (Consequences)
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
- **Rationale:** C002-DEC-005 (the exception holds only "with hooks enabled"); C002-REQ-615 (hooks state in the record), C002-REQ-628; evidence taken with hooks disabled or through Copilot CLI alone does not meet P-01's condition
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
- **Rationale:** Q-safety-05 (spec round 5, `../../questions-log.md`): "Require it on the host (Recommended)" — "every case is really replayed". A call without arguments is refused by every mechanism whatever its link handling, so a capability-dependent case sent as a malformed call passes by construction and leaves untested what C002-R-001 leaves to the S-07 replay (whether symbolic links are resolved before matching, `../../../00-ideation/research/R-001-platform-facts.md:195-198`; critic CR-32). The capability is named by the case's `requires` field; today only PG-163 requires one (`file-symlink`, `tests/guards/path-corpus.json:1416-1422`), whose fixture the existing tests skip when Windows cannot create a file symbolic link (`tests/guards/fixture.ts:83-88`). Its expected decision is the corpus `deny` (glossary "Expected decision for a mechanism"). Such a case is never listed as not applicable: that list holds the identity-category cases of C002-REQ-626 only (Q-safety-04). A replay host without the capability cannot serve a release: C002-REQ-634
- **Stories:** C002-US-602
- **Priority:** Must
- **Acceptance:** C002-AC-633.1

### C002-REQ-634 — Release replays on a host with every required capability
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN a generated target is proposed for release, THE release check SHALL refuse the release unless the replay host of every corpus replay report of that target has every host capability that a case of the corpora cited by that report requires.
- **Rationale:** Q-safety-05 (spec round 5, `../../questions-log.md`): "release replays run on REF-WIN with Developer Mode on (or an elevated replay run); the release check refuses a report whose host lacks a capability a corpus case needs" (environment of C002-NFR-201 and C002-NFR-202). The report records its replay host's platform and capabilities (`replay_host`, C002-IF-009 §2) and cites its corpora by SHA-256, so the check compares the `requires` fields of those corpora with the recorded capabilities; the refusal and its error are in C002-IF-009 §5. The other release conditions: C002-REQ-617
- **Stories:** C002-US-606
- **Priority:** Must
- **Acceptance:** C002-AC-634.1
