# Architect

A Claude Code plugin for **spec-driven development**: ten agents, eighteen skills, thirteen commands,
five hooks and a deterministic CLI that take an idea through ideation, specification and planning,
with a human approval gate at each phase exit. Architect writes specs and plans, never production
code.

This repository holds the plugin (`plugins/architect/`), its CLI sources (`src/`), tests, agent
evaluations, benchmarks, and the specification of Architect itself (`.sdd/001-architect-agent-suite/`,
built with its own method). For the full story read [OVERVIEW.md](OVERVIEW.md); the user guide is
[plugins/architect/README.md](plugins/architect/README.md).

## Prerequisites

Windows 11 x64 (macOS and Linux: prepared, untested), **Claude Code 2.1.295 or later**, Node.js 20 or
later, Git. Details: [plugin README — Prerequisites](plugins/architect/README.md#prerequisites).

## Install (Windows 11)

```text
/plugin marketplace add <folder of this repository>
/plugin install architect@architect-local
```

Then, in the repository to specify: `claude --agent architect:sdd-conductor` and `/architect:doctor`.
Details: [plugin README — Install](plugins/architect/README.md#install-windows-11).

## Optional tools

ripwire, Serena (read-only) and ast-grep for code evidence; Context7 and DeepWiki are remote and need
no install. Each has a fallback. Details: [plugin README — Optional tools](plugins/architect/README.md#optional-tools).

## Quickstart

`/architect:init` → `/architect:gate constitution` → `/architect:new "<title>"` → `/architect:ideate`
→ `/architect:gate ideation` → `/architect:specify` → `/architect:gate spec` → `/architect:plan` →
`/architect:gate plan` → hand `20-plan/handoff.md` to the implementer → `/architect:archive <NNN>`.
Details: [plugin README — Quickstart](plugins/architect/README.md#quickstart).

## Commands

Thirteen `/architect:*` commands: init, new, ideate, specify, plan, gate, revise, status, lint,
research, decide, archive, doctor. Reference: [plugin README — Commands](plugins/architect/README.md#commands)
and [SDD-CLI.md](SDD-CLI.md) for the `sdd` CLI behind them.

## Agents

The conductor (opus) and nine specialists: researcher, cartographer (sonnet), options analyst, spec
writer, test designer, architect, planner, critic (opus), auditor (haiku). Reference:
[plugin README — Agents](plugins/architect/README.md#agents) and [PLUGIN.md](PLUGIN.md).

## Workspace layout

Everything lives under `.sdd/` in your repository: `SDD.md`, `registry.json`, `_constitution/`,
`_decisions/`, `_living/`, `_archive/` and one folder per change. Reference:
[plugin README — Workspace layout](plugins/architect/README.md#workspace-layout).

## Troubleshooting

Every doctor finding has a fix in the [plugin README — Troubleshooting](plugins/architect/README.md#troubleshooting).
Safety behaviour (guard denials) is explained in [SAFETY.md](SAFETY.md).

## Developing

```bash
npm install
npm run check      # typecheck, claude plugin validate, build, tests, lint fixtures, structure checks
npm run bench      # performance benchmarks
npm run package    # build + checks + validate → dist/architect-<version>/ and dist/architect-<version>.zip
```

Agent evaluations cost real model usage; see [TESTING-AND-EVALS.md](TESTING-AND-EVALS.md).

## License

MIT — see [LICENSE](LICENSE) and [plugins/architect/THIRD_PARTY_NOTICES.md](plugins/architect/THIRD_PARTY_NOTICES.md).
