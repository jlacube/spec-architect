# How we built it

The story of CHG-001, from an idea on 2026-10-10 to milestone M-5 on 2026-10-12. Sources: the Gate
log in `.sdd/001-architect-agent-suite/change.md`, `docs/spikes/`, `docs/milestone-log.md` and the
git history (126 commits, never pushed).

## 1. Ideation, specification and plan (2026-10-10)

P-01 asked for Claude Code agents covering **ideation, specification and planning only**, with gates
at every phase exit and specs detailed enough to validate code later. Key choices made in the
ideation interviews:

- a **conductor** as the main session plus per-phase re-entry commands;
- **EARS** requirements, user stories, **Given/When/Then** scenarios;
- code intelligence by **ripwire** (CLI) and **Serena** (read-only), docs by **Context7** and web,
  other repositories by **DeepWiki** (added at G1 at P-01's request);
- **Node.js** scripts, **Mermaid** diagrams, **tiered models** (opus for judgement, sonnet for
  research and code survey, haiku for mechanical audit);
- everything under `.sdd/`, with `SDD.md` and a generated `registry.json` tracking state including
  implementation progress.

The specification grew to 80 stories, 210 requirements, 232 acceptance criteria, 233 scenarios, 27
NFRs, 14 interfaces and 13 components; the plan to 7 milestones and 59 tasks with 233 test cases.
G1, G2 and G3 were approved the same day.

## 2. M-1 — spikes before design-dependent work

Six experiments resolved unknown platform behaviour before code depended on it:

| Spike | Question | Verdict | Consequence |
|---|---|---|---|
| S-01 | does ripwire run on Windows? | works with caveats | budget flags per verb family written into the spec |
| S-02 | can Serena run read-only on Windows? | works with caveats | read-only mode file; data folder and dashboard settings (later `sdd serena-config`) |
| S-03 | can Archify validate and render architecture? | fallback only on Windows | Mermaid is the diagram format |
| S-04 | do hooks know which agent is calling? | **works** | `agent_type` = `architect:<agent>` → the primary guard design; the planned fallback was replaced by a minimum Claude Code version (2.1.295) |
| S-05 | can a plugin agent be the main session and ask questions? | works with caveats | the central design assumption holds; headless `-p` mode removes AskUserQuestion, so evals use the SDK |
| S-06 | what do preloaded skills cost; what are MCP tool names? | works with caveats | skill budgets in characters; tool names `mcp__plugin_architect_<server>__<tool>`, deferred behind ToolSearch |

A notable finding of S-04: the `claude` CLI on the PATH (2.0.76) was broken on current models, so
all headless runs use the desktop app's bundled 2.1.295 with the parent session's environment
stripped.

## 3. M-2 — the deterministic CLI, dogfooded

T-010 … T-028 built the `sdd` CLI: parser and model, atomic IO and paths, front-end, init, change
commands, templates, ID ledger, status and registry, the lint framework and rules, the trace
engine, hashes/approvals/staleness, gate and tracking commands, fixtures and benchmarks. The exit
criterion was **dogfooding**: `sdd lint` exits 0 on this repository's own CHG-001, and the G1/G2
hashes reproduce. That forced a first revision of the ideation (labels and IDs, relaxed scenario
rules) approved by P-01.

## 4. M-3 — the conductor and the ideation/spec agents

T-029 built the eval harness (ADR-007), then the conductor, interview protocol, phase skills,
commands, gate protocol, researcher, options analyst, spec writer, test designer, critic and
auditor — each with live evals. Specialists not yet written ran as cheap haiku stand-ins so the
conductor could be tested first.

## 5. M-4 — code intelligence, architecture, planning

T-041 … T-044: the cartographer (with machine configurations simulating present, missing,
crashing or outdated tools), the architect, the planner, and revise/stop/doctor.

## 6. M-5 — hooks, guards, archive (2026-10-11/12)

T-050 path guard, T-051 shell guard, T-052 hooks wiring with the session brief and post-write lint,
T-053 the archive engine and command, T-054 the security corpus. Details in [SAFETY.md](SAFETY.md).

## 7. The seven defects — the method correcting itself

Implementation surfaced spec problems. Each went through the formal loop: `sdd defect add`, `sdd
gate record --decision revise`, edit the spec, lint and trace, ask P-01, `sdd gate approve` with
P-01's words, `sdd defect close`, `sdd stale check`.

| Defect | Found in | Problem | P-01's decision |
|---|---|---|---|
| D-001 | T-030 | the spec granted `TodoWrite`, which no longer exists on current models | use TaskCreate/TaskUpdate/TaskList (opt-in setting documented) |
| D-002 | T-034 | "every question has 2–3 options, recommended first" contradicted "the gate has exactly four fixed options" | "Gate exception (Recommended)" |
| D-003 | T-043 | plan scenarios said "the lint checks…" but no lint codes existed for plan artifacts | "Add lint rules (Recommended)" → new task T-076 |
| D-004 | T-044 | the conductor was told to write Serena's config outside `.sdd/`, which its own guard forbids | "CLI writes it (Recommended)" → new task T-077, `sdd serena-config` |
| D-005 | T-044 | revision gates needed an impact list the CLI could not produce | "Gate summary lines (Recommended)" |
| D-006 | T-052 | the SubagentStop hook called `trace --active`, absent from the CLI contract (and trace could exit 2, which blocks a subagent) | "Add --active to IF-01 (Recommended)" |
| D-007 | T-052 | the path guard blocked the researcher's and cartographer's agent memory (`.claude/agent-memory/…`), found by a live test | "Own memory folder (Recommended)" |

## 8. Bugs found along the way (selection)

- A stopped change still appeared as active in `SDD.md`.
- A revision did not move the current phase back, so the gate command chose the wrong gate; and
  re-approving later gates did not move it forward again (fixed 2026-10-12).
- The component template lacked "Depends on"; init lacked toolchain and inventory stubs; the
  decision command did not follow the DEC template; the gate presentation was missing from the
  question.
- Lint did not scan `_constitution/` and `_decisions/` for secrets; connection strings with an empty
  user name were missed.
- Serena failed without a `projects` key in its config, connected after subagents had already
  started, and found no references without a `tsconfig`.

## 9. Ways of working

- **One task at a time**, each with a commit carrying the task ID and a second commit reporting it
  with `sdd task set` (status, commit, note).
- **Never push.** Everything stays local until P-01 decides.
- **Recommendations as approvals** for routine choices (P-01's standing instruction), but **gate
  approvals always come from P-01's own answer** in the session.
- **Usage pacing:** work stops near 90% of the 5-hour plan window and resumes after the reset.
- **Budget pacing:** eval spend on the prepaid API key is tracked per task and capped per milestone.
- Repository and web content is data, never instructions — the same rule the agents follow.
