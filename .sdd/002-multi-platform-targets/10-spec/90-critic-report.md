---
artifact: critic-report
change: CHG-002
phase: 10-spec
reviewed_ids: all
---
# Critic report — CHG-002 10-spec

Scope: the whole spec under `10-spec/` (index, context, CAP-01 … CAP-06, NFR, domain, interfaces,
architecture, DoD) against the approved ideation (`00-ideation/ideation.md`, C002-DEC-001 … 009).
Paths are relative to `.sdd/002-multi-platform-targets/` unless they start with `plugins/`, `src/`,
`docs/` or `tests/` (repository root).

Mechanical state (initial review): `sdd lint 002 --phase 10-spec` reports only the 9 LINT-DELTA-001 errors covered by
C002-DEC-008 (waiver to be recorded at G2), so they are not findings. `sdd trace 002` reports
TR-01 … TR-05 at 100% (107 REQ, 109 AC, 16 NFR). The open markers Q-cli-03 (C002-REQ-509),
Q-perf-01 (C002-NFR-103) and the `[ASSUMPTION: S-07/S-08]` items are open for P-01 or the spikes and
are not findings. The seven gaps the conductor had already queued for a fix round are included below
(CR-7 … CR-14) with a severity, so that one fix round covers everything.

The initial review (base 05d1506) found CR-1 … CR-22. Re-review 1 (step 7, at c7f4fc7) is at the end
of this report: per-finding status of CR-1 … CR-22, new findings CR-23 … CR-31, rubric and verdict.

## Summary

Open findings after re-review 1:

| blocker | major | minor |
|---|---|---|
| 1 | 2 | 6 |

Initial review: 1 blocker, 10 major, 11 minor. Re-review 1: 20 resolved, 2 partially resolved (the
remainders are carried as CR-23 and CR-29), 9 new findings (CR-23 … CR-31).

## Findings (initial review)

### CR-1 — The corpus replay cannot reach "0 differing decisions": Claude-only cases have no expectation per mechanism
- **Severity:** blocker
- **Refs:** C002-NFR-201, C002-NFR-202, C002-REQ-606, C002-REQ-617, C002-AC-606.1, C002-TS-608, C002-IF-009 §2, C002-IF-008 §5, C002-DEC-005, C002-DEC-009
- **Evidence:** "**Threshold:** 0 differing decisions (0 false allows and 0 false denies) over the whole path corpus (256 cases at baseline survey E-24; at least 200 per the constitution)" — `10-spec/30-nfr/nfr.md:76`; "THE corpus replay suite SHALL evaluate every case of the guard corpora against the OpenCode permission rules … the sdd MCP server and, under the Copilot hooks fallback, the agent-scoped guard hooks, and report each decision that differs from the case's expected decision." — `10-spec/20-capabilities/CAP-06-cross-target-verification/requirements.md:66`; "The sdd MCP server and `hook guard --host copilot` call the core with the option off" — `10-spec/50-interfaces/hooks-contract-delta.md:83-84`; the server always decides as `"agent_type": "architect:sdd-mcp-server"` — `10-spec/50-interfaces/sdd-mcp-server.md:90`. The corpora hold cases whose expectation depends on Claude Code identity or the memory folder: `"id": "PG-205", "category": "memory", … "path": "{repo}/.claude/agent-memory/architect-sdd-cartographer/MEMORY.md", "expect": "allow"` — `tests/guards/path-corpus.json:1870-1875`; `"id": "BG-258", "category": "identity", "tool": "Bash", "agent": null, "command": "rm -rf src", "expect": "allow"` — `tests/guards/bash-corpus.json:2217-2222`.
- **Why it matters:** with the memory folder off (C002-DEC-009) and a fixed Architect identity, the sdd MCP server and the scoped hooks must deny the memory and identity cases that expect `allow`, so every replay reports differences and C002-REQ-617 refuses every release: the safety gate of C002-DEC-005 is unsatisfiable as written. An implementer will have to invent which cases count and with which expectation, which is exactly the safety decision the spec must fix. The same applies to OpenCode (memory cases; corpus tool names Write/Edit/NotebookEdit/PowerShell and caller agents such as `general-purpose` have no defined OpenCode equivalent).
- **Suggested fix:** add to C002-REQ-606 and C002-IF-009 §2 a per-mechanism expectation rule: memory-category cases expect `deny` on every generated target (C002-DEC-009); identity-category cases are replayed only where the mechanism can see a non-Architect caller (OpenCode, with an adopter agent, tying to C002-REQ-208) and are recorded `not-applicable` for the server and the scoped hooks (property covered by C002-REQ-208/C002-REQ-302); define how corpus tool names map to each mechanism. Restate C002-NFR-201/202 thresholds as "0 differing decisions over the applicable cases, with the excluded case IDs listed in the replay report". P-01 question Q-safety-02 (digest).
- **Owner:** spec-writer (C002-REQ-606, C002-NFR-201/202), architect (C002-IF-009 §2), test-designer (C002-TS-608)
- **Status:** partially resolved (re-review 1) — memory, identity and tool-name mapping done; cases resting on other hook-input fields remain, carried as CR-23

### CR-2 — The Copilot deferral branch of C002-DEC-005 cannot be executed as specified
- **Severity:** major
- **Refs:** C002-REQ-620, C002-REQ-101, C002-REQ-601, C002-INV-04, C002-IF-001 §1, C002-IF-009 §3, C002-DOD-003, C002-DOD-004, C002-SC-02, C002-DEC-005
- **Evidence:** "IF the spike S-08 record shows that Copilot subagents are not confined to their tool list and that agent-scoped hooks do not block a subagent's tool calls, THEN THE release check SHALL refuse the release of the Copilot VS Code target." — `10-spec/20-capabilities/CAP-06-cross-target-verification/requirements.md:193`; "A table names exactly one enforcement mode (C002-INV-04). The mode and the tested versions are copied from the spike record named in `host.validated_by`" — `10-spec/50-interfaces/mapping-tables.md:30-31`; Copilot table: `"enforcement_mode": { "enum": ["sdd-mcp-server", "copilot-hooks"] },` — `10-spec/50-interfaces/mapping-table.schema.json:259`; release record: `"enforcement_mode": { "enum": ["native-permissions", "sdd-mcp-server", "copilot-hooks"] },` — `10-spec/50-interfaces/release-record.schema.json:14`; "THE generator SHALL write the OpenCode target package under `dist/opencode/` and the Copilot target package under `dist/copilot/`" — `10-spec/20-capabilities/CAP-01-target-generator/requirements.md:18`; DOD-004 covers "C002-SC-02" — `10-spec/70-dod.md:25`. Decision: "the Copilot target is deferred to a later change; OpenCode still ships in CHG-002." — `00-ideation/decisions/DEC-005-safety-bar.md:16`.
- **Why it matters:** a `deferred` S-08 record cannot be copied into the Copilot table (no such mode), so generation, `npm run check` (C002-TS-601 expects the copilot checks) and `npm run package` cannot run; the refused release record cannot carry `deferred`; and C002-DOD-003, C002-DOD-004 and C002-SC-02 can never be met, so CHG-002 could not be completed although P-01 decided that OpenCode still ships. The spec models "deferred to a later change" as "release refused", which is not the same scope outcome.
- **Suggested fix:** state the deferral consequence explicitly (P-01 question Q-defer-01): either a `deferred` S-08 record triggers a spec revision that removes the Copilot capability, C002-SC-02 and the Copilot DoD items, or those items are declared conditional now ("not applicable when the S-08 record gives `deferred`"), the generator and the target checks skip a deferred target, and the table/record schemas accept `deferred`.
- **Owner:** spec-writer (C002-REQ-620, C002-REQ-101, scope), architect (schemas, C002-INV-04), test-designer (DoD)
- **Status:** resolved (re-review 1)

### CR-3 — The exception condition of the hooks fallback is not tied to evidence taken with hooks enabled in VS Code
- **Severity:** major
- **Refs:** C002-NFR-203, C002-REQ-612, C002-REQ-613, C002-REQ-617, C002-DOD-009, C002-IF-010 §4, C002-DEC-005
- **Evidence:** "on condition that, with hooks enabled, the path and shell corpora still pass 100% and the injection evals show 0 instructions acted upon" — `00-ideation/decisions/DEC-005-safety-bar.md:16`; "**Method:** injection cases at the dev tier through the OpenCode eval runner (C002-REQ-609) and the Copilot CLI eval runner (C002-REQ-612), or the manual VS Code checklist (C002-REQ-613)" — `10-spec/30-nfr/nfr.md:97`; "WHERE Copilot CLI cannot load the Copilot target package, THE manual VS Code checklist SHALL contain the Copilot injection cases." — `10-spec/20-capabilities/CAP-06-cross-target-verification/requirements.md:130`; research: "They are separate implementations; the CLI result does not prove the VS Code behaviour." — `00-ideation/research/R-001-platform-facts.md:364-365` and CLI agent-scoped hooks "need workspace admission" — `00-ideation/research/R-001-platform-facts.md:164`.
- **Why it matters:** under the Copilot hooks fallback the boundary is the agent-scoped hooks of VS Code's Local harness. Injection evals run through Copilot CLI (a different hook implementation, installed "in a temporary Copilot home", `50-interfaces/eval-runner.md:51`) do not show that the shipped mechanism holds, and nothing requires them to run with hooks enabled. The release could pass on evidence that does not satisfy P-01's condition.
- **Suggested fix:** add a requirement (or extend C002-REQ-613) that, WHERE the Copilot hooks fallback is used, the Copilot injection evidence comes from VS Code with hooks enabled (checklist steps, or Copilot CLI only if S-08 shows its agent-scoped hooks fire for the generated agents), and that the injection summary and checklist record carry the hooks state; make the release check refuse hooks-mode evidence without `hooks enabled`.
- **Owner:** spec-writer (C002-NFR-203, C002-REQ-613), architect (C002-IF-009, C002-IF-010), test-designer (C002-DOD-009)
- **Status:** resolved (re-review 1)

