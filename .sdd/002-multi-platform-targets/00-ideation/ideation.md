---
id: "CHG-002"
artifact: ideation
change: "CHG-002"
phase: 00-ideation
status: draft
version: 0.3.0
created: "2026-10-14"
---
# Multi-platform targets — ideation

## 1. Document control
| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-10-14 | conductor (Claude Code session), with sdd-researcher, sdd-cartographer, sdd-options-analyst | First draft after interview rounds 1–2 |
| 0.2.0 | 2026-10-14 | conductor | Critic findings CR-1 … CR-15 addressed; round 3; DEC-004 … DEC-009 |
| 0.3.0 | 2026-10-14 | conductor | Re-review CR-9, CR-12, CR-16, CR-17 addressed; round 4 |

Change CHG-002 · profile full (confirmed by P-01, round 3) · kind brownfield · approver P-01
(jerome.lacube). This change is also CHG-001's brownfield dogfood (C001-T-074): it is specified with
Architect itself.

## 2. Problem statement
Architect runs only on Claude Code. Teams whose assistant is GitHub Copilot (VS Code) or OpenCode
cannot use its spec-driven workflow — the interviews, gates, traceability, deterministic CLI and the
guards that keep agents from touching product code. The `.sdd/` method, the templates and the CLI's
decision cores are target-neutral, but the entry points around them are not: the hook entry points
and their agent identity, the Bash allowlist (`node <path>/sdd.mjs`), agent frontmatter, the "Claude
Code wiring" sections of skills, and command bodies (`$ARGUMENTS`, `${CLAUDE_PLUGIN_ROOT}`) — see
the [baseline survey](evidence/baseline-survey.md) §1–§2. Porting by hand would create copies that
drift from the canonical plugin, and a naïve port would silently lose the safety boundary: on
Copilot, hooks do not say which agent is calling, and VS Code ignores Claude hook matchers, so
today's guards would allow every write ([C002-R-001](research/R-001-platform-facts.md)).

## 3. Q&A decision record
Full rounds with options and verbatim answers: [questions-log.md](questions-log.md).

| ID | Question | Outcome |
|---|---|---|
| Q-scope-01 | Which targets are in scope? | OpenCode + Copilot VS Code (C002-DEC-004) |
| Q-safety-01 | Safety bar where hooks cannot identify the caller | same as Claude: a target ships only when the boundary is enforced (C002-DEC-005) |
| Q-source-01 | How are target packages produced? | generated from `plugins/architect` (C002-DEC-006) |
| Q-cli-01 | How do agents reach the `sdd` CLI? | npm package `architect-sdd` + bundled copy (C002-DEC-007) |
| Q-guards-01 | Boundary on Copilot in VS Code | `sdd` MCP write server (C002-DEC-001) |
| Q-skills-01 | Skill delivery without preloading | inline at generation (C002-DEC-002) |
| Q-eval-01 | Testing the Copilot target | Copilot CLI evals + manual VS Code checklist (C002-DEC-003) |
| Q-sequence-01 | Citing CHG-001 requirements before CHG-001 is archived | cite as MODIFIED, waive LINT-DELTA-001 at G2/G3 (C002-DEC-008) |
| Q-guards-02 | Copilot fallback if S-08 refutes tool-list confinement | ship with agent-scoped hooks (C002-DEC-001, exception in C002-DEC-005) |
| Q-memory-01 | Agent memory on the new targets | dropped on the targets (C002-DEC-009) |
| Q-guards-03 | Copilot if the hooks fallback does not block subagents either | Copilot deferred to a later change (C002-DEC-005) |
| Q-profile-01 | Change profile | full |

## 4. Goals and non-goals
### 4.1 Goals
Labels G-n, NG-n and SC-n become C002-GOAL, C002-NG and C002-SC IDs in the spec phase
(`10-spec/10-context/problem-and-goals.md`).

