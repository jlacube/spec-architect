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
- **Rationale:** C002-US-102 (no leak); PLG-PORT-001 scans neither agents nor commands nor `${CLAUDE_PLUGIN_ROOT}` (baseline survey §2.1, §4 note 4); Copilot accepts `${CLAUDE_PLUGIN_ROOT}` in hook and MCP fields only (C002-R-001 A-09)
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
- **Statement:** IF an agent or a prompt file of a Copilot target package generated for sdd MCP server enforcement grants a generic edit or terminal tool, THEN THE target structure check SHALL report an error naming the file and the tool.
- **Rationale:** C002-REQ-306; C002-US-302
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
- **Statement:** WHEN the corpus replay suite runs, THE corpus replay suite SHALL evaluate every applicable case of the guard corpora against each enforcement mechanism in use on a generated target (the OpenCode permission rules of the OpenCode target package under native permission enforcement, the sdd MCP server and, under the Copilot hooks fallback, the agent-scoped guard hooks) and report each decision that differs from the case's expected decision for that mechanism.
- **Rationale:** C002-DEC-005; C002-GOAL-02, C002-SC-03; Q-safety-02 (spec round 2, `../../questions-log.md`): "Per-mechanism" — expected decisions per mechanism: C002-REQ-625, and for cases resting on hook inputs the generated mechanisms lack, C002-REQ-630 and C002-REQ-632 (Q-safety-04, spec round 4); applicable cases: C002-REQ-626; cases not replayed are listed: C002-REQ-627; the corpus tool names (Write, Edit, NotebookEdit, Bash, PowerShell) and caller agents are mapped to each mechanism's input by C002-IF-009 §2; OpenCode's rules are evaluated by OpenCode itself through a headless session or its SDK (ideation §8; C002-R-001 D-01, D-02); the existing tests keep replaying the corpora against the Claude Code hooks with the expectations recorded in the corpora (baseline survey §3.2)
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
- **Rationale:** C002-GOAL-03 (measure: "the gate, interview and revise scenarios pass on each target"); revise scenario: glossary; whether `opencode run` or the SDK can answer a `question` call is open for spike S-07 (ideation §11; C002-R-001 D-01, D-02)
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
- **Statement:** WHEN the Copilot CLI eval runner runs the dev tier, THE Copilot CLI eval runner SHALL run the agent routing cases, the injection cases, the sdd MCP server guard cases and the non-interactive scenarios against the Copilot target package through Copilot CLI in non-interactive mode.
- **Rationale:** C002-DEC-003; C002-R-001 D-03 (`-p`, `--agent`, JSON output, `--no-ask-user`); Copilot CLI is an eval tool only (C002-NG-01); relies on C002-AS-04
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
- **Statement:** THE manual VS Code checklist SHALL contain steps for the sdd MCP server boundary, one interview round and one gate through `vscode/askQuestions` including a skipped answer, one phase of a toy change from its creation to gate G1 on a fresh install, one Revise choice at gate G1 followed by the gate presented again, and one run of the revise command on the approved ideation phase of the toy change.
- **Rationale:** C002-DEC-003; C002-SC-02; C002-GOAL-03 (measure: "the gate, interview and revise scenarios pass on each target"; revise scenario: glossary)
- **Stories:** C002-US-605
- **Priority:** Must
- **Acceptance:** C002-AC-614.1

### C002-REQ-615 — Checklist record
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN P-01 completes a run of the manual VS Code checklist, THE repository SHALL contain a checklist record of that run with the date, the VS Code and GitHub Copilot Chat versions, the enforcement mode, under the Copilot hooks fallback the hooks state during the run, the result of each step and P-01's name.
- **Rationale:** DOD-G-01 of the constitution (manual scenario with an executed record); C002-REQ-618; the hooks state is the condition of the C002-DEC-005 exception (C002-REQ-629)
- **Stories:** C002-US-605
- **Priority:** Must
- **Acceptance:** C002-AC-615.1

### C002-REQ-616 — Hooks state in the checklist
- **Delta:** ADDED
- **Pattern:** optional-feature
- **Statement:** WHERE the Copilot hooks fallback is used, THE manual VS Code checklist SHALL contain a step that records whether hooks are enabled and a step that shows a guard hook denying a subagent's write outside `.sdd/`.
- **Rationale:** C002-DEC-005 (Consequences)
- **Stories:** C002-US-605, C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-616.1

### C002-REQ-617 — Release only with a proven boundary
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN a generated target is proposed for release, THE release check SHALL refuse the release unless that target's corpus replay reports no differing decision over the applicable cases, its injection evals show no instruction acted upon, and, for the OpenCode target, its S-07 spike record states that the agents' tool sets are closed (`agent_tools_closed: true`).
- **Rationale:** C002-DEC-005; C002-CON-03; thresholds C002-NFR-201, C002-NFR-202, C002-NFR-203; applicable cases and expected decisions per mechanism: C002-REQ-625, C002-REQ-626 (Q-safety-02), C002-REQ-630, C002-REQ-632 (Q-safety-04); under the Copilot hooks fallback, the injection evidence of C002-REQ-629
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
- **Statement:** IF the spike S-08 record shows that Copilot subagents are not confined to their tool list and that agent-scoped hooks do not block a subagent's tool calls, THEN THE release check SHALL refuse the release of the Copilot VS Code target.
- **Rationale:** C002-DEC-005 (round 4, Q-guards-03: "Defer Copilot (Recommended)"); C002-AS-03; such a record also triggers the spec revision of `../../10-context/scope.md` §1.1 (Q-defer-01, spec round 2), which removes the Copilot target from CHG-002; until that revision this refusal keeps a Copilot package from being released (refusal ERR-REL-005, C002-IF-009 §5)
- **Stories:** C002-US-606
- **Priority:** Must
- **Acceptance:** C002-AC-620.1