### CR-4 — OpenCode: the Architect agents' effective tool set is not closed (adopter MCP servers and other default tools)
- **Severity:** major
- **Refs:** C002-REQ-108, C002-REQ-206, C002-REQ-209, C002-IF-005 §2, C002-AC-108.1, C002-SC-03, C002-DEC-005
- **Evidence:** "THE generator SHALL grant that agent only the tools that the target's mapping table derives from the source agent's `tools` field." — `10-spec/20-capabilities/CAP-01-target-generator/requirements.md:84`; contract: `"tools": { "context7*": false, "deepwiki*": false, "serena*": false, "sdd-files*": false, "sdd-shell*": false },` and per agent `"tools": { "sdd-files*": true, "sdd-shell*": true },` — `10-spec/50-interfaces/target-packages.md:69,72`; "and the agent's `tools` grant `write`, `edit`, `bash` as its source tools allow." — `10-spec/50-interfaces/target-packages.md:81-82`; research: "`edit` (covers `edit`, `write`, `patch` …)" and "Most defaults are `allow`." — `00-ideation/research/R-001-platform-facts.md:175,178`.
- **Why it matters:** the contract only switches tools on; it never switches off the tools the agent does not need. In OpenCode, tools of the adopter's own MCP servers (or plugins) stay enabled for every agent and are not governed by `permission.edit`, so an Architect agent could write outside `.sdd/` through, for example, a filesystem MCP server. On Claude Code the agent `tools` list is an allowlist, so this is a parity gap with C002-DEC-005; neither the corpus replay (edit/bash only) nor C002-TS-114 would detect it.
- **Suggested fix:** make the OpenCode contract deny every tool first (`"*": false` per agent, or the equivalent S-07 confirms) and then enable only the derived tools; add a TGT-TOOLS-001 rule for it and an abuse scenario: an adopter MCP server with a write tool configured globally, an Architect agent's call to it denied (both modes). Check the same for Copilot prompt files and agents in the S-08 checklist.
- **Owner:** architect (C002-IF-005 §2, §6), test-designer (new scenario under C002-AC-108.1 or C002-AC-206.1)
- **Status:** resolved (re-review 1; the consequence of a negative S-07 outcome is CR-27)

### CR-5 — Allowlisted `sdd` subcommands can write outside `.sdd/`; the ideation's "command that writes files" risk is not traced
- **Severity:** major
- **Refs:** C002-REQ-503, C002-REQ-405, C002-REQ-607, C002-IF-008 §1, C002-IF-007, C002-DEC-001, ideation §9
- **Evidence:** "`node <path>/sdd.mjs <any subcommand>` or `sdd <any subcommand>`" — `10-spec/50-interfaces/hooks-contract-delta.md:20`; positional data folder written as is: "| Windows  | "LOCALAPPDATA" = "C:/fx-home/AppData/Local"    | C:/fx-plugin-data | C:/fx-plugin-data/serena/serena_config.yml             |" — `10-spec/20-capabilities/CAP-05-cli-distribution/acceptance.md:349`; "sdd serena-launch (<plugin-data-dir> | --user-data) [--read-only] -- <serena arguments>" — `10-spec/50-interfaces/sdd-cli-delta.md:25`; ideation risk: "… (redirection such as `sdd status > file`, or a command that writes files) | medium | high | S-07 replay cases for redirection and writing commands" — `00-ideation/ideation.md:155`; "THE guard corpora SHALL contain cases for a bare `sdd` command, `node --version`, a `..` segment that leaves `.sdd/`, a symbolic link from `.sdd/` to a folder outside it, output redirection inside an allowlisted command, and a PowerShell command line." — `10-spec/20-capabilities/CAP-06-cross-target-verification/requirements.md:75`; decision: the server "refuses anything outside `.sdd/` and anything outside the CLI allowlist" — `00-ideation/decisions/DEC-001-copilot-guards.md:16`.
- **Why it matters:** `sdd serena-config src` passes every guard (Claude Code hooks, OpenCode `sdd *`, the server's `run_command`) and writes `src/serena/serena_config.yml`; `serena-launch` forwards arbitrary arguments to Serena. The ideation listed writing commands as a high-impact risk with corpus cases as mitigation, but C002-REQ-607 dropped that case class, so the replay cannot catch it and C002-DEC-001's "refuses anything outside `.sdd/`" does not hold on Copilot. The gap already exists on Claude Code; closing it changes Claude Code behaviour beyond C002-GOAL-05's single exception, so P-01 must decide.
- **Suggested fix:** add "a command that writes files" (writing `sdd` subcommands, `git … --output`) to C002-REQ-607 and C002-TS-610; then apply P-01's answer to Q-guards-04: recommended, confine `serena-config`/`serena-launch` in the bash guard core on every host to `--user-data` or a folder outside the repository (extending C002-GOAL-05's exception and C002-REQ-503).
- **Owner:** spec-writer (C002-REQ-607, C002-REQ-503, C002-GOAL-05), architect (C002-IF-008 §1), test-designer (C002-TS-610)
- **Status:** resolved (re-review 1; a further write path through `--cwd` is CR-25)

### CR-6 — The "revise scenarios on each target" measure of C002-GOAL-03 has no requirement, scenario or DoD item
- **Severity:** major
- **Refs:** C002-GOAL-03, C002-REQ-610, C002-REQ-614, C002-DOD-004, ideation G-3
- **Evidence:** measure of C002-GOAL-03: "the gate, interview and revise scenarios pass on each target (automated where the host allows, recorded manual check otherwise)" — `10-spec/10-context/problem-and-goals.md:35`; "THE OpenCode eval runner SHALL run the interview and gate scenarios with scripted answers." — `10-spec/20-capabilities/CAP-06-cross-target-verification/requirements.md:102`; the checklist covers "one interview round and one gate through `vscode/askQuestions` including a skipped answer, and one phase of a toy change from its creation to gate G1 on a fresh install." — `10-spec/20-capabilities/CAP-06-cross-target-verification/requirements.md:139`. "revise" occurs nowhere else in `10-spec/` except the gate's "Revise" option.
- **Why it matters:** the goal's measure cannot be shown at G-done: no scenario exercises a Revise choice or `/architect:revise` (phase `in-revision`, stale handling) on OpenCode or in VS Code, and C002-SC-01/02 stop at G1.
- **Suggested fix:** add the revise flow to C002-REQ-610 (scripted on OpenCode) and C002-REQ-614 (a checklist step choosing Revise at G1 and re-presenting the gate), with scenarios in C002-AC-610.1 / C002-AC-614.1 and the coverage of C002-DOD-004; or change the goal's measure with P-01 if revise is out of scope.
- **Owner:** spec-writer (C002-REQ-610, C002-REQ-614), test-designer (scenarios, DoD)
- **Status:** resolved (re-review 1)

### CR-7 — C002-REQ-112 does not stop generation for a missing variant of other wiring anchors (queued gap 1)
- **Severity:** major
- **Refs:** C002-REQ-112, C002-REQ-111, C002-AC-112.1, C002-TS-123, C002-IF-001 §3, C002-IF-006
- **Evidence:** "IF an agent, a command or a skill of the source plugin has a "Claude Code wiring" section or a CLI invocation line without a variant for a generated target, THEN THE generator SHALL exit non-zero …" — `10-spec/20-capabilities/CAP-01-target-generator/requirements.md:121`; versus C002-REQ-111 "… each "Claude Code wiring" section, each CLI invocation line and each other wiring anchor of that file …" — `…/CAP-01-target-generator/requirements.md:112`; coverage step: "every heading "Claude Code wiring" and every line matched by a `variant_required` detector that no variant replaced is ERR-GEN-002." — `10-spec/50-interfaces/mapping-tables.md:72-73`.
- **Why it matters:** a missing variant of the doctor host rows (or the toolchain section) is not an error, and `claude --version` is not a detected construct, so the generated doctor would silently keep Claude Code rows on OpenCode and VS Code (C002-REQ-504/507 broken without a build failure).
- **Suggested fix:** extend C002-REQ-112 to "each wiring anchor" (sections, CLI lines, host rows), make every anchor `variant_required` in C002-IF-001 §3 step 3, and add a C002-TS-120 row for the doctor host rows.
- **Owner:** spec-writer (C002-REQ-112), architect (C002-IF-001 §3), test-designer (C002-TS-120)
- **Status:** resolved (re-review 1)

