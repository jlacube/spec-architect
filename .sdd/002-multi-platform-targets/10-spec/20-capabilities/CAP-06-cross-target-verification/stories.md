---
id: C002-CAP-06
artifact: spec/stories
change: CHG-002
phase: 10-spec
status: draft
capability: "Cross-target verification"
id_block: { US: 601-699, REQ: 601-699, TS: 601-699 }
---
# C002-CAP-06 — Cross-target verification: user stories

### C002-US-601 — Structure checks on every target package
- **As a** P-01 spec owner and maintainer
- **I want** `npm run check` to run structure checks on each generated target package, next to the 14 existing checks of the Claude Code plugin
- **So that** a broken or leaking target package fails the local check before it is released
- **Value / outcome:** C002-SC-04, C002-SC-05; C002-GOAL-01
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-06
- **Context & notes:** `npm run check` is C001-REQ-1117 (a `MODIFIED` candidate). Today every check reads only `plugins/architect/` and `check.mjs` has no step for generated outputs (current-state E-8; baseline survey §2.1). Per-target checks cover at least the package layout, agent tool lists, MCP configuration, the skill budgets on generated bodies (C002-US-103), the absence of untranslated Claude constructs (C002-US-102), and on Copilot VS Code the absence of edit and terminal tools in agents (C002-US-302). New checks must not read CHG-001 folders by fixed path, the hazard PLG-TOOLS-001 has when CHG-001 is archived (baseline survey §4 note 7).
- **Requirements:** C002-REQ-110, C002-REQ-601, C002-REQ-602, C002-REQ-603, C002-REQ-604, C002-REQ-605
- **Traces to:** C002-DEC-006 (Consequences); ideation §5, §8 (Verification)

### C002-US-602 — Guard corpora replayed against each enforcement mechanism
- **As a** P-01 spec owner
- **I want** the path and shell corpora replayed against the OpenCode permission engine, the sdd MCP server and, when used, the Copilot guard hooks, with every decision equal to the expected one
- **So that** I can show the same boundary on every target with the same cases
- **Value / outcome:** C002-GOAL-02; C002-SC-03
- **Priority:** Must · **Size hint:** L · **Capability:** C002-CAP-06
- **Context & notes:** Corpora: 256 path cases and 277 shell cases today (baseline survey E-24), replayed against the Claude Code hooks by the existing tests. New cases: bare `sdd` and `node --version` (C002-US-502), `..` through `.sdd/`, links, redirection inside an allowed command, commands that write files, and the Windows shell (ideation §9). Expectations per mechanism (Q-safety-02, spec round 2): memory cases expect deny on the generated targets (C002-DEC-009); identity cases run only where a non-Architect caller exists (OpenCode) and are listed as not applicable elsewhere. Expectations for hook inputs the generated mechanisms lack (Q-safety-04, spec round 4): a case without a `cwd` or a tool name expects deny, sent as a malformed call; an unknown `architect:sdd-*` caller expects allow on OpenCode. A case that requires a host capability (PG-163, file symbolic link) is replayed with its own input on a replay host that has the capability (Q-safety-05, spec round 5). Every other case keeps its corpus expectation. The OpenCode replay runs through a headless OpenCode session or its SDK (ideation §8). Constitution NFR default: 0 false allows on the path corpus.
- **Requirements:** C002-REQ-606, C002-REQ-607, C002-REQ-625, C002-REQ-626, C002-REQ-627, C002-REQ-630, C002-REQ-632, C002-REQ-633
- **Traces to:** C002-DEC-005; ideation §8, §9; Q-safety-02, Q-guards-04, Q-safety-04, Q-guards-05, Q-safety-05

### C002-US-603 — Scripted evals on OpenCode
- **As a** P-01 spec owner
- **I want** an OpenCode eval runner that keeps the case API of the existing eval harness and runs agent routing, injection and, where OpenCode allows scripted answers, interview, gate and revise scenarios
- **So that** agent behaviour on OpenCode is measured the same way as on Claude Code
- **Value / outcome:** C002-GOAL-02, C002-GOAL-03
- **Priority:** Must · **Size hint:** L · **Capability:** C002-CAP-06
- **Context & notes:** The harness has no CHG-001 requirement of its own, so runners are `ADDED` (current-state §2 item 2, E-9); 104 files under `evals/` use `harness/`, so the case API stays stable (baseline survey §3.3). OpenCode can be driven through `opencode serve` and the SDK (C002-R-001 D-01, D-02); whether a `question` call can be answered by script is open for spike S-07. Eval tiers: dev tier on every target; milestone tier on Claude Code and the first port only (ideation §9). Each run keeps a spend cap, as `runSession` does today (current-state E-9).
- **Requirements:** C002-REQ-608, C002-REQ-609, C002-REQ-610, C002-REQ-611
- **Traces to:** ideation §8 (Verification), §9; C002-DEC-003 (Consequences)

