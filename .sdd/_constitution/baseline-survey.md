---
id: BASELINE-SURVEY
artifact: constitution/baseline-survey
change: none
phase: constitution
status: draft
---

# Baseline survey

Workspace-level survey of the repository at commit `b3892d4ca5e93ec80cb2231595adac2c45e37671`,
taken 2026-10-13 for `/architect:init`. Layers: Serena (symbols), git and glob/grep (files and
counts). ripwire is absent (`ripwire --version` exit 127); see `toolchain.md`. Common disclosure for
every entry below: `ripwire failed: exit 127`.

## 1. Languages and size

| Language | Where | Files (tracked) | Size |
|---|---|---|---|
| TypeScript | `src/` (product), `tests/` (suites and fixtures) | 307 `.ts` overall; 104 under `src/` | `src/`: 6,734 non-empty lines |
| JavaScript (ESM `.mjs`) | `scripts/` (19 files, build and checks), `bench/`, `evals/`, `plugins/architect/scripts/sdd.mjs` (generated bundle) | 146 `.mjs` overall | not counted |
| Markdown | `plugins/architect/` (agents, commands, skills), repository docs, `.sdd/` | many | not counted |
| JSON / YAML | manifests (`.claude-plugin/marketplace.json`, `plugins/architect/.claude-plugin/plugin.json`, `hooks/hooks.json`, `.mcp.json`), `serena/architect-read-only.yml`, schemas | few | not counted |

Tracked files by area: `src` 104, `tests` 1,137 (181 are `*.test.ts`; the rest are fixtures, corpora
and lint fixtures), `plugins` 107, `scripts` 19. Eval and bench results are committed under
`evals/results/` and `bench/results/`.

What the repository is: the source of the Architect plugin for Claude Code. `src/` compiles into one
Node CLI (`sdd`), bundled to `plugins/architect/scripts/sdd.mjs`. The rest of
`plugins/architect/` is prompt content (10 agents, 13 commands, 18 skills), hooks, MCP wiring and a
Serena mode file.

## 2. Layout

| Path | Role |
|---|---|
| `src/cli.ts`, `src/cli/` | CLI entry, command table (`COMMANDS`), help, errors, output |
| `src/workspace/` | `.sdd/` workspace: init, change creation, ledger, status and registry, upgrade, Serena config and launcher |
| `src/model/` | markdown blocks, frontmatter, IDs, artifact graph |
| `src/io/` | atomic writes, path helpers |
| `src/lint/` | lint engine, EARS parser, spec facts, 52 rule files plus `index.ts` under `src/lint/rules/` |
| `src/trace/` | traceability model, coverage matrix, open items, `trace --write` |
| `src/gate/` | gate approval, content hash, stale check, revision impact, critic parsing, opt-in commit |
| `src/tracking/` | task and defect lifecycle |
| `src/archive/` | archive plan, apply, living-spec edits |
| `src/hooks/` | PreToolUse guards (bash, path), PostToolUse, SessionStart brief |
| `plugins/architect/` | shipped plugin: agents, commands, skills, hooks, `.mcp.json`, Serena mode |
| `scripts/` | `build.mjs`, `check.mjs`, `check/*.mjs` (structure checks), `test.mjs`, `package.mjs`, `licenses.mjs` |
| `bench/` | micro-benchmarks (guards, lint, faults, session-start) |
| `evals/` | model-in-the-loop evals per capability (`evals/cap01` … `cap11`), harness, injection suite |
| `docs/` | spikes, metrics, milestone log, dogfood and security notes |

## 3. Test layout and commands

- Runner: `scripts/test.mjs` transpiles every `tests/**/*.test.ts` (fixtures folders skipped) with
  esbuild into `build/tests/`, then runs them with `node --test`, with a no-network preload
  (`tests/no-network.mjs`, C001-NFR-202). Positional arguments filter by path substring.
- `tests/unit/<module>/` mirrors `src/` (model, io, workspace, lint, evals).
- `tests/integration/capNN/TS-<n>.test.ts` is one file per acceptance scenario, grouped by capability
  (cap01 … cap11), with shared fixtures such as `workspace-fixtures.ts`, `spec-fixture.ts`,
  `gate-fixture.ts`.
- `tests/guards/` holds the bash and path guard corpora; `tests/lint-fixtures/` the lint fixtures
  (run by `tests/unit/lint/fixtures.test.ts`); `tests/fixtures/` shared fixtures, including
  `fx-brownfield-ts/`, a small TypeScript project used as test data (not product code).
- Commands (`package.json`): `npm run build`, `npm run typecheck` (`tsc --noEmit`), `npm test`
  (build then tests), `npm run check` (typecheck, `claude plugin validate`, build, tests, lint
  fixtures, plugin structure checks), `npm run bench`, `npm run eval` (model-driven; bills the
  configured API key, so never part of a routine run), `npm run package`.