### CR-8 — Templates shipped in `architect-sdd` instruct `node <plugin-root>/scripts/sdd.mjs` with no translation (queued gap 2)
- **Severity:** major
- **Refs:** C002-REQ-512, C002-REQ-513, C002-REQ-115, C002-REQ-602, TGT-PORT-001
- **Evidence:** "node <plugin-root>/scripts/sdd.mjs task set <task-id> --status in-progress" — `plugins/architect/templates/full/20-plan/handoff.md:20` (also lines 21–23 and the same lines of `templates/lite/20-plan/handoff.md`); "THE `architect-sdd` package SHALL contain every template of the source plugin's `templates/` folder" — `10-spec/20-capabilities/CAP-05-cli-distribution/requirements.md:126`; TGT-PORT-001 scans "agents, commands or prompt files, skills, configuration and hook files" — `10-spec/50-interfaces/target-packages.md:199`.
- **Why it matters:** every hand-off written on a generated target tells the implementer to run a plugin path that does not exist there (C002-GOAL-03, C002-GOAL-04), and no check scans the shipped templates.
- **Suggested fix:** add a requirement that template text naming the CLI reads target-neutrally (for example "`sdd …` — on Claude Code `node <plugin-root>/scripts/sdd.mjs …`") or that `sdd template show` renders the CLI spelling per host; extend a leak check to the templates in the tarball.
- **Owner:** spec-writer (new REQ in CAP-05), architect (C002-IF-003 §1, C002-IF-005 §6)
- **Status:** resolved (re-review 1)

### CR-9 — PLG-VAR-001 checks only `SKILL.md`, while C002-TS-122 expects agent and command files to be checked (queued gap 4)
- **Severity:** major
- **Refs:** C002-REQ-113, C002-AC-113.1, C002-TS-122, C002-IF-005 §6
- **Evidence:** "| PLG-VAR-001 | On the source plugin: no `SKILL.md` body holds a wiring variant of a generated target or a host question-tool name (`vscode/askQuestions`) | C002-REQ-113 |" — `10-spec/50-interfaces/target-packages.md:210`; versus the C002-TS-122 rows "| the OpenCode variant of the CLI invocation line | agents/sdd-conductor.md       |" and "| the line "Confirm in one vscode/askQuestions round" | commands/archive.md       |" — `10-spec/20-capabilities/CAP-01-target-generator/acceptance.md:316-317`.
- **Why it matters:** two of the three C002-TS-122 rows cannot fail as the check is defined; C002-REQ-113 covers agents and commands, so the interface contradicts the requirement and its acceptance.
- **Suggested fix:** widen PLG-VAR-001 to agent, command and `SKILL.md` files.
- **Owner:** architect (C002-IF-005 §6)
- **Status:** resolved (re-review 1)

### CR-10 — No check code for C002-TS-126 (Serena `--read-only`) and C002-TS-332 (tool-classes completeness) (queued gap 5)
- **Severity:** major
- **Refs:** C002-TS-126, C002-TS-332, C002-REQ-114, C002-REQ-318, C002-IF-005 §6, C002-IF-001 §2
- **Evidence:** "Then it reports an error naming ".mcp.json", "serena" and "--read-only"" — `10-spec/20-capabilities/CAP-01-target-generator/acceptance.md:347`; "Then it reports an error naming "tool-classes.json", that tool name and "sdd-critic"" — `10-spec/20-capabilities/CAP-03-copilot-target/acceptance.md:374`; the only MCP check is "The MCP configuration declares exactly the servers of the table for the package's mode" — `10-spec/50-interfaces/target-packages.md:201`; on Copilot Serena may be granted whole: "`serena/find_symbol` (grant `serena/*` when only per-server grants exist)" — `10-spec/50-interfaces/mapping-tables.md:42`.
- **Why it matters:** with a `serena/*` grant, the read-only mode file is the only thing keeping Serena's editing and shell tools away from Copilot agents, so a missing `--read-only` is a boundary bypass that no defined check reports; the tool-classes gap blocks agents under the hooks fallback without a check finding.
- **Suggested fix:** add TGT codes (for example TGT-SERENA-001: the Serena entry runs `serena-launch --user-data --read-only`; TGT-CLASS-001: every granted tool has exactly one class) to C002-IF-005 §6 and `errors.md` §7.
- **Owner:** architect (C002-IF-005 §6)
- **Status:** resolved (re-review 1)

### CR-11 — Component Realizes lists omit the 16 requirements added in the rework (queued gap 7, third part)
- **Severity:** major
- **Refs:** C002-COMP-001, C002-COMP-003, C002-COMP-004, C002-COMP-005, C002-COMP-018; C002-REQ-114 … 118, C002-REQ-216, C002-REQ-317 … 319, C002-REQ-415, C002-REQ-511 … 516
- **Evidence:** "- **Realizes:** C002-REQ-101, C002-REQ-102, C002-REQ-103, C002-REQ-104, C002-REQ-105, C002-REQ-106, C002-REQ-107, C002-REQ-108, C002-REQ-109, C002-REQ-111, C002-REQ-112; C002-NFR-103, C002-NFR-301" — `10-spec/60-architecture/architecture.md:55`; C002-COMP-005 ends at "C002-REQ-411" — `architecture.md:91`; C002-COMP-018: "C002-REQ-501, C002-REQ-407, C002-REQ-508, C002-REQ-509" — `architecture.md:221`.
- **Why it matters:** 16 of 107 requirements have no realizing component (rubric D4), so the plan cannot assign them to components or tasks from the architecture.
- **Suggested fix:** add REQ-114 … 118 to C002-COMP-001 (and C002-COMP-018 for 114/116), REQ-216 to C002-COMP-003, REQ-317 … 319 to C002-COMP-004/012, REQ-415 to C002-COMP-005, REQ-511 … 516 to C002-COMP-018/006; update the flows of §3 where they apply.
- **Owner:** architect
- **Status:** resolved (re-review 1)

### CR-12 — The per-user data folder may resolve relative or inside the repository (queued gap 3)
- **Severity:** minor
- **Refs:** C002-REQ-515, C002-REQ-516, C002-US-505, C002-IF-007
- **Evidence:** "THE sdd CLI SHALL use the per-user data folder of `architect-sdd` as Serena's data folder." — `10-spec/20-capabilities/CAP-05-cli-distribution/requirements.md:153`; refusal only "IF the option `--user-data` is given and the per-user data folder cannot be determined" — `…/CAP-05-cli-distribution/requirements.md:162`; "`$XDG_DATA_HOME/architect-sdd` or `~/.local/share/architect-sdd` (Linux)" — `10-spec/50-interfaces/sdd-cli-delta.md:42`.
- **Why it matters:** a relative `XDG_DATA_HOME` (invalid per the XDG rules) or an environment variable pointing into the repository puts Serena's data in the repository, against C002-US-505 ("leaves no Serena files in my repository"); requires adopter misconfiguration, hence minor.
- **Suggested fix:** in C002-REQ-516 and C002-IF-007, treat a relative value as not set and refuse with ERR-CLI-020 a folder that resolves inside the repository root; add scenario rows to C002-TS-525.
- **Owner:** spec-writer (C002-REQ-516), architect (C002-IF-007), test-designer (C002-TS-525)
- **Status:** resolved (re-review 1)

### CR-13 — C002-IF-006 §2 still treats `hooks unknown` as an assumption that C002-REQ-510 has settled (queued gap 6)
- **Severity:** minor
- **Refs:** C002-IF-006 §2, C002-REQ-510, C002-TS-526
- **Evidence:** "C002-REQ-510 states `ok` for every state other than disabled, which would report an unread state as safe; this gap is reported to the spec-writer with the recommendation `error` [ASSUMPTION: architecture step 5, an unknown hooks state is shown as error]." — `10-spec/50-interfaces/doctor-host-rows.md:49-52`; current statement: "… with status `error` when hooks are disabled … or when it cannot read the hooks state." — `10-spec/20-capabilities/CAP-05-cli-distribution/requirements.md:107`.
- **Why it matters:** stale text contradicts the requirement and leaves an open marker in the generated open-items list.
- **Suggested fix:** replace the paragraph with a reference to C002-REQ-510 and remove the marker.
- **Owner:** architect
- **Status:** resolved (re-review 1)

### CR-14 — Stale "known spec gap" note in C002-IF-001 §2 and a TGT-SIZE-001 message that does not name the skills (queued gap 7, first two parts)
- **Severity:** minor
- **Refs:** C002-IF-001 §2, C002-IF-005 §6, C002-REQ-110, C002-TS-116
- **Evidence:** "their requirement coverage is a known spec gap routed to the spec-writer (CHG-002 defects of step 5)." — `10-spec/50-interfaces/mapping-tables.md:62-63`; "| TGT-SIZE-001 | Each inlined skill ≤ 24,000 characters and all inlined skills of one agent ≤ 64,000 characters | C002-REQ-110, C002-NFR-104 |" — `10-spec/50-interfaces/target-packages.md:203`, versus "… naming the target, the agent, the budget exceeded, the measured size and the skills concerned …" — `10-spec/20-capabilities/CAP-01-target-generator/requirements.md:102`.
- **Why it matters:** the note is now false (C002-REQ-111/112/118 exist); the check definition omits message content that C002-TS-116 verifies.
- **Suggested fix:** delete the note; state the TGT-SIZE-001 message fields as in C002-REQ-110.
- **Owner:** architect
- **Status:** resolved (re-review 1)