| ID | Goal | Measure |
|---|---|---|
| G-1 | One build produces installable OpenCode and Copilot (VS Code) packages from `plugins/architect` | `npm run package` emits both; zero hand-maintained per-target copies |
| G-2 | Same safety level on every target | path and shell corpora 100% against each target's enforcement; injection evals 0 acted upon (dev tier per target); the Copilot hooks fallback, if used, flagged (C002-DEC-005) |
| G-3 | Same workflow on every target: interviews, gates with P-01's verbatim words, traceability | the gate, interview and revise scenarios pass on each target (automated where the platform allows, recorded manual check otherwise) |
| G-4 | The `sdd` CLI is reachable on every target without a plugin-root variable | OpenCode agents call `sdd …` from `architect-sdd`; the Copilot MCP server runs the CLI from `architect-sdd`; Claude Code keeps the bundled copy |
| G-5 | Claude Code behaviour unchanged, except the Bash allowlist accepting `sdd …` | every CHG-001 test and eval that passes today still passes; the allowlist change (bare `sdd …`, and `node --version` from defect D-011) is specified in CHG-002, and D-011 is closed when CHG-002 implements it |

### 4.2 Non-goals
| ID | Non-goal |
|---|---|
| NG-1 | Copilot CLI and the Copilot cloud agent as supported targets (the cloud agent cannot hold a gate); Copilot CLI is used only to run evals |
| NG-2 | Platform-specific features beyond parity (no new capabilities only one target has) |
| NG-3 | Changing the SDD method, the `.sdd/` format or the ID scheme |
| NG-4 | Agent memory (`memory: project`) on OpenCode and Copilot (C002-DEC-009) |