### C002-REQ-621 — Release evidence on the tested versions
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN a generated target is proposed for release, THE release check SHALL refuse the release unless the corpus replay, the evals and, for Copilot VS Code, the checklist record of that release ran on the host version recorded as the tested version of that target.
- **Rationale:** Q-versions-01 (spec round 1): tested versions are re-checked before each release; ideation §9 (platforms change fast)
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
- **Statement:** THE plugin SHALL pass every test and eval of the regression set, with the corpus cases and deny-message texts changed by C002-REQ-503, C002-REQ-517 and C002-REQ-521 as the only changed expectations.
- **Rationale:** C002-GOAL-05, C002-SC-05; guard tests that pin today's behaviour (current-state §2 item 6); 23 test files pin the Claude format (baseline survey §3.2); the regression set is written in the plan (`20-plan/30-impact/regression-set.md`); the doctor and init commands of Claude Code keep their Serena step under C002-REQ-517
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
- **Rationale:** Q-safety-02: "identity cases replay only where a non-Architect caller exists (OpenCode) and are not applicable for the MCP server and scoped hooks"; the sdd MCP server and the agent-scoped guard hooks decide only for Architect agents, so the property these cases test is covered there by C002-REQ-208 and C002-REQ-302; example case BG-258 (`tests/guards/bash-corpus.json:2217-2222`); the cases left out are listed by C002-REQ-627
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
- **Rationale:** C002-DEC-005 (exception: "with hooks enabled, … the injection evals show 0 instructions acted upon"); under the fallback the boundary is the agent-scoped hooks of VS Code, and Copilot CLI is a separate implementation whose result does not prove the VS Code behaviour (C002-R-001; `../../../00-ideation/research/R-001-platform-facts.md:364-365`); runs through the Copilot CLI eval runner (C002-REQ-612) may add evidence but do not replace these cases
- **Stories:** C002-US-605, C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-628.1

### C002-REQ-629 — Hooks-fallback release needs evidence taken with hooks enabled
- **Delta:** ADDED
- **Pattern:** complex
- **Statement:** WHERE the Copilot hooks fallback is used, WHEN the Copilot VS Code target is proposed for release, THE release check SHALL refuse the release unless the checklist record shows hooks enabled during the run and no instruction acted upon in any Copilot injection case of that run.
- **Rationale:** C002-DEC-005 (the exception holds only "with hooks enabled"); C002-REQ-615 (hooks state in the record), C002-REQ-628; evidence taken with hooks disabled or through Copilot CLI alone does not meet P-01's condition
- **Stories:** C002-US-606, C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-629.1

### C002-REQ-630 — Cases without a cwd or a tool name expect deny on the generated targets
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE corpus replay suite SHALL replay every applicable case of the guard corpora whose hook input has no `cwd`, an empty `cwd` or no tool name, or that needs a capability (`requires`) the replay host lacks, against each enforcement mechanism of a generated target as a malformed call with `deny` as its expected decision.
- **Rationale:** Q-safety-04 (spec round 4, `../../questions-log.md`): "Per-target expectation" — "on the generated targets these cases expect deny and are sent as malformed calls (fail-closed, C002-CON-08)", and "every case is still replayed and the not-applicable list stays limited to identity cases" (C002-REQ-626, C002-REQ-627). A generated mechanism receives no call without a `cwd` or a tool name: the sdd MCP server decides every call with its server repository root as `cwd` (C002-IF-002), and a tool the agent-scoped guard hooks cannot class is denied (C002-REQ-309). Examples: PG-253, PG-254 and BG-277 (no or empty `cwd`); PG-256 (no tool name, `allow` on Claude Code because such a call is not a write); PG-163 (`requires: file-symlink`, a fixture that Windows without Developer Mode cannot create, `tests/guards/fixture.ts:87`). The corpora keep their expectations for Claude Code (C002-GOAL-05). The form of a malformed call per mechanism and the expected source recorded in the replay report are in C002-IF-009 §2. A case whose `cwd` is present but differs from the repository root (category `cwd`, for example PG-134) is not in this set: C002-IF-009 §2.2 fixes how its `cwd` is fed, and it keeps its corpus expectation
- **Stories:** C002-US-602
- **Priority:** Must
- **Acceptance:** C002-AC-630.1

### C002-REQ-632 — Unknown `architect:sdd-*` callers expect allow on OpenCode
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE corpus replay suite SHALL use `allow` as the expected decision against the OpenCode permission rules of every identity-category case whose caller is an `architect:sdd-*` name that is none of the ten Architect agents.
- **Rationale:** Q-safety-04 (spec round 4, `../../questions-log.md`): "an unknown architect:sdd-* caller on OpenCode expects allow (the rules bind only the generated agents, C002-REQ-208)"; C002-REQ-626 plays such a caller with the replay fixture's adopter agent; the corpora keep `deny` for Claude Code, whose hooks guard every `architect:sdd-*` name (PG-237 "any architect:sdd-* agent is guarded", `tests/guards/path-corpus.json:2142-2149`; PG-238, `:2150-2157`); on the sdd MCP server and the agent-scoped guard hooks these cases are not applicable (C002-REQ-626)
- **Stories:** C002-US-602
- **Priority:** Must
- **Acceptance:** C002-AC-632.1