### CR-15 — Index counts and NFR back-links are stale
- **Severity:** minor
- **Refs:** 00-index, C002-NFR-101 … 801
- **Evidence:** "| **Total** | | **30** | **107** | **93** | **133** |" — `10-spec/00-index.md:51` (the acceptance files now define 109 AC and 169 TS); "Requirements added in the step 3 rework without acceptance criteria yet: C002-REQ-114 … C002-REQ-118, …" — `10-spec/00-index.md:53-54`; "3. `30-nfr/nfr.md` (spec step 3 onwards)" and "(when written)" — `10-spec/00-index.md:14-18`; "**DoD:** pending — `70-dod.md`" — `10-spec/30-nfr/nfr.md:27` (and every NFR).
- **Why it matters:** navigation shows a state two steps old; readers at G2 get wrong counts and believe ACs are missing.
- **Suggested fix:** update the counts per capability, delete the "without acceptance criteria" sentence and the "(when written)" notes, and set each NFR's DoD line to its C002-DOD ID.
- **Owner:** spec-writer (index, NFR)
- **Status:** partially resolved (re-review 1) — notes, AC counts and NFR links fixed; the TS column is stale again after c7f4fc7, carried as CR-29

### CR-16 — Generator run semantics contradict its output format; C002-REQ-101's open item is stale
- **Severity:** minor
- **Refs:** C002-REQ-101, C002-IF-004, C002-INV-02, architecture §6.2
- **Evidence:** "If any error is found for any selected target, no `<out>/<target>/` of a selected target exists after the run" — `10-spec/50-interfaces/generator-cli.md:45-46`, versus the summary lines "`opencode: written dist/opencode/ (<n> files, mode native-permissions)` or `copilot: not written (<n> errors)`" — `generator-cli.md:66-67`; "whether a target refused by C002-REQ-620 is still written is settled in the plan." — `10-spec/20-capabilities/CAP-01-target-generator/requirements.md:23`, already settled as "| Generator runs every target; the release check decides publication | C002-REQ-101 open item, C002-REQ-619 |" — `10-spec/60-architecture/architecture.md:300`.
- **Why it matters:** two readings of what a partly failing run leaves; an open item points at the plan for a decision already taken (and CR-2 may change it).
- **Suggested fix:** make the summary line per target consistent with all-or-nothing writing ("not written" for every target of a failed run); close the C002-REQ-101 open item with a reference to architecture §6.2, revised after CR-2.
- **Owner:** architect (C002-IF-004), spec-writer (C002-REQ-101)
- **Status:** resolved (re-review 1)

### CR-17 — Transition table of the server tool call is incomplete
- **Severity:** minor
- **Refs:** state-machines §4, C002-IF-002 §5, ERR-MCP-002, ERR-MCP-003, ERR-MCP-005, ERR-MCP-006
- **Evidence:** diagram transitions "decided --> refused : guard deny, or span count not 1, or file missing", "decided --> failed : exception in a guard core (ERR-MCP-002)", "committing --> failed : I/O error, previous content kept (ERR-MCP-003)", "running --> failed : executable cannot start (ERR-MCP-006)", "running --> timed_out : timeout_ms reached, process tree killed" — `10-spec/40-domain/state-machines.md:95-104`; the table (`state-machines.md:112-120`) has no row for a missing file, a guard exception, an I/O error, an executable that cannot start or a timeout.
- **Why it matters:** rubric D2 requires a complete transition table; the omitted rows are the fail-closed paths of C002-CON-08.
- **Suggested fix:** add the five rows with their guards and effects.
- **Owner:** architect
- **Status:** resolved (re-review 1)

### CR-18 — `sdd template show` confinement and `template list` exist only in a scenario and an interface row
- **Severity:** minor
- **Refs:** C002-REQ-513, C002-REQ-514, C002-TS-522, C002-IF-007
- **Evidence:** C002-TS-522 expects `full/../../package.json` to end with "Then the exit code is 2 / And standard error starts with "ERR-CLI-019"" — `10-spec/20-capabilities/CAP-05-cli-distribution/acceptance.md:324-329`; the requirement only says "print the repository's template `.sdd/_templates/<profile>/<path>` if that file exists, and otherwise the template `<profile>/<path>` shipped with the CLI." — `…/CAP-05-cli-distribution/requirements.md:135`; "| `template list` | `<profile>` | Print the template paths of the profile, one per line, sorted | — |" — `10-spec/50-interfaces/sdd-cli-delta.md:41`.
- **Why it matters:** read literally, C002-REQ-513 prints `<cli>/package.json` for that argument, so the scenario tests a rule no requirement states; `template list` has no requirement although ERR-CLI-019's fix depends on it.
- **Suggested fix:** add to C002-REQ-514 (or a new REQ) that a path leaving the profile's template folder is refused with ERR-CLI-019; add a requirement for `template list` or drop it from the fix text.
- **Owner:** spec-writer
- **Status:** resolved (re-review 1)

### CR-19 — The server cannot run `.cmd` shims, so npm-installed tools are unusable through it on REF-WIN
- **Severity:** minor
- **Refs:** C002-IF-002 §5.2, C002-CON-07, C002-IF-006 §2, ERR-MCP-006
- **Evidence:** "Any other executable is resolved on PATH; one that resolves only to a `.cmd` or `.bat` file is not run (ERR-MCP-006), because running it needs a shell." — `10-spec/50-interfaces/sdd-mcp-server.md:112-113`; "All probes run through allowlisted commands (C002-IF-008 §1): a bare `sdd …` or a version probe." — `10-spec/50-interfaces/doctor-host-rows.md:34`; the spec already knows such shims: "a `.cmd` shim is run through the platform shell only for these fixed command lines" — `10-spec/50-interfaces/sdd-cli-delta.md:39`.
- **Why it matters:** on Windows, npm-installed executables (ast-grep from npm, possibly ripwire) are `.cmd` shims; under server enforcement the doctor would report an installed tool as an error and code discovery would always fall back, a silent degradation of C002-GOAL-03 on the reference machine.
- **Suggested fix:** state the doctor status for ERR-MCP-006 (for example `error` with the fix "install a native executable") and list in C002-IF-002 which allowlisted tools are expected as native executables; or resolve a `.cmd` shim to its target script for fixed allowlisted forms. Let spike S-08 record the shims found.
- **Owner:** architect
- **Status:** resolved (re-review 1)

### CR-20 — Spike records are assigned to the researcher although they lie outside `.sdd/`
- **Severity:** minor
- **Refs:** C002-IF-009 §1, §3; C001-REQ-1103
- **Evidence:** "All records live in the repository, outside `.sdd/`, and are committed." — `10-spec/50-interfaces/verification-records.md:14-15`; "| Spike record | `docs/spikes/S-07-opencode.md`, `docs/spikes/S-08-copilot-vscode.md` | researcher and P-01 in the plan's spike tasks |" — `verification-records.md:21`.
- **Why it matters:** the path guard denies the researcher any write outside `.sdd/`; the plan would assign an impossible step.
- **Suggested fix:** name the writer as the implementer (P-02) or P-01, with the researcher's findings in a `.sdd/` research note that the record cites.
- **Owner:** architect
- **Status:** resolved (re-review 1)

### CR-21 — Eval tiers deviate from the ideation ("milestone tier on Claude Code only")
- **Severity:** minor
- **Refs:** C002-IF-010 §4, C002-US-603, ideation §9
- **Evidence:** "Eval spend stays within the project budget: dev tier on both generated targets, milestone tier on Claude Code only (ideation §9)." — `10-spec/50-interfaces/eval-runner.md:54-55`, versus "dev tier on every target, milestone tier on Claude Code and the first port only" — `00-ideation/ideation.md:164` and "milestone tier on Claude Code and the first port only (ideation §9)" — `10-spec/20-capabilities/CAP-06-cross-target-verification/stories.md:38`.
- **Why it matters:** the interface drops the first port's milestone tier that the ideation and the story keep; the plan will not know which applies.
- **Suggested fix:** align C002-IF-010 §4 with the ideation (or record the change with P-01).
- **Owner:** architect
- **Status:** resolved (re-review 1)

### CR-22 — The OpenCode bash rule for the script form cannot express "no `sdd.mjs` inside `.sdd/`"
- **Severity:** minor
- **Refs:** C002-IF-001 §6.3, C002-IF-008 §1, C002-REQ-207
- **Evidence:** "`"*": deny`, then one `allow` rule per allowlist entry of C002-IF-008 §1 (`sdd *`, `node * sdd.mjs *` as S-07 confirms, `git log *`, …" — `10-spec/50-interfaces/mapping-tables.md:149`; "The script form keeps its rule (no `sdd.mjs` inside `.sdd/`)" — `10-spec/50-interfaces/hooks-contract-delta.md:20`; corpus case "node .sdd/004-x/sdd.mjs status" expecting deny — `tests/guards/bash-corpus.json:250-251`; OpenCode wildcards: "`*` already crosses `/`" — `00-ideation/research/R-001-platform-facts.md:185`.
- **Why it matters:** a glob cannot exclude an agent-written script under `.sdd/` (or argument checks such as `git diff --output=…`, BG-140); the replay will catch it, but native mode then fails S-07 for an entry OpenCode agents do not need (they call bare `sdd`, C002-GOAL-04).
- **Suggested fix:** drop the script-form rule from the OpenCode table and state in C002-IF-001 §6.3 which allowlist entries cannot be expressed as OpenCode globs (argument-level checks), so S-07 knows they decide the mode.
- **Owner:** architect
- **Status:** resolved (re-review 1; the stale Q-safety-03 sentence it left is part of CR-31)