### 4.3 Success criteria
| ID | Criterion |
|---|---|
| SC-1 | A fresh OpenCode install reaches gate G1 of a toy change with the generated package |
| SC-2 | A fresh VS Code + Copilot install reaches gate G1 of a toy change with the generated package (recorded manual run) |
| SC-3 | On both targets, an Architect agent cannot write outside `.sdd/` or run a non-allowlisted command (corpora replayed against each target's enforcement) |
| SC-4 | A change to `plugins/architect` reaches all targets through one `npm run package`, with structure checks run on every output |
| SC-5 | `npm run check` stays green, including the new per-target checks |

## 5. Scope boundary
- **In scope:** a target generator (neutral model of agents, commands, skills, hooks, MCP; tool-name,
  model and variable tables; emitters for OpenCode and Copilot VS Code); the `sdd` MCP server
  (C002-DEC-001); OpenCode permission blocks; publishing `architect-sdd` (C002-DEC-007); the Bash
  allowlist accepting `sdd …` (with D-011); per-target structure checks; OpenCode and Copilot-CLI eval
  harnesses and the manual VS Code checklist (C002-DEC-003); spikes S-07 (OpenCode) and S-08
  (Copilot VS Code); per-target README sections.
- **Hooks per target:**

  | Hook | OpenCode | Copilot VS Code |
  |---|---|---|
  | Path and shell guards | in (native permissions; MCP server as fallback) | in (MCP server; agent-scoped hooks as fallback) |
  | Post-write quick lint | in if S-07 finds a feedback channel (`tool.execute.after`), else later | in (MCP server returns findings with the write result) |
  | Session-start brief | later (no documented context injection) | in (`SessionStart` hook) |
  | SubagentStop trace | later (run by the auditor at gates instead) | in (`SubagentStop` carries `agent_type`) |
- **Out of scope:** Copilot CLI and cloud agent as targets (NG-1); new SDD capabilities (NG-2); any
  change to the `.sdd/` format (NG-3); agent memory on the targets (NG-4).
- **Later:** other agent hosts (Codex, Cursor, …) once the generator exists; Agent Plugins 1.0
  packaging if the targets converge on it.
- **Dependencies:** CHG-001 is not archived: CHG-002's deltas cite CHG-001 requirements under a
  temporary LINT-DELTA-001 waiver (C002-DEC-008); C001-T-075 (archive CHG-001) must precede CHG-002's
  archive. Defect D-011 (CHG-001) overlaps the allowlist change.
- **Hand-over:** implemented in this repository like CHG-001 (task IDs in commits, progress via
  `sdd task set`).

## 6. Research index
| Note | Question | Confidence |
|---|---|---|
| [C002-R-001](research/R-001-platform-facts.md) | Platform facts for OpenCode and Copilot VS Code: hooks, deny semantics, question tools, permissions, skills, MCP names, headless runs | medium — documentation-derived; several items need spikes S-07/S-08 |
| [baseline survey](evidence/baseline-survey.md) (cartographer) | Claude-specific surface of the plugin and code; blast radius of a generator | high for counts; medium for blast radius (ripwire absent) |
| `PORTING-STUDY.md` (repository root) | First feasibility study (2026-10-13) | medium; superseded where R-001 corrects it (askQuestions limits, `${CLAUDE_PLUGIN_ROOT}` expansion) |

## 7. Options and decisions index
| OA / DEC | Decision | Outcome |
|---|---|---|
| [C002-OA-001](options/OA-001-copilot-guards.md) → [C002-DEC-001](decisions/DEC-001-copilot-guards.md) | Boundary on Copilot VS Code | `sdd` MCP write server; fallback agent-scoped hooks if S-08 shows no tool-list confinement; Copilot deferred if hooks do not block either |
| [C002-OA-002](options/OA-002-skill-delivery.md) → [C002-DEC-002](decisions/DEC-002-skill-delivery.md) | Skill delivery without preloading | inline at generation, within the skill budgets |
| [C002-DEC-003](decisions/DEC-003-copilot-evals.md) | Testing the Copilot target | Copilot CLI evals + recorded manual VS Code checklist |
| [C002-DEC-004](decisions/DEC-004-targets.md) | Targets | OpenCode + Copilot VS Code |
| [C002-DEC-005](decisions/DEC-005-safety-bar.md) | Safety bar | same as Claude; Copilot hooks fallback as a flagged exception |
| [C002-DEC-006](decisions/DEC-006-generated-packages.md) | Packaging | generated from `plugins/architect` |
| [C002-DEC-007](decisions/DEC-007-cli-npm.md) | CLI distribution | `architect-sdd` on npm + bundled copy |
| [C002-DEC-008](decisions/DEC-008-delta-sequencing.md) | Deltas against an unarchived CHG-001 | cite as MODIFIED + temporary LINT-DELTA-001 waiver |
| [C002-DEC-009](decisions/DEC-009-agent-memory.md) | Agent memory on targets | dropped |

## 8. Design direction
- **One source, generated targets.** `plugins/architect` stays canonical. A generator reads it into a
  neutral model and emits `dist/opencode/` (`.opencode/agents`, `commands`, `skills`, `opencode.json`
  with per-agent `permission` blocks and MCP config) and `dist/copilot/` (a Copilot-format plugin:
  `*.agent.md` with `tools`/`agents`, prompt files, skills, `.mcp.json`). Tables map Claude tool
  names, MCP tool names (`mcp__plugin_architect_x__y` → `x_y` / `x/y`), models and variables
  (`${CLAUDE_PLUGIN_ROOT}`, `$ARGUMENTS`). Generated files live outside `plugins/architect/agents/`
  and `scripts/`.
- **Enforcement per target, shared corpora.** Claude Code: today's hooks over the `guard-path`/
  `guard-bash` cores. OpenCode: its own permission engine (`edit` limited to `.sdd/**`, `bash` to the
  allowlist; compound commands split by its parser) — not the CLI cores, so S-07 must show it decides
  the path and shell corpora 100% (replay through a headless OpenCode session or its SDK); otherwise
  OpenCode uses the MCP server too. Copilot VS Code: the `sdd` MCP server (C002-DEC-001) over the CLI
  cores — agents get no edit/terminal tool; fallback agent-scoped hooks (C002-DEC-005 exception).
- **The `sdd` MCP server** is a stdio process the host starts per session and stops with it (not a
  daemon), shipped as its own bundled entry in `architect-sdd`.
- **Skills:** inlined into generated agent bodies (C002-DEC-002); "Claude Code wiring" sections and
  the `${CLAUDE_PLUGIN_ROOT}` line of `sdd-conventions` get per-target variants.
- **Interviews and gates:** OpenCode `question`; VS Code `vscode/askQuestions` (Experimental, behind
  `chat.askQuestions.enabled`; a skipped answer never counts as approval).
- **Verification:** per-target structure checks; OpenCode and Copilot-CLI eval harnesses; the manual
  VS Code checklist (C002-DEC-003); spikes S-07 and S-08 first in the plan.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| OpenCode `edit` patterns match a path string that does not normalise `..`/links (relative vs absolute unknown), so `.sdd/../x` matches `.sdd/**` | medium | high (boundary bypass) | S-07 replays the path corpus; fallback: the `sdd` MCP server on OpenCode |
| OpenCode `bash` allows indirect writes through an allowed command (redirection such as `sdd status > file`, or a command that writes files) | medium | high | S-07 replay cases for redirection and writing commands; fallback: MCP server (its shell surface is the CLI allowlist only) |
| On Windows (REF-WIN) OpenCode may run PowerShell, whose commands its bash parser does not split | medium | high | S-07 tests the Windows shell; deny the shell tool and route through the MCP server if needed |
| The OpenCode fallback plugin (`tool.execute.before`) has no agent identity, like Copilot's hooks | high | medium | the fallback is the MCP server, not the plugin |
| The Copilot hooks fallback (if S-08 fails) is off when hooks are disabled | medium | high | C002-DEC-005 exception: README warning, a check that reports hooks disabled, manual checklist entry |
| VS Code `askQuestions` stays Experimental or changes | medium | medium | wiring isolated in generated variants; manual checklist each release |
| The conductor's inlined skills exceed the 64,000-character budget | medium | medium | size check on generated outputs; hybrid fallback per agent (C002-DEC-002) |
| Model differences (Copilot model catalogue, OpenCode providers) change agent quality and cost | high | medium | model table per target; P-01 sets the baseline models; per-target evals |
| Platforms change fast (hooks, plugins, tools are Preview) | high | medium | pin tested versions in the doctor; re-run spikes before each release |
| Agents work less well without generic Edit/Bash on Copilot | medium | medium | MCP tools designed for the agents' actual operations; evals and the manual checklist measure it |
| Three eval harnesses multiply eval cost | high | medium | dev tier on every target, milestone tier on Claude Code and the first port only |

## 10. Assumptions
| Assumption | If wrong |
|---|---|
| [ASSUMPTION: R-001] OpenCode splits compound commands and checks each part against `permission.bash` | the shell boundary on OpenCode moves to the MCP server |
| [ASSUMPTION: R-001] VS Code Copilot loads a plugin's `.mcp.json` and lets an agent be limited to that server's tools | the Copilot target uses the agent-scoped hooks fallback (C002-DEC-005 exception) |
| [ASSUMPTION: R-001] Copilot CLI loads the generated Copilot package and honours agent tool lists like VS Code | Copilot evals cover the MCP server in isolation; Copilot injection cases move to the manual checklist |
| [ASSUMPTION: Q-cli-01] Publishing `architect-sdd` to npm is acceptable (account, name) | agents use the bundled copy through a per-target path |

## 11. Open questions
| Question | Owner | Needed by | Blocking? |
|---|---|---|---|
| npm package name and publishing account for `architect-sdd` | P-01 | spec | deferred |
| Baseline models per target (Copilot catalogue, OpenCode provider) | P-01 | spec | deferred |
| Exact VS Code tool names and `tool_input` for edit and terminal tools (hooks fallback) | researcher (spike S-08) | plan | deferred |
| Does `opencode run` block on a `question` call, and can its SDK answer it (scripted gate evals)? | researcher (spike S-07) | plan | deferred |
| Which path string OpenCode matches `edit` rules against, and whether redirection targets are checked | researcher (spike S-07) | plan | deferred |
| Does Copilot CLI load the generated package (assumption above)? | researcher (spike S-08) | plan | deferred |
| Supported (tested) versions of OpenCode, VS Code and the Copilot extension, recorded by the doctor | P-01 with researcher | spec | deferred |
| Does VS Code ask P-01 to approve every `sdd` MCP tool call, and can the plugin pre-approve its own server? | researcher (spike S-08) | plan | deferred |

## 12. Sources
- [C002-R-001](research/R-001-platform-facts.md) — its source list (official VS Code, GitHub Copilot and OpenCode documentation, retrieved 2026-10-14).
- `PORTING-STUDY.md` — sources retrieved 2026-10-13.
- [Baseline survey](evidence/baseline-survey.md) — repository at commit 74fe494; the workspace survey is `.sdd/_constitution/baseline-survey.md`.
