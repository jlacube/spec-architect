# Architect — overview

> Start here. This file explains what this repository is, why it exists, and how the other
> explanation files fit together. It was written on 2026-10-12, after milestone M-5.

## In one paragraph

**Architect** is a plugin for Claude Code: a team of ten AI agents, eighteen skills, thirteen slash
commands, five hooks and a deterministic command-line tool (`sdd`) that together run
**spec-driven development (SDD)**. You describe an idea; the agents interview you, research, analyse
the existing code, and produce — phase by phase, each closed by a human approval gate — an
**ideation brief**, a **specification** (user stories, EARS requirements, acceptance scenarios,
non-functional requirements, interfaces, architecture) and an **implementation plan** (tasks,
milestones, tests, risks, rollout, hand-off). It stops there: Architect never writes production
code. The result is a set of plain Markdown and JSON files under `.sdd/` that any implementer —
human or AI — can follow, and that you can later use to check whether the code matches what was
agreed.

## Why it exists

AI coding assistants are fast but drift: they guess requirements, skip edge cases, and leave no
trace of why something was built. The goal of this project (set by P-01, the spec owner, on
2026-10-10) is the opposite discipline:

- **Think before coding.** Ideation → specification → planning, with nothing skipped.
- **The human decides.** Agents propose options with a recommendation; only P-01 approves a phase,
  in their own words, recorded verbatim.
- **Everything is traceable.** Every requirement, criterion, scenario, task and test case has a
  stable ID; a trace graph proves coverage (every story has requirements, every requirement has
  acceptance criteria, every criterion has scenarios, every requirement has a task and a test).
- **Specs detailed enough to validate the code later.** The plan ends with a tool-neutral hand-off.
- **Safe by construction.** Agents can only write inside `.sdd/`; their shell access is a strict
  read-only allowlist; content they read is treated as data, never as instructions.

## The twist: it built itself

The plugin is being built **with its own method**. The specification of Architect is change
`CHG-001`, stored in `.sdd/001-architect-agent-suite/` in this very repository. It went through the
three gates (G1 ideation, G2 specification, G3 plan) with P-01, and is now being implemented task by
task from its own plan. Each finished task is reported with `sdd task set`; each spec problem found
during implementation becomes a **defect** and goes back through a formal revision and a new gate
approval. See [HOW-WE-BUILT-IT.md](HOW-WE-BUILT-IT.md).

## Where things stand (2026-10-12)

| Item | State |
|---|---|
| CHG-001 phases | G1, G2, G3 approved; hashes match (`sdd stale check`) |
| Tasks | 47 of 59 done; milestones M-1 … M-5 complete |
| Defects found during implementation | 7 (D-001 … D-007), all closed through revisions |
| Automated tests | 501 passing (`npm run check`), 0 network calls |
| Lint of this repository's own workspace | 0 errors, 0 warnings |
| Next | M-6 packaging and quality gates, then M-7 release and dogfooding |

Details: [STATUS-AND-NEXT.md](STATUS-AND-NEXT.md).

## Reading guide

| File | Read it to learn |
|---|---|
| [OVERVIEW.md](OVERVIEW.md) | this page |
| [WORKFLOW.md](WORKFLOW.md) | the SDD method: phases, gates, artifacts, IDs, interviews, critique, revisions, archive |
| [PLUGIN.md](PLUGIN.md) | what is in the plugin: the ten agents, the skills, the commands, the hooks, the MCP servers, and how to use it |
| [SDD-CLI.md](SDD-CLI.md) | the deterministic `sdd` command-line tool: every command, lint, trace, hashes, gates, archive |
| [SAFETY.md](SAFETY.md) | the guards and the security evidence: path guard, shell guard, injection resistance, secrets, no network |
| [TESTING-AND-EVALS.md](TESTING-AND-EVALS.md) | how it is verified: unit/integration tests, corpora, benchmarks, live agent evals and their cost |
| [HOW-WE-BUILT-IT.md](HOW-WE-BUILT-IT.md) | the story: spikes, milestones, defects and decisions, with the reasons |
| [STATUS-AND-NEXT.md](STATUS-AND-NEXT.md) | what is done, what was deferred and why, what comes next |
| [GLOSSARY.md](GLOSSARY.md) | every term and abbreviation used in this repository |
| [PORTING-STUDY.md](PORTING-STUDY.md) | feasibility of running Architect on GitHub Copilot and OpenCode |

## Repository map

```text
.sdd/                         the SDD workspace of this repository (CHG-001 lives here)
  SDD.md, registry.json       workspace description and generated status
  001-architect-agent-suite/  CHG-001: 00-ideation/, 10-spec/, 20-plan/, change.md, approvals.json, trace.json
plugins/architect/            the plugin itself (what users install)
  agents/                     10 agent definitions (Markdown + YAML frontmatter)
  skills/                     18 skills (procedures, rubrics, formats)
  commands/                   13 slash commands (/architect:…)
  hooks/hooks.json            5 hooks: path guard, shell guard, post-write lint, SubagentStop trace, session brief
  .mcp.json                   Context7, DeepWiki, Serena (read-only)
  serena/                     Serena read-only mode file
  templates/                  workspace, change (full and lite) and constitution templates
  scripts/sdd.mjs             the bundled sdd CLI (built from src/)
src/                          TypeScript source of the sdd CLI and the hooks
tests/                        node:test suites, guard corpora, secret fixtures, no-network preload
evals/                        live agent evaluations (Claude Agent SDK harness) and their results
bench/                        performance benchmarks and results
docs/                         spike reports, milestone log, security results, metrics
scripts/                      build and test runners
```

## Who is who

- **P-01** — the spec owner (Jerome LACUBE). The only person who approves gates. In the agents'
  world, P-01 is "the user".
- **The conductor** (`architect:sdd-conductor`) — the only agent that talks to P-01. It runs the
  phases and delegates to nine specialists.
- **The implementer** — whoever builds from the plan. For CHG-001 that has been Claude Code working
  task by task, under P-01's direction, with the rule "never push" and commits that carry the task ID.