### C002-US-604 — Scripted evals through Copilot CLI
- **As a** P-01 spec owner
- **I want** a Copilot CLI eval runner that runs agent routing, guard behaviour through the sdd MCP server and non-interactive scenarios against the Copilot target package
- **So that** the Copilot target is tested by script although VS Code has no headless chat mode
- **Value / outcome:** C002-GOAL-02, C002-GOAL-03
- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-06
- **Context & notes:** C002-DEC-003. Copilot CLI runs headless with `-p`, `--agent` and JSON output; unattended runs use `--no-ask-user`, so interviews and gates are not exercised here (C002-R-001 D-03). C002-AS-04 is settled for Copilot CLI 1.0.98: it loads the package with `--plugin-dir`, confines subagents, and names agents `<plugin>:<agent>` (`docs/spikes/S-08-copilot-vscode.md §2`, fact F-6); a hook deny shows there as a fail-closed hook error, not through exit code 2 (§2.2). If a later Copilot CLI version does not load the package, the server is tested in isolation and the Copilot injection cases move to the manual checklist (C002-US-605). Copilot CLI is an eval tool only (C002-NG-01).
- **Out of scope:** VS Code automation through an extension host or UI automation (not documented, C002-R-001 D-04).
- **Requirements:** C002-REQ-611, C002-REQ-612, C002-REQ-613
- **Traces to:** C002-DEC-003; Q-eval-01

### C002-US-605 — Recorded manual VS Code checklist
- **As a** P-01 spec owner
- **I want** a manual checklist for VS Code that I run and record before each release: the sdd MCP server boundary, an interview and a gate through `ask_user` (including a skipped answer), one phase end to end on a toy change up to gate G1, and the revise scenarios on that toy change
- **So that** what cannot be scripted in VS Code is still verified, with evidence
- **Value / outcome:** C002-SC-02; C002-GOAL-02, C002-GOAL-03
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-06
- **Context & notes:** C002-DEC-003 (the release check requires the manual record for the Copilot target). DOD-G-01 of the constitution accepts a manual scenario with an executed record. With the Copilot hooks fallback, the checklist also records the hooks state (C002-US-303) and holds the Copilot injection cases run in VS Code with hooks enabled, because Copilot CLI results do not prove the VS Code hooks (C002-DEC-005 exception). Re-run before each release because the VS Code features used are Preview or Experimental (ideation §9).
- **Requirements:** C002-REQ-613, C002-REQ-614, C002-REQ-615, C002-REQ-616, C002-REQ-618, C002-REQ-628
- **Traces to:** C002-DEC-003, C002-DEC-005 (Consequences); Q-eval-01

### C002-US-606 — A target is released only with a proven boundary
- **As a** P-01 spec owner
- **I want** the release of each generated target to require its corpus replay at 100%, its injection evals at 0 instructions acted upon and, for Copilot VS Code, the manual checklist record, with the Copilot hooks fallback flagged when used
- **So that** no target is released below the Claude Code safety bar; if the Copilot fallback fails too, Copilot is deferred and OpenCode is still released
- **Value / outcome:** C002-GOAL-02; C002-SC-03
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-06
- **Context & notes:** C002-DEC-005 and C002-CON-03. Deferral: if a spike S-08 record shows subagents not confined and Copilot guard hooks not blocking a subagent's tool calls, the Copilot target is deferred to a later change (Q-guards-03), and P-01 revises this spec to remove it (`../../10-context/scope.md` §1.1, Q-defer-01). Injection evals run at the dev tier on each target (C002-GOAL-02); under the Copilot hooks fallback the release needs evidence taken in VS Code with hooks enabled. A corpus replay counts for a release only when its replay host has every host capability the corpora's cases require (Q-safety-05).
- **Requirements:** C002-REQ-617, C002-REQ-618, C002-REQ-619, C002-REQ-620, C002-REQ-621, C002-REQ-622, C002-REQ-629, C002-REQ-634
- **Traces to:** C002-DEC-005; Q-safety-01, Q-guards-02, Q-guards-03, Q-defer-01, Q-safety-05

### C002-US-607 — Claude Code unchanged
- **As a** P-03 adopter on Claude Code
- **I want** every CHG-001 test and eval that passes today to still pass after CHG-002
- **So that** adding targets costs me nothing
- **Value / outcome:** C002-GOAL-05; C002-SC-05
- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-06
- **Context & notes:** The only accepted differences are the two allowlist changes of C002-US-502 (bare `sdd` and `node --version`; Serena commands confined to a data folder outside the repository, Q-guards-04). Guard tests pinning today's behaviour: the guard corpora and the C001-CAP-11 integration tests `TS-1103` to `TS-1108` (current-state §2 item 6); 23 test files pin the Claude format (baseline survey §3.2). The regression set is written in the plan (`20-plan/30-impact/regression-set.md`).
- **Requirements:** C002-REQ-113, C002-REQ-623
- **Traces to:** ideation §4.1 (G-5); C002-DEC-007