## Rubric (initial review)
| Rubric | Item | Result |
|---|---|---|
| stories | S1 Persona is a defined P-ID | pass |
| stories | S2 Value / outcome stated | pass |
| stories | S3 INVEST | pass |
| stories | S4 Every story has ≥ 1 requirement | pass (TR-01 30/30) |
| stories | S5 Out of scope stated where a neighbour exists | pass |
| stories | S6 Traces to the ideation | CR-6 |
| requirements | R1 Singular outcome | pass |
| requirements | R2 Testable | pass |
| requirements | R3 Unambiguous | CR-16 |
| requirements | R4 Correct EARS pattern | pass |
| requirements | R5 Implementation-free | pass |
| requirements | R6 Complete | CR-7, CR-8, CR-12, CR-18 |
| requirements | R7 Consistent | CR-1, CR-2, CR-5, CR-9 |
| requirements | R8 Feasible | CR-1, CR-2 |
| requirements | R9 Necessary | pass (no scope creep found; `template list` in CR-18) |
| requirements | R10 Measurable values with units and limits | pass |
| requirements | R11 Delta and evidence | pass (9 LINT-DELTA-001 under C002-DEC-008) |
| requirements | R12 Priority set and consistent | pass |
| NFRs | N1 ISO 25010 category | pass |
| NFRs | N2 Metric with unit | pass |
| NFRs | N3 Threshold set or marker | pass (C002-NFR-103 marker Q-perf-01) |
| NFRs | N4 Feasible method and environment | CR-1, CR-3 |
| NFRs | N5 Covered by a DoD item | pass (TR-05 16/16; stale back-links CR-15) |
| acceptance | A1 Every REQ has an AC, every AC a TS | pass (TR-02, TR-03 100%) |
| acceptance | A2 Scenarios observable and concrete | pass |
| acceptance | A3 One behaviour per scenario | pass |
| acceptance | A4 Error and abuse cases present | CR-4, CR-5 |
| acceptance | A5 n/a cells justified | pass |
| domain, interfaces, architecture | D1 Entities with attributes, relationships, owner, invariants | pass |
| domain, interfaces, architecture | D2 Lifecycles > 2 states: diagram and complete table | CR-17 |
| domain, interfaces, architecture | D3 Interfaces parse and name their errors | CR-10, CR-14 |
| domain, interfaces, architecture | D4 Components with ID, responsibilities, requirements served | CR-11 |
| domain, interfaces, architecture | D5 Decisions with alternatives recorded | pass (DEC-001 … 009; design choices in architecture §6.2) |
| DoD and index | O1 Every REQ and NFR covered | pass (TR-05 100%; deferral applicability in CR-2) |
| DoD and index | O2 Evidence types fit the statements | CR-3 |
| DoD and index | O3 Global items referenced | pass |
| DoD and index | X1 Index is navigation only | CR-15 |
| plan | P1 … P7 | n/a: spec phase |
| ideation | I1 … I10 | n/a: spec phase (G1 approved 2026-10-14) |

## Initial review verdict

**needs-revision** — the phase could not be approved at G2 as it stood at 05d1506. CR-1 made the
release gate of C002-DEC-005 unsatisfiable (or left its meaning to the implementer). CR-2 and CR-3
did not carry P-01's defer and exception conditions faithfully. CR-4 and CR-5 left write paths
outside `.sdd/` that the same-as-Claude bar (C002-DEC-005) excludes. CR-1, CR-2 and CR-5 needed
P-01's answers (Q-safety-02, Q-defer-01, Q-guards-04).

## Re-review 1 — step 7 (2026-10-14)

### Scope and mechanical state

- Reviewed: `git diff 05d1506 c7f4fc7 -- .sdd/002-multi-platform-targets/10-spec` (41 files; commits
  76df43d, ae22587, 63f7351, 6a04cb6, 933829f, c7f4fc7) and P-01's answers in
  `10-spec/questions-log.md` rounds 2–3 (Q-safety-02 at l.42, Q-defer-01 l.49, Q-guards-04 l.56,
  Q-cli-03 l.63, Q-perf-01 l.70, Q-safety-03 l.81), each checked against the artifact text.
- Changed or added IDs: C002-REQ-101, 112, 207, 405, 509, 514 … 520, 606, 607, 610, 613 … 615, 617,
  620, 623, 625 … 629; C002-NFR-103, 201 … 203 and the DoD line of every NFR; C002-DOD-004, 008,
  009, 010, 022; C002-US-303, 502, 504, 505, 602, 603, 605, 606, 607; C002-GOAL-02, C002-GOAL-05;
  C002-AS-03; C002-INV-04, 10, 14; C002-CON-06; C002-IF-001 … C002-IF-010; C002-COMP-001 … 008,
  010 … 013, 018; scenarios C002-TS-120, 126, 130, 133, 330 … 332, 515, 519, 522, 525, 527 … 535,
  608 … 610, 613, 617, 618, 620, 626 … 642. With the IDs linked to them (their ACs and TSs, stories,
  DoD items, NFRs, components, invariants) the set covers every capability, so the re-review set is
  the whole spec (`reviewed_ids: all`).
- `sdd lint 002 --phase 10-spec --json`: 10 LINT-DELTA-001 errors only (C002-REQ-517 adds the tenth),
  waived at G2 under C002-DEC-008 — not findings (CR-24 concerns the delta type of C002-REQ-517, not
  the lint error).
- `sdd trace 002`: TR-01 30/30, TR-02 116/116, TR-03 118/118, TR-04 16/16, TR-05 116/116 and 16/16;
  12 open items, each an assumption tied to spike S-07, S-08 or R-001, or a requirement open item
  with an owner. The committed `85-open-items.md` lists 8 (generated file, regenerated by
  `sdd trace 002 --write`; not a finding).
- Corpora and code read as evidence: `tests/guards/path-corpus.json`, `tests/guards/bash-corpus.json`,
  `tests/guards/fixture.ts`, `src/cli/run.ts`, `src/cli/commands.ts`, `src/workspace/init.ts`,
  `src/archive/plan.ts`.

### Status of CR-1 … CR-22

