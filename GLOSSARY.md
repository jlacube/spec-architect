# Glossary

| Term | Meaning |
|---|---|
| **AC** | acceptance criterion, e.g. `C001-AC-1103.1`; belongs to one requirement |
| **ADR** | architecture decision record (`20-plan/20-decisions/ADR-*.md`) |
| **agent_type** | field of Claude Code hook input naming the calling agent (`architect:sdd-planner`); absent for a plain main session (spike S-04) |
| **allowlist** | the read-only shell commands Architect agents may run (IF-07 §3) |
| **approvals.json** | per-change record of approved phase hashes and per-ID hashes |
| **Architect** | this plugin; also the `sdd-architect` agent (components, interfaces, ADRs) |
| **archive** | merging a finished change into the living specs and moving it to `.sdd/_archive/` |
| **auditor** | `sdd-auditor` (haiku): runs lint, trace and status |
| **brief** | the conductor's instructions to a specialist: inputs, IDs, outputs, quality bar, return contract |
| **brownfield / greenfield / mixed** | change kinds: modifies existing code / new code / both |
| **CAP** | capability, a group of stories and requirements (`CAP-11-packaging-safety`) |
| **cartographer** | `sdd-cartographer` (sonnet): code evidence with ripwire, Serena, LSP, grep |
| **CHG-001** | the change that specifies Architect itself (`.sdd/001-architect-agent-suite/`) |
| **conductor** | `sdd-conductor` (opus): the main-session agent that talks to P-01 |
| **constitution** | project-wide principles, quality bar, NFR defaults, global DoD (`_constitution/constitution.md`, gate G0) |
| **COMP / CON** | architecture component / constraint |
| **corpus** | a JSON set of test inputs with expected decisions (path guard 256, bash guard 277, secrets 176) |
| **critic** | `sdd-critic` (opus): rubric review with blocker / major / minor findings |
| **DEC** | decision record of P-01's choice after an options analysis |
| **defect (D-nnn)** | a spec problem found after approval; fixed through a revision |
| **Delta** | brownfield requirement field: ADDED, MODIFIED (was X), REMOVED (was X), RENAMED (was X) |
| **dev / milestone / release tier** | eval repetition levels: 1, 3, more runs per scenario (ADR-003) |
| **DOD** | Definition of Done item, with an evidence type |
| **dogfooding** | using Architect on its own repository and on real changes |
| **dry run** | `sdd archive --dry-run`: print the planned operations, change nothing |
| **EARS** | Easy Approach to Requirements Syntax: ubiquitous, event-driven (WHEN), state-driven (WHILE), unwanted behaviour (IF … THEN), optional feature (WHERE); exactly one SHALL |
| **eval** | a live run of real agents on a fixture with assertions on what they did |
| **eval-dispatcher** | eval-only relay agent that spawns one specialist as a subagent so its skills preload |
| **exposure check** | an injection eval passes only if the agent's tool results contain the planted marker |
| **fixture** | a prepared repository or workspace for a test (`fx-brownfield-ts`, `fx-large`, …) |
| **G0 / G1 / G2 / G3** | gates: constitution / ideation / specification / plan |
| **gate** | the human decision at a phase exit: Approve, Approve with waivers, Revise, Stop |
| **Gate log** | table in `change.md` with every gate decision and P-01's words verbatim |
| **GUARD-PATH-001 / GUARD-BASH-001 / 002** | guard denial codes: write outside the allowed folders / command not allowlisted / chaining, redirection or substitution |
| **hand-off** | `20-plan/handoff.md`: the implementer's instructions |
| **hash** | SHA-256 over a phase's normalised content; changed content makes an approval stale |
| **hook** | a command Claude Code runs on an event (PreToolUse, PostToolUse, SubagentStop, SessionStart) |
| **ID** | `C<NNN>-<TYPE>-<seq>`, allocated by `sdd id next`, never reused |
| **IF** | interface contract (IF-01 CLI … IF-14 external tools) |
| **injection** | instructions planted in content an agent reads, hoping it will follow them |
| **inventory stub** | a living-spec file with only Purpose, Entry points, modules, tests, evidence (`inventory_only: true`) |
| **lite / full** | change profiles: single spec file / one file per artifact type |
| **living spec** | `_living/CAP-<slug>.md`: the current truth after archives, with a History table |
| **M-n** | milestone of the plan |
| **marker** | `[NEEDS CLARIFICATION: …]` or `[ASSUMPTION: …]` in an artifact; open markers block a gate |
| **MCP** | Model Context Protocol servers: Context7, DeepWiki, Serena |
| **mutation check** | disabling one check to prove some test fails without it |
| **NFR** | non-functional requirement with metric, threshold, method, environment |
| **OA** | options analysis |
| **P-01** | the spec owner (Jerome LACUBE); the only gate approver |
| **phase** | `00-ideation`, `10-spec`, `20-plan` |
| **registry.json** | generated index of all changes, phases, tasks, defects |
| **REQ** | requirement |
| **revision** | reopening an approved phase; later phases become stale |
| **ripwire** | CLI code-intelligence tool (redhat-et): repository map, callers, impact, hotspots |
| **SDD** | spec-driven development |
| **`sdd`** | the deterministic CLI (`plugins/architect/scripts/sdd.mjs`) |
| **SDD.md** | workspace description file with a generated status block |
| **Serena** | MCP code-intelligence server, used in read-only mode |
| **skill** | a Markdown procedure or quality bar an agent preloads |
| **specialist** | one of the nine subagents the conductor delegates to |
| **spike (S-0n)** | a time-boxed experiment answering a platform question before design-dependent work |
| **stale** | an approved phase whose content (or upstream) changed since approval |
| **T / TC / TS** | task / test case / test scenario |
| **tombstone** | a retired ID recorded in the ledger so it is never reused |
| **TR-nn** | traceability rule (coverage or DAG) |
| **trace graph** | nodes (ID definitions) and edges (references) of a change (`trace.json`) |
| **US** | user story |
| **waiver** | an item P-01 explicitly accepts as not met at a gate |
