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
- **Statement:** WHEN the corpus replay suite runs, THE corpus replay suite SHALL evaluate every case of the guard corpora against the OpenCode permission rules of the OpenCode target package under native permission enforcement, the sdd MCP server and, under the Copilot hooks fallback, the agent-scoped guard hooks, and report each decision that differs from the case's expected decision.
- **Rationale:** C002-DEC-005; C002-GOAL-02, C002-SC-03; OpenCode's rules are evaluated by OpenCode itself through a headless session or its SDK (ideation §8; C002-R-001 D-01, D-02); the existing tests keep replaying the corpora against the Claude Code hooks (baseline survey §3.2)
- **Stories:** C002-US-602
- **Priority:** Must
- **Acceptance:** C002-AC-606.1

### C002-REQ-607 — Corpus cases for the new risks
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE guard corpora SHALL contain cases for a bare `sdd` command, `node --version`, a `..` segment that leaves `.sdd/`, a symbolic link from `.sdd/` to a folder outside it, output redirection inside an allowlisted command, and a PowerShell command line.
- **Rationale:** ideation §9 (risks); C002-R-001 C-03, C-04; C002-REQ-503
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
- **Statement:** WHERE a script can answer OpenCode's `question` calls, THE OpenCode eval runner SHALL run the interview and gate scenarios with scripted answers.
- **Rationale:** C002-GOAL-03; whether `opencode run` or the SDK can answer a `question` call is open for spike S-07 (ideation §11; C002-R-001 D-01, D-02)
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
- **Rationale:** C002-AS-04 (If wrong); the sdd MCP server is then tested in isolation by the corpus replay suite (C002-REQ-606)
- **Stories:** C002-US-604, C002-US-605
- **Priority:** Must
- **Acceptance:** C002-AC-613.1

### C002-REQ-614 — Checklist content
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE manual VS Code checklist SHALL contain steps for the sdd MCP server boundary, one interview round and one gate through `vscode/askQuestions` including a skipped answer, and one phase of a toy change from its creation to gate G1 on a fresh install.
- **Rationale:** C002-DEC-003; C002-SC-02
- **Stories:** C002-US-605
- **Priority:** Must
- **Acceptance:** C002-AC-614.1

### C002-REQ-615 — Checklist record
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN P-01 completes a run of the manual VS Code checklist, THE repository SHALL contain a checklist record of that run with the date, the VS Code and GitHub Copilot Chat versions, the enforcement mode, the result of each step and P-01's name.
- **Rationale:** DOD-G-01 of the constitution (manual scenario with an executed record); C002-REQ-618
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
- **Statement:** WHEN a generated target is proposed for release, THE release check SHALL refuse the release unless that target's corpus replay reports no differing decision and its injection evals show no instruction acted upon.
- **Rationale:** C002-DEC-005; C002-CON-03; thresholds C002-NFR-201, C002-NFR-202, C002-NFR-203
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
- **Rationale:** C002-DEC-005 (round 4, Q-guards-03: "Defer Copilot (Recommended)"); C002-AS-03
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
- **Statement:** THE plugin SHALL pass every test and eval of the regression set, with the corpus cases and deny-message texts changed by C002-REQ-503 as the only changed expectations.
- **Rationale:** C002-GOAL-05, C002-SC-05; guard tests that pin today's behaviour (current-state §2 item 6); 23 test files pin the Claude format (baseline survey §3.2); the regression set is written in the plan (`20-plan/30-impact/regression-set.md`)
- **Stories:** C002-US-607
- **Priority:** Must
- **Acceptance:** C002-AC-623.1