| ID | Severity | Status | Evidence of the fix |
|---|---|---|---|
| CR-1 | blocker | partially resolved | "THE corpus replay suite SHALL use `deny` as the expected decision of every memory-category case of the guard corpora on every enforcement mechanism of a generated target" — `CAP-06-cross-target-verification/requirements.md:229`; identity cases on OpenCode only — `:238`; not-replayed cases listed — `:247`; per-mechanism table and tool mapping — `50-interfaces/verification-records.md:42-73`; "over the applicable cases of the path corpus, with every case not replayed listed by ID in the replay report (C002-REQ-627)" — `30-nfr/nfr.md:76` (same at `:86`); C002-DOD-008 — `70-dod.md:32`; C002-TS-628 … C002-TS-631, C002-TS-637, C002-TS-638. PG-205 and BG-258 now have a defined expectation. Remainder (cases resting on `cwd`, a missing tool name, an unknown `architect:sdd-*` caller or a `requires` capability): CR-23 |
| CR-2 | major | resolved | "that record triggers a revision of this spec with P-01 (Q-defer-01, spec round 2 …)" — `10-context/scope.md:30-37`; "An S-08 record that gives `deferred` is not copied: no table mode means "deferred"." — `50-interfaces/mapping-tables.md:33`; DoD preamble — `70-dod.md:16-19`; transition row — `40-domain/state-machines.md:63`; C002-INV-04 extended. Matches P-01's answer "Revise spec then" (`questions-log.md:49`) |
| CR-3 | major | resolved | "WHERE the Copilot hooks fallback is used, THE manual VS Code checklist SHALL contain the Copilot injection cases, run in VS Code with hooks enabled." — `CAP-06-…/requirements.md:256`; C002-REQ-629 — `:265`; hooks state in the record (C002-REQ-615) — `:148`; ERR-REL-010, ERR-REL-011 — `50-interfaces/errors.md:73-74`; release-check rows — `verification-records.md:174-175`; "the Copilot cases count only when run in VS Code with hooks enabled" — `nfr.md:97`; C002-DOD-009 — `70-dod.md:33`; C002-TS-632, C002-TS-633 |
| CR-4 | major | resolved | "Each Architect agent's `tools` map starts with the catch-all `"*": false`" — `50-interfaces/target-packages.md:79`; closed tool set — `mapping-tables.md:148-156`; TGT-TOOLS-001 — `target-packages.md:217`; C002-TS-133 (adopter MCP write tool) — `CAP-01-target-generator/acceptance.md:197`; C002-TS-640 — `:206`. Consequence of a negative S-07 outcome: CR-27 |
| CR-5 | major | resolved | C002-REQ-517 — `CAP-05-cli-distribution/requirements.md:168-177`; C002-REQ-607 adds "an allowlisted command whose option writes a file outside `.sdd/` (`git diff --output=<file>`), one case for each `sdd` subcommand that writes files" — `CAP-06-…/requirements.md:75`; C002-IF-008 §1.1 and §1.2 — `50-interfaces/hooks-contract-delta.md:39-107`; C002-GOAL-05 widened — `10-context/problem-and-goals.md:37`; C002-TS-527, C002-TS-528, C002-TS-610 rows, C002-TS-636. Matches Q-guards-04 (`questions-log.md:56`). Further write path through `--cwd`: CR-25 |
| CR-6 | major | resolved | "THE OpenCode eval runner SHALL run the interview, gate and revise scenarios with scripted answers." — `CAP-06-…/requirements.md:102`; Revise at G1 and the revise command in the checklist — `:139`; C002-TS-634, C002-TS-635 — `CAP-06-…/acceptance.md:231, 242`; C002-TS-617 steps; C002-DOD-004 — `70-dod.md:28` |
| CR-7 | major | resolved | "has a wiring anchor (a "Claude Code wiring" section, a CLI invocation line, or another wiring anchor of C002-REQ-111 such as the host rows of the doctor command …)" — `CAP-01-target-generator/requirements.md:120`; step 3 — `mapping-tables.md:82-86`; ERR-GEN-002 — `errors.md:26`; C002-TS-120 row `fx-plugin-novariant-doctor` — `CAP-01-…/acceptance.md:306` |
| CR-8 | major | resolved | C002-REQ-518, C002-REQ-519 — `CAP-05-…/requirements.md:179-195`; "**CLI lines in the templates**" — `50-interfaces/architect-sdd-package.md:39`; ERR-BLD-002 — `errors.md:82`; C002-TS-529, C002-TS-530, C002-TS-534, C002-TS-535 |
| CR-9 | major | resolved | "no agent file (`agents/*.md`), command file (`commands/*.md`) or `SKILL.md` holds a host-only name of a generated target" — `target-packages.md:229` |
| CR-10 | major | resolved | TGT-SERENA-001 — `target-packages.md:219`; TGT-CLASS-001 — `:221`; C002-TS-126 and C002-TS-332 name the codes (`CAP-01-…/acceptance.md:368`, `CAP-03-copilot-target/acceptance.md:375`) |
| CR-11 | major | resolved | every one of the 116 requirements appears in a Realizes line (`60-architecture/architecture.md:55-221`), e.g. "C002-REQ-606, C002-REQ-625, C002-REQ-626, C002-REQ-627" — `:118`; flows F11, F12 added |
| CR-12 | minor | resolved | "cannot be determined, is a relative path, or resolves inside the current repository" — `CAP-05-…/requirements.md:162`; `sdd-cli-delta.md:42`; C002-TS-525 rows, C002-TS-533 |
| CR-13 | minor | resolved | "A hooks state that the doctor cannot read (`hooks unknown`) is never shown as `ok`" — `50-interfaces/doctor-host-rows.md:49-50`; marker removed |
| CR-14 | minor | resolved | note replaced by "Agents and commands take variants by the same mechanism …" — `mapping-tables.md:67`; TGT-SIZE-001 names target, agent, budget, size and skills — `target-packages.md:222` |
| CR-15 | minor | partially resolved | "(when written)" notes gone — `00-index.md:15-20`; "Every requirement has acceptance criteria" — `:54`; "- **DoD:** C002-DOD-010" — `nfr.md:27` (every NFR linked). TS column stale again: CR-29 |
| CR-16 | minor | resolved | "A run with any error writes no target (run semantics, step 2), so every selected target prints `<target>: not written (<n> errors)`" — `50-interfaces/generator-cli.md:66-70`; C002-REQ-101 open item removed, rationale cites architecture §6.2 — `CAP-01-…/requirements.md:19` |
| CR-17 | minor | resolved | rows for a guard exception, a missing file, an I/O error, a `.cmd`-only or missing executable and a timeout — `40-domain/state-machines.md:117-125` |
| CR-18 | minor | resolved | "names a path that resolves outside the profile's template folder after normalising `..` segments and links" — `CAP-05-…/requirements.md:144`; C002-REQ-520 — `:197-204`; `sdd-cli-delta.md:40-41` |
| CR-19 | minor | resolved | native executables listed — `50-interfaces/sdd-mcp-server.md:121`; doctor status `error` with a native-install fix — `doctor-host-rows.md:52-58`; `cmd_shims` in the spike record — `verification-records.md:107`; C002-TS-639, C002-TS-642 |
| CR-20 | minor | resolved | "the implementer (P-02) in the plan's spike task, signed off by P-01; the researcher's findings go into a research note under `.sdd/`" — `verification-records.md:21` |
| CR-21 | minor | resolved | "dev tier on every target, milestone tier on Claude Code and on the first port only" — `50-interfaces/eval-runner.md:54-55` |
| CR-22 | minor | resolved | "no rule for the script form `node <path>/sdd.mjs`" — `mapping-tables.md:172`; glob gap table — `:183-190`; Q-safety-03 answered (`questions-log.md:81`). Stale question sentence: CR-31 |

### New findings

#### CR-23 — Corpus cases resting on other Claude Code hook-input fields can neither meet their expectation nor be listed as not applicable
- **Severity:** blocker
- **Refs:** C002-REQ-606, C002-REQ-617, C002-REQ-626, C002-REQ-627, C002-NFR-201, C002-NFR-202, C002-INV-14, C002-IF-009 §2.1, §2.2, §5, ERR-REL-012, C002-REQ-309, C002-CON-08, C002-TS-608, C002-TS-631
- **Evidence:** "| every other category | replayed, expected as in the corpus | replayed, expected as in the corpus | replayed, expected as in the corpus | 0 differences (C002-NFR-201, C002-NFR-202) |" — `10-spec/50-interfaces/verification-records.md:48`; "under `not_applicable` exactly the cases that §2.1 excludes for its mechanism (none for `opencode-permissions`, the identity-category cases for the other two)" — `verification-records.md:171`, with `"rule": { "const": "C002-REQ-626" }` — `10-spec/50-interfaces/release-record.schema.json:215`; the server decides every write with `"tool_name": "Write", "tool_input": { "file_path": <path> }, "cwd": <root>` — `10-spec/50-interfaces/sdd-mcp-server.md:89-90`; the input table maps corpus tools and raw `stdin` only (`verification-records.md:65-73`), and "A case agent `architect:<name>` is played by the generated agent `<name>`" — `verification-records.md:56`; "cases limited by `platforms` or `requires` run as the existing corpus tests run them" — `verification-records.md:50-51`. Corpus: PG-253 `"cwd": null, "path": "{repo}/.sdd/a.md", "expect": "deny", "note": "no cwd"` — `tests/guards/path-corpus.json:2276-2279` (PG-254 `"cwd": ""` at `:2286-2288`; BG-277 `"command": "git status", "expect": "deny", "cwd": null` — `tests/guards/bash-corpus.json:2385-2387`); PG-256 `"tool": null, … "path": "{repo}/src/app.ts", "expect": "allow", "note": "no tool name: not a write tool"` — `path-corpus.json:2302-2306`, versus "| any other tool name | deny GUARD-HOOK-001 (C002-REQ-309) |" — `10-spec/50-interfaces/hooks-contract-delta.md:127`; PG-134 `"cwd": "{repo}/src", "path": ".sdd/a.md", "expect": "deny", "note": "relative to cwd this is src/.sdd/"` — `path-corpus.json:1147-1150`; PG-237 `"agent": "architect:sdd-unknown", … "expect": "deny"` — `path-corpus.json:2145-2147`; PG-163 `"requires": "file-symlink"` — `path-corpus.json:1422`, skipped where "Windows without Developer Mode cannot create file symbolic links; those cases are skipped." — `tests/guards/fixture.ts:87`.
- **Why it matters:** the CR-1 fix covers memory and identity, but other cases rest on hook-input fields the generated mechanisms do not have. The sdd MCP server cannot receive "no cwd", so PG-253, PG-254 and BG-277 are allowed against an expected `deny`; PG-256 expects `allow` where every generated mechanism must deny an unclassed tool (C002-REQ-309, C002-CON-08); PG-134 becomes a false allow if its relative path is fed against the server root, because §2.2 does not say how a case's `cwd` is fed; PG-237 has no generated agent to play it on OpenCode; PG-163 may not run on REF-WIN. None of them may be listed as not applicable (schema constant, ERR-REL-012, C002-INV-14). Under sdd MCP server enforcement, the expected mode for both targets ("`sdd-mcp-server` is the expected OpenCode mode" — `mapping-tables.md:197-198`), C002-REQ-617 then refuses every release, or the implementer chooses the expectations: the safety decision CR-1 was about.
- **Suggested fix:** in C002-IF-009 §2.2 state how a case's `cwd` is fed (server and OpenCode: the case path resolved against the case's `cwd`; Copilot hooks: the case's `cwd` in the input). Apply P-01's answer to Q-safety-04 for the cases with an absent field (missing or empty `cwd`, missing tool name) and for unknown `architect:sdd-*` callers on OpenCode. Recommended: a per-mechanism expectation as for memory (`deny`, fed as a malformed call, C002-CON-08; an unknown-name caller on OpenCode expects `allow`, C002-REQ-208), with `expected_source` naming the rule. The alternative is a second not-applicable rule, listing the cases by ID (schema, ERR-REL-012, C002-INV-14, glossary, C002-TS-631). Also require REF-WIN to create file symbolic links (Developer Mode) so that `requires` cases run, or give those cases a rule.
- **Owner:** architect (C002-IF-009 §2, schema, ERR-REL-012, C002-INV-14), spec-writer (C002-REQ-625 … C002-REQ-627 or a new REQ, glossary), test-designer (C002-TS-608, C002-TS-631, a scenario for PG-253 and PG-256)
- **Status:** open