- Node `>=20`.

## 4. Capability map

The eleven capabilities of CHG-001 map to code as listed in the `_living/CAP-<slug>.md` stubs; the
table gives the primary source module of each.

| Capability | Primary code | Primary tests |
|---|---|---|
| `C001-CAP-01` workspace | `src/workspace/`, `src/model/`, `src/io/` | `tests/integration/cap01/`, `tests/unit/{model,io,workspace}/` |
| `C001-CAP-02` conductor | `plugins/architect/agents/sdd-conductor.md`, `skills/interview-protocol` | `tests/integration/cap02/`, `evals/cap02/` |
| `C001-CAP-03` ideation | agents `sdd-researcher`, `sdd-options-analyst`; `skills/phase-ideation` | `tests/integration/cap03/`, `evals/cap03/` |
| `C001-CAP-04` specification | agent `sdd-spec-writer`; `src/lint/ears.ts`, `src/lint/spec.ts` | `tests/integration/cap04/` |
| `C001-CAP-05` architecture | agent `sdd-architect`; `src/lint/rules/arch-*.ts`, `if-*.ts` | `tests/integration/cap05/` |
| `C001-CAP-06` planning | agents `sdd-planner`, `sdd-test-designer`; `src/lint/rules/task-*.ts` | `tests/integration/cap06/` |
| `C001-CAP-07` quality | `src/lint/`, `src/trace/`; agents `sdd-critic`, `sdd-auditor` | `tests/integration/cap07/`, `tests/unit/lint/` |
| `C001-CAP-08` gates | `src/gate/` | `tests/integration/cap08/` |
| `C001-CAP-09` tracking and archive | `src/tracking/`, `src/archive/` | `tests/integration/cap09/` |
| `C001-CAP-10` code intelligence | agent `sdd-cartographer`; `src/workspace/serena-*.ts`; `serena/architect-read-only.yml` | `tests/integration/cap10/`, `evals/cap10/` |
| `C001-CAP-11` packaging and safety | `src/hooks/`, `plugins/architect/hooks/`, `scripts/` | `tests/integration/cap11/`, `tests/guards/` |

Mapping notes: capabilities 02 to 06 and 10 are mostly prompt content (Markdown agents, skills,
commands), so their owning code is thin; their lint-visible effects live in `src/lint/rules/`.
Rule files are grouped by filename prefix; the grouping below is inferred from the names (low
confidence), not from reading each rule: `ide`, `oa`, `res` (ideation); `ears`, `req`, `us`, `ts`,
`cov`, `nfr`, `dod`, `word` (specification); `arch`, `if`, `err` (architecture); `plan`, `task`,
`obs`, `sec` (planning); `tr-*` (traceability); `gate`, `reg`, `liv`, `ws`, `txt`, `con`, `delta`,
`evd` (gates, registry and workspace).

## 5. Hotspots (size proxy, ripwire `--hotspots` unavailable)

Largest source files by non-empty lines: `src/cli/commands.ts` (491), `src/lint/spec.ts` (285),
`src/archive/plan.ts` (277), `src/model/graph.ts` (262), `src/hooks/guard-bash.ts` (216), `src/lint/engine.ts` (213), `src/workspace/status.ts` (211), `src/workspace/upgrade.ts` (197),
`src/gate/gate.ts` (178), `src/trace/matrix.ts` (174). Change frequency was not measured.

## 6. Blast-radius preview

Not computed: this is a workspace-level survey with no targeted symbol, and ripwire `--impact` is
unavailable. Structural fan-in is visible instead: `src/cli/commands.ts` wires every command
(`COMMANDS` table) to the modules above, so a signature change in a module surfaces there first.

## 7. Evidence

- **E-1** `src/cli/run.ts:74` › `runCli()` — CLI dispatcher; `src/cli.ts` is the 16-line entry that calls it.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/cli/commands.ts:480` › `COMMANDS` — command table; the module defines the command functions (init, lint, gate*, archiveCmd, taskSet, defect*, traceCmd, hook*, guard*, serena*).
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/lint/engine.ts:106` › `lintWorkspace()` — lint entry; rules registered in `RULES` at `src/lint/rules/index.ts:58`.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-4** `scripts/test.mjs:1` › - — test runner: esbuild transpile then `node --test` with a no-network preload.
  - layer: grep (file read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-5** `scripts/check.mjs:15` › `STEPS` — `npm run check` steps: typecheck, validate, build, tests, fixtures, structure.
  - layer: grep (file read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-6** `package.json:11` › `scripts` — npm scripts for build, typecheck, test, check, bench, eval, package.
  - layer: grep (file read) · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