#### CR-24 — C002-REQ-517 and C002-REQ-503 both MODIFY C001-REQ-1106: the archive cannot apply the second delta
- **Severity:** major
- **Refs:** C002-REQ-503, C002-REQ-517, C001-REQ-1106, C002-CON-05, C002-DEC-008
- **Evidence:** "### C002-REQ-503 — Allowlist with a bare `sdd` command and `node --version`" and "- **Delta:** MODIFIED C001-REQ-1106" — `10-spec/20-capabilities/CAP-05-cli-distribution/requirements.md:35-36`; "### C002-REQ-517 — Serena commands confined to a data folder outside the repository" and "- **Delta:** MODIFIED C001-REQ-1106" — `requirements.md:168-169`. The archive replaces the living entry with the new requirement's own entry: "const entry = [block[0]!, `- **Source:** ${change}, archived ${date}`, ...body];" — `src/archive/plan.ts:82`; "ops.push({ file: rel(at.name), op: "replace", id: old, detail: `superseded by ${r.id}` });" — `src/archive/plan.ts:230`; an ID no longer found blocks: "blockers.push(`${old} (cited by ${r.id}) is not in _living/`);" — `src/archive/plan.ts:225`.
- **Why it matters:** after C002-REQ-503 replaces C001-REQ-1106 in `_living/`, C002-REQ-517 no longer finds it and `sdd archive 002` reports a blocker; in the other order the Serena-only statement would replace the allowlist rule. C002-REQ-517 adds a rule beside the allowlist; it does not restate C001-REQ-1106 (rubric R11).
- **Suggested fix:** give C002-REQ-517 `Delta: ADDED`, keeping its rationale and evidence (C001-REQ-1106, current-state E-5, E-22); the waived LINT-DELTA-001 errors drop to nine.
- **Owner:** spec-writer
- **Status:** open

#### CR-25 — `--cwd` lets every writing `sdd` subcommand write a `.sdd/` that the path guard refuses; C002-IF-008 §1.2 concludes that no rule is needed
- **Severity:** major
- **Refs:** C002-IF-008 §1.2, C002-REQ-607, C002-REQ-517, C002-US-502, C002-GOAL-05, C002-DEC-001, C002-DEC-005, C002-TS-636
- **Evidence:** "Every other row writes only inside the `.sdd/` folder of the workspace that the CLI finds from its working folder (C001-IF-01), and `gate approve --commit` adds a git commit of those `.sdd/` files only, so the allowlist needs no rule for them." — `10-spec/50-interfaces/hooks-contract-delta.md:105-107`; the working folder is a global option of every subcommand: "const cwd = values["cwd"] !== undefined ? normalisePath(values["cwd"] as string, { cwd: io.cwd }) : io.cwd;" — `src/cli/run.ts:133`; the path guard refuses the same target: PG-082 `"path": "{outside}/.sdd/a.md", "expect": "deny", "note": ".sdd/ of another folder"` — `tests/guards/path-corpus.json:706-708`; the shell corpus allows `--cwd` on the CLI: BG-019 `"command": "node \"{sdd}\" lint 001 --cwd C:/Users/x/repo", "expect": "allow"` — `tests/guards/bash-corpus.json:161-162`; the story's outcome: "no allowlisted `sdd` command writes outside `.sdd/` into the repository" — `10-spec/20-capabilities/CAP-05-cli-distribution/stories.md:25`.
- **Why it matters:** `sdd change stop 001 --reason x --cwd C:/other-repo`, `sdd archive 001 --cwd C:/other-repo` or `sdd init --cwd C:/Users/me` pass the Claude Code hooks, the server's command tool, the scoped hooks and OpenCode's `sdd *` rule. They change another workspace's `.sdd/` or create one, which PG-082 refuses as a direct write. In a repository with a nested workspace (`<repo>/pkg/.sdd/`) the write lands inside the repository but outside its `.sdd/`. The gap exists on Claude Code today (parity with C002-DEC-005 holds), but §1.2 states the opposite, and the cases of C002-REQ-607 (C002-TS-636) will not exercise it. Closing it changes Claude Code behaviour (C002-GOAL-05), so P-01 decides, as for Q-guards-04.
- **Suggested fix:** apply P-01's answer to Q-guards-05. Recommended: the bash guard core allows `--cwd` on the writing subcommands of §1.2 only when the folder resolves inside the repository root of §1.1, on every host; add to C002-REQ-607 and C002-TS-636 one case `sdd <writing subcommand> --cwd {outside}` (deny) and one with a folder inside the repository (allow). If P-01 accepts the gap as parity instead, correct §1.2 to record the accepted `--cwd` risk.
- **Owner:** spec-writer (C002-REQ-607, a new REQ or C002-REQ-517, C002-GOAL-05), architect (C002-IF-008 §1.2), test-designer (C002-TS-610, C002-TS-636)
- **Status:** open

#### CR-26 — The Claude Code Serena step depends on `CLAUDE_PLUGIN_DATA` in the hook's environment, an unrecorded host assumption that C002-TS-528 stubs
- **Severity:** minor
- **Refs:** C002-IF-008 §1.1, C002-REQ-517, C002-REQ-623, C002-TS-528, C002-DOD-022, C002-GOAL-05
- **Evidence:** "the guard replaces it by the value of the environment variable `CLAUDE_PLUGIN_DATA` of its own process and decides that folder as below; an unset or empty variable denies the command." — `10-spec/50-interfaces/hooks-contract-delta.md:57-58`; "Given "CLAUDE_PLUGIN_DATA" is "C:/Users/fx/.claude/plugins/data/architect-inline" in the environment of the bash guard" — `10-spec/20-capabilities/CAP-05-cli-distribution/acceptance.md:450`; the only host evidence for the variable is its expansion in `.mcp.json`: "| `${CLAUDE_PLUGIN_DATA}` in `env` | expanded to `~/.claude/plugins/data/architect-inline`" — `docs/spikes/S-06-skills-mcp.md:138`.
- **Why it matters:** if Claude Code neither substitutes the variable in the command text nor exports it to PreToolUse hook processes, the Serena step of the Claude Code doctor and init commands is denied after CHG-002, a regression against C002-GOAL-05 and C002-REQ-623. C002-TS-528 would still pass, because it sets the variable itself.
- **Suggested fix:** cite the host documentation for the variable in hook processes, or mark `[ASSUMPTION: …]` in §1.1 with a check on the real host (an `@eval` of the Claude Code doctor's Serena step at its tested version, named in C002-DOD-022), and state the fallback if the variable is absent.
- **Owner:** architect (C002-IF-008 §1.1), test-designer (C002-TS-528, C002-DOD-022)
- **Status:** open

#### CR-27 — The S-07 outcome `agent_tools_closed` has no consequence
- **Severity:** minor
- **Refs:** C002-IF-001 §6.1, C002-IF-005 §2, C002-IF-009 §3, §5, C002-REQ-108, C002-TS-133
- **Evidence:** "TGT-TOOLS-001 checks it and spike S-07 confirms that a named entry overrides the catch-all (`agent_tools_closed`, C002-IF-009 §3)." — `10-spec/50-interfaces/mapping-tables.md:155-156`; "`agent_tools_closed` (a catch-all tool entry keeps an adopter MCP tool away from the Architect agents, C002-IF-005 §2); `cmd_shims` as for S-08; `enforcement_mode`: `native-permissions` or `sdd-mcp-server`." — `10-spec/50-interfaces/verification-records.md:113-115`; the release-check table (`verification-records.md:168-178`) has no row for it, and no `[ASSUMPTION]` marker names it.
- **Why it matters:** if S-07 finds that OpenCode ignores the catch-all (adopter tools stay on) or that a named entry cannot override it (agents lose every tool), neither enforcement mode closes the tool set, the release check does not refuse, and only C002-TS-133 fails at the DoD, with no way forward defined. The S-08 outcomes, by contrast, each lead to a mode or to the spec revision of scope §1.1.
- **Suggested fix:** mark the outcome `[ASSUMPTION: S-07]` in C002-IF-001 §6.1 and state its consequence, for example a release-check refusal of OpenCode on `agent_tools_closed: false` and a scope revision with P-01 as in scope §1.1.
- **Owner:** architect
- **Status:** open

#### CR-28 — ERR-REL-012: garbled message template and a condition narrower than the check
- **Severity:** minor
- **Refs:** ERR-REL-012, C002-IF-009 §5, C002-TS-637
- **Evidence:** "`<target>: replay report <path> (<mechanism>) <omits cases | lists cases more than once | lists cases as not applicable without a rule>\| lists cases as not applicable without a rule>: <case ids>`" with the condition "A replay report does not list every corpus case exactly once, or lists as not applicable a case that C002-REQ-626 makes applicable to its mechanism" — `10-spec/50-interfaces/errors.md:75`; the check: "under `not_applicable` exactly the cases that §2.1 excludes for its mechanism" — `verification-records.md:171`; C002-TS-637 asserts the message part: "Then the release is refused with ERR-REL-012, naming "<report>", "<mechanism>", "<message part>" and "<case>"" — `10-spec/20-capabilities/CAP-06-cross-target-verification/acceptance.md:521`.
- **Why it matters:** the duplicated fragment and the unescaped `|` inside a table cell (which splits the row when rendered) leave the message that C002-TS-637 checks ambiguous; the condition does not cover a report that replays identity cases on the server or the scoped hooks instead of listing them.
- **Suggested fix:** one message with the three alternatives, pipes escaped (`\|`), no duplicate; condition "… or whose not-applicable list differs from the cases that C002-IF-009 §2.1 excludes for its mechanism".
- **Owner:** architect
- **Status:** open

#### CR-29 — Index scenario counts stale after c7f4fc7; four new scenarios lie outside their capability's TS block
- **Severity:** minor
- **Refs:** 00-index, C002-TS-639, C002-TS-640, C002-TS-641, C002-TS-642
- **Evidence:** "| **Total** | | **30** | **116** | **118** | **188** |" — `10-spec/00-index.md:52`, with "33 (block 101–199)", "22 (block 401–499)", "35 (block 501–599)" and "36 (block 601–699)" for CAP-01, CAP-04, CAP-05 and CAP-06 (`00-index.md:46, 49, 50, 51`), while the acceptance files define 34, 24, 36 and 38 scenarios (194 in total); "Scenario Outline: C002-TS-640 — OpenCode agent tool map that is not closed" — `10-spec/20-capabilities/CAP-01-target-generator/acceptance.md:206`, in a capability with "id_block: { US: 101-199, REQ: 101-199, TS: 101-199 }" — `CAP-01-target-generator/stories.md:8`; likewise C002-TS-641 and C002-TS-642 in `CAP-04-sdd-mcp-server/acceptance.md:116, 133` and C002-TS-639 in `CAP-05-cli-distribution/acceptance.md:120`.
- **Why it matters:** navigation at G2 shows wrong counts and block ranges; a reader looking for C002-TS-640 under CAP-06 by its number will not find it.
- **Suggested fix:** update the TS column (34, 24, 36, 38; total 194) and note the out-of-block IDs in the index; IDs are not renumbered.
- **Owner:** spec-writer (index)
- **Status:** open

#### CR-30 — The nine new requirements cite their acceptance criteria in backticks, which lint does not check
- **Severity:** minor
- **Refs:** C002-REQ-517 … C002-REQ-520, C002-REQ-625 … C002-REQ-629
- **Evidence:** "- **Acceptance:** `C002-AC-625.1`" — `10-spec/20-capabilities/CAP-06-cross-target-verification/requirements.md:233` (also `:242, :251, :260, :269` and `CAP-05-cli-distribution/requirements.md:175, 186, 195, 204`); "IDs inside backticks, quotes or fenced code are examples and are not checked." — `plugins/architect/skills/sdd-conventions/SKILL.md:55`.
- **Why it matters:** the Acceptance field of these nine requirements is not a checked reference, unlike that of the other 107; a renamed or missing AC would not be reported.
- **Suggested fix:** remove the backticks now that the ACs exist.
- **Owner:** spec-writer
- **Status:** open

#### CR-31 — Stale or contradictory text left by the fix rounds
- **Severity:** minor
- **Refs:** C002-CAP-04, C002-IF-001 §6.3, C002-CON-06, Q-safety-03
- **Evidence:** "capability is `ADDED` throughout; the guard cores it calls stay unchanged (C002-GOAL-05)." — `10-spec/20-capabilities/CAP-04-sdd-mcp-server/requirements.md:12`, versus "the decision is that of C001-REQ-1106 (as changed by C002-REQ-503 and C002-REQ-517)" — `CAP-04-sdd-mcp-server/requirements.md:55`; "unless P-01 accepts stricter OpenCode decisions for command forms the generated agents never send (question Q-safety-03)." — `10-spec/50-interfaces/mapping-tables.md:199-200`, versus "Keep 0 differences (Recommended) — no spec change" — `10-spec/questions-log.md:81`; "a command with two read verbs or another flag still matches an `allow` rule (false allows the replay finds)" — `mapping-tables.md:188`, versus "it never writes an `allow` rule wider than a guard entry needs" — `mapping-tables.md:192` and "with no `allow` rule wider than a guard entry (C002-IF-001 §6.3)" — `10-spec/60-architecture/constraints.md:17`.
- **Why it matters:** three statements contradict the current decisions; the third leaves the implementer unsure whether a wider ripwire or git glob is allowed (the replay then selects server mode, so there is no safety impact).
- **Suggested fix:** CAP-04 header: "the guard cores it calls are those of C002-COMP-012, as changed by C002-REQ-503 and C002-REQ-517"; replace the Q-safety-03 sentence with its answer; restate C002-CON-06 and §6.3 as "no `allow` rule wider than the forms the generated agents send need; a guard rule a glob cannot follow is a replay difference".
- **Owner:** spec-writer (CAP-04 header), architect (C002-IF-001 §6.3, C002-CON-06)
- **Status:** open

### Rubric (re-review 1)

| Rubric | Item | Result |
|---|---|---|
| stories | S1 Persona is a defined P-ID | pass |
| stories | S2 Value / outcome stated | pass |
| stories | S3 INVEST | pass |
| stories | S4 Every story has ≥ 1 requirement | pass (TR-01 30/30) |
| stories | S5 Out of scope stated where a neighbour exists | pass (scope §2 names the two Claude Code changes) |
| stories | S6 Traces to the ideation | pass (revise measure covered; C002-GOAL-05 widening traced to Q-guards-04) |
| requirements | R1 Singular outcome | pass (C002-REQ-625's two clauses are one expectation rule, verified together by C002-TS-638) |
| requirements | R2 Testable | pass |
| requirements | R3 Unambiguous | pass |
| requirements | R4 Correct EARS pattern | pass |
| requirements | R5 Implementation-free | pass |
| requirements | R6 Complete | CR-23, CR-25 |
| requirements | R7 Consistent | CR-23, CR-31 |
| requirements | R8 Feasible | CR-23, CR-26 |
| requirements | R9 Necessary | pass (C002-REQ-517 … 520, 625 … 629 trace to P-01 answers or initial findings) |
| requirements | R10 Measurable values with units and limits | pass (C002-NFR-103 ≤ 5 s p95; C002-REQ-509 exact match) |
| requirements | R11 Delta and evidence | CR-24 (10 LINT-DELTA-001 waived under C002-DEC-008 are not findings) |
| requirements | R12 Priority set and consistent | pass (C002-REQ-520 Should, the others Must) |
| NFRs | N1 ISO 25010 category | pass |
| NFRs | N2 Metric with unit | pass |
| NFRs | N3 Threshold set or marker | pass (no marker left) |
| NFRs | N4 Feasible method and environment | CR-23 |
| NFRs | N5 Covered by a DoD item | pass (every NFR names its C002-DOD item) |
| acceptance | A1 Every REQ has an AC, every AC a TS | pass (TR-02 116/116, TR-03 118/118) |
| acceptance | A2 Scenarios observable and concrete | pass |
| acceptance | A3 One behaviour per scenario | pass |
| acceptance | A4 Error and abuse cases present | CR-25 |
| acceptance | A5 n/a cells justified | pass |
| domain, interfaces, architecture | D1 Entities with attributes, relationships, owner, invariants | pass (C002-INV-14 inherits CR-23) |
| domain, interfaces, architecture | D2 Lifecycles > 2 states: diagram and complete table | pass (CR-17 resolved) |
| domain, interfaces, architecture | D3 Interfaces parse and name their errors | CR-28 |
| domain, interfaces, architecture | D4 Components with ID, responsibilities, requirements served | pass (116 of 116 realized) |
| domain, interfaces, architecture | D5 Decisions with alternatives recorded | pass (architecture §6.2; Q-safety-03 answered) |
| DoD and index | O1 Every REQ and NFR covered | pass (TR-05 100%) |
| DoD and index | O2 Evidence types fit the statements | CR-26 |
| DoD and index | O3 Global items referenced | pass |
| DoD and index | X1 Index is navigation only | CR-29 |
| plan | P1 … P7 | n/a: spec phase |
| ideation | I1 … I10 | n/a: spec phase (G1 approved 2026-10-14; ideation not stale) |

## Verdict

**needs-revision** — the fix round resolved 20 of the 22 initial findings, and the two partial ones
are carried forward. P-01's answers of rounds 2 and 3 are applied faithfully: per-mechanism
expectations, deferral by spec revision, Serena confinement on every host, exact version match,
≤ 5 s p95, and 0 differences for OpenCode. The hooks-fallback exception now requires VS Code evidence
taken with hooks enabled. G2 still cannot pass on three points:

- CR-23 (blocker): a few corpus cases (no or empty `cwd`, no tool name, an unknown `architect:sdd-*`
  caller, a `requires` capability) still leave the release gate unsatisfiable under sdd MCP server
  enforcement. P-01 must answer Q-safety-04.
- CR-24 (major): two MODIFIED deltas of C001-REQ-1106 would block `sdd archive 002`.
- CR-25 (major): a `--cwd` write path that §1.2 declares closed. P-01 must answer Q-guards-05.

The six minor findings can go in the same fix round. A further re-review can be limited to
C002-IF-009 §2, C002-REQ-517, C002-IF-008 §1.1 and §1.2, C002-REQ-607 and the IDs linked to them.
