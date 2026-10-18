---
id: C002-PLAN-IMPACT-01
artifact: plan/impact/blast-radius
change: CHG-002
phase: 20-plan
status: draft
---

# CHG-002 — Blast radius

What the plan's tasks will touch in the existing code, who calls or depends on it, and what a wrong
change breaks. Companion files: `regression-set.md` (tests) and `hotspots.md` (churn and size).
Components are those of `../../10-spec/60-architecture/architecture.md`; interfaces and requirements
are those of `../../10-spec/50-interfaces/sdd-cli-delta.md` (C002-IF-007) and `hooks-contract-delta.md`
(C002-IF-008). The CHG-001 plan has no `30-impact/` folder, so the layout follows the code-discovery
skill: per targeted symbol, direct callers, transitive reach, layer.

## 1. Method and disclosures

- Commit: `85bee21` (`git rev-parse HEAD` = 85bee2184d59e429e31e17a5e3bd6b87b2d4d4aa). Working tree is
  clean for source (only an untracked `bench/results/lint-quick-*.json`).
- Layer ladder: **ripwire is absent** (`ripwire --version`: exit 127, command not found), so neither
  `--impact`, `--callers` nor `--test-gate` could be asked. Every entry therefore carries
  `ripwire failed: exit 127`. References of TypeScript symbols come from **Serena**
  (`find_referencing_symbols`, `get_symbols_overview`); files that are not symbol-bearing (Markdown,
  JSON, `.mjs` scripts) and test selection come from **grep** and file reads, checked by reading. LSP
  and ast-grep were not needed. "Transitive reach" counts files or entry points reached by following
  Serena references up to the CLI entry, hook wiring or test file; it is a lower bound for the
  Markdown and `.mjs` areas (grep, not a call graph).
- Serena reports 0-based lines; the entries below are 1-based. Serena resolves TypeScript under `src/`
  and `tests/`; it does not follow `.mjs` scripts, so those are grep entries (confidence medium).
- Code that CHG-002 adds (`src/mcp/`, `scripts/generate/`, `scripts/release/`, `tests/replay/`,
  `evals/harness/runners/`, `plugins/architect/targets/`) has no dependants today; section 4 lists what
  those new modules will import, because that is how the existing modules acquire new dependants.

## 2. Summary table

Reach is counted at HEAD. "New dependants" are the CHG-002 modules that will start to call the symbol.

| # | Symbol or file (component) | Change (requirement) | Direct callers today | Transitive reach today | New dependants | Risk |
|---|---|---|---|---|---|---|
| BR-1 | `decideBash`, `sddCli`, `VERSION_PROBES`, `ALLOWED` text — `src/hooks/guard-bash.ts` (C002-COMP-012) | bare `sdd`, `node --version` (C002-REQ-503); Serena confinement (C002-REQ-517); `--cwd` rule (C002-REQ-521) | 2: `guardBash` (`src/cli/commands.ts:434`), the corpus test (`tests/guards/bash-corpus.test.ts:46`) | 1 CLI command → the `Bash\|PowerShell` PreToolUse hook → every Bash/PowerShell call of the 10 Architect agents; 5 test files (E-3, E-4); `bench/guards.mjs` | sdd MCP server `run_command`, `hook guard --host copilot`, OpenCode `bash` rules generator, corpus replay adapters | **High**: the only barrier on Claude Code; one function decides all hosts (C002-CON-06) |
| BR-2 | `tokenise` (exported) — same file | reused unchanged by the MCP server (words without a shell, C002-REQ-406) | 1: `decideBash` (l.217) | same as B-1 | MCP server, Copilot adapter | Medium: an exported parser becomes an execution input |
| BR-3 | `decidePath`, `WRITE_TOOLS` — `src/hooks/guard-path.ts` (C002-COMP-012) | new option `memoryFolder` (default on, C002-IF-008 §5) | 2: `guardPath` (`commands.ts:426`), `tests/guards/fixture.ts:135` | `guardPath` → PreToolUse `Write\|Edit\|NotebookEdit` hook; path corpus (256 cases); 4 cap11 tests (E-6) | MCP `files` profile, `hook guard` write class | **High**: default must stay on for Claude Code |
| BR-4 | `parseHookInput`, `isArchitectAgent`, `HookInput` — `src/hooks/input.ts` | Copilot adapter builds the same input; identity from `--agent` (C002-IF-008 §2) | 4 entry points in `commands.ts` (E-5); `decideBash` l.210, `decidePath` l.46 | all four hook commands; 11 test files mention `agent_type` | `hook guard`, MCP server | Medium |
| BR-5 | `COMMANDS` table, `findCommand`, `GROUPS` — `src/cli/commands.ts:481-508`, `src/cli/run.ts:31-45` (C002-COMP-018) | new rows: `host-version`, `template show`, `template list`, `hook guard`, `hook subagent-stop`; options `--user-data`, `--read-only`, `--host`; `--version` | `runCli` (`run.ts:83`), `topHelp`, `GROUPS`, `frontend.test.ts:43,131` | every CLI invocation of all hosts; the writing-command table of C002-IF-008 §1.2 **duplicates** these names | bash guard (writing-command recognition) | **High** (hotspot: 533 lines, 18 commits) |
| BR-6 | `runCli`, `execute`, `GLOBAL_OPTIONS` — `src/cli/run.ts` | `--version` before command lookup; `--cwd` semantics relied on by C002-REQ-521, not changed | `src/cli.ts`, tests via `runBundled`/`runInProcess` | 66 test files call `runBundled`; every command | guard (reads `--cwd` rule), MCP server (spawns CLI) | Medium |
| BR-7 | `serenaConfig` (`commands.ts:419`), `serenaLaunchCmd` (`:468`), `serenaLaunch` (`serena-launch.ts:14`), `writeSerenaConfig` (`serena-config.ts`) | `--user-data`, `--read-only`, ERR-CLI-020 (C002-REQ-515, C002-REQ-516, C002-REQ-512) | `COMMANDS` rows only (1 reference each); `serenaLaunch` has one production caller | `.mcp.json` Serena server on Claude Code; doctor and init commands; 3 cap10 tests | generated MCP configs of both targets | Medium |
| BR-8 | `defaultPluginRoot`, `templatesDir`, `resolveTemplate`, `listTemplates` — `src/workspace/templates.ts` | `template show`/`list` confined to a profile folder (C002-REQ-513, C002-REQ-514, C002-REQ-520) | `createChange` (`change.ts:75`), `planUpgrade` (`upgrade.ts:119`), `templates.test.ts`, `TS-123` | `sdd change new`, `sdd init`, upgrade; template tests | `template show`/`list` | Medium: `resolveTemplate` does no `..` check today (E-12) |
| BR-9 | `scripts/build.mjs` (C002-COMP-013) | second entry `src/mcp/server.ts`; version from `plugin.json`; licence check over both | `npm run build`, `npm test`, `npm run check`, `scripts/package.mjs`; copied by `TS-1115` | the single shipped file `plugins/architect/scripts/sdd.mjs`; `THIRD_PARTY_NOTICES.md` | npm staging, Copilot CLI copy | **High**: wipes any other file in `plugins/architect/scripts/` (E-14) |
| BR-10 | `scripts/package.mjs` (C002-COMP-013) | generator step, npm staging and pack, template CLI-line translation (ERR-BLD-002), `targets/` left out of the Claude staging | `npm run package` | `dist/architect-<version>*` zips | all packaging flows | High: `cpSync(plugins/architect)` copies `targets/` unless excluded (E-15) |
| BR-11 | `scripts/check.mjs`, `scripts/check/run.mjs` `CHECKS`, `scripts/check/lib.mjs` `context()` (C002-COMP-007, C002-COMP-013) | new target-structure step; PLG-VAR-001 over agents, commands, skills | `npm run check`, `package.mjs`, `TS-1118` | 14 registered checks; each reads `ctx.plugin` | `scripts/check/targets/*.mjs` | Medium |
| BR-12 | `scripts/check/{path,dup,size,port,layout,tools,mcp,hooks,readme}.mjs` | read the new `targets/` folder (path), or must not (layout, mcp, hooks, tools) | `run.mjs` | see section 3.4 | — | Medium |
| BR-13 | `scripts/test.mjs` (`findTests`, `__SDD_VERSION__`, preload of `tests/no-network.mjs`) | version source; new test folders (`tests/replay/`) | `npm test`, `npm run check` | every test file | replay and MCP tests | **High**: network stubs are inherited by every child process (E-17) |
| BR-14 | `package.json`, `tsconfig.json` | devDependencies (MCP SDK, OpenCode SDK), publishable manifest of `architect-sdd`, `include` for `scripts/generate`, `scripts/release` | all scripts | all | — | Medium |
| BR-15 | 10 agent files, 13 command files, 4 wiring skills, `sdd-conventions`, `code-discovery`, `.mcp.json`, `hooks.json`, `README.md`, `plugin.json` (C002-COMP-014 … C002-COMP-017) | wiring variants, host rows, README sections; **source text stays Claude Code** (C002-CON-10) | read by the generator (read only); by 40+ tests and 14 checks | see section 3.5 | generator, PLG-VAR-001 | Medium: any edit of source text re-runs Claude evals |
| BR-16 | `evals/harness/session.mjs` `runSession` and `env.mjs` (C002-COMP-009) | host selection; new runners beside it | `evals/harness/run.mjs`, `evals/cap10/carto.mjs`, `assert.mjs` | 104 files reference `harness/` (baseline E-23) | OpenCode and Copilot CLI runners | Medium |
| BR-17 | `tests/guards/*.json` corpora (C002-COMP-013) | new cases; `cwd` and memory/identity fields (C002-REQ-607, C002-REQ-625) | `bash-corpus.test.ts`, `path-corpus.test.ts`, `bench/guards.mjs` | 533 cases | replay suite (C002-COMP-008) | High: two consumers must read the same JSON |

## 3. Detail by area

### 3.1 Guard cores (C002-COMP-012)

**`decideBash` and `sddCli`.** `sddCli` accepts only a first word `node` (l.120), then the literal
`${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs` or a script named `sdd.mjs` outside `.sdd/`. It is referenced
only by the two uses in the `allowed` expression of `decideBash` (l.221). A bare `sdd` therefore falls
through to the deny branch (E-1, E-2). The change adds, in the same expression, a second CLI form, and
the three new rules apply to **both** forms, so they attach to one place: after the CLI prefix has been
recognised and before the allow. Concretely the plan has to add four things in `guard-bash.ts`:

1. a bare-`sdd` branch (whole first word, C002-TS-504) and `["node", "--version"]` in
   `VERSION_PROBES` (exact word count keeps `node --version --eval=x`, corpus BG-166, denied);
2. Serena-command detection and the data-folder resolution of C002-IF-008 §1.1, which needs a
   **repository-root helper** (nearest `.git`, else nearest `.sdd`, else `cwd`) that does not exist:
   the only existing root helper is `findWorkspace` (nearest `.sdd`, `src/workspace/find.ts`), used by
   `sddCli` l.125 and `decidePath` l.52. The same helper is needed by ERR-CLI-020 in the CLI
   (C002-IF-007), so it belongs in a shared module, not in `guard-bash.ts`;
3. the writing-command table and the `--cwd` check of C002-IF-008 §1.2;
4. the `ALLOWED` text (l.16-17) and the deny summary, which the spec changes (C002-IF-008 §1).

The guard resolves paths with `normalisePath`, `pathKey`, `realPath` of `src/io/paths.ts`
(import l.10, E-2). `realPath` has a single other production use (`isInside`, `paths.ts:139`) and the
`decidePath` calls (l.69, l.73), so the resolution rules of C002-IF-008 §1.1 (letter case, 8.3 names,
links) reuse code that the path guard already exercises; a change to `paths.ts` would hit both guards
and `tests/unit/io/paths.test.ts`.

**Duplicated knowledge.** The writing-subcommand names (`init`, `change *`, `id *`, `gate *`, `stale`,
`task`, `defect *`, `archive`, `hook subagent-stop`, `status --write`, `trace --write`) are written in
C002-IF-008 §1.2 and exist as `COMMANDS` rows (E-8). The CLI takes its subcommand from the first one or
two words only (`findCommand`, `run.ts:33-45`, E-9); the guard must reproduce that rule or an agent can
write with a spelling the guard does not read as writing (for example a global option before the
subcommand: `findCommand` reads `argv[0]`, so `sdd --cwd x status --write` is a usage error in the CLI
and not a bypass, but the plan should assert it). Nothing ties the two lists together today; this is
the main drift risk of the change.

**Environment read.** Rule 2 of §1.1 reads `CLAUDE_PLUGIN_DATA` from the guard's own environment. That
makes `decideBash` impure for the first time (it is a "pure function of `HookInput`" today, E-1 comment
block and current-state §1). Every corpus test, the MCP server and the replay adapters then depend on
the process environment; C002-TS-528 stubs it, C002-TS-537 checks it on the real host.

**`decidePath`.** One new option; the default (memory folder on) must keep `guardPath` and the 256-case
corpus unchanged (E-6). `decidePath` reads `cwd` through `findWorkspace` (l.52), so the MCP server and
`hook guard` get the "nearest `.sdd/` upward" workspace on purpose (C002-IF-008 "Workspace reached").

### 3.2 CLI front-end (C002-COMP-018)

- `COMMANDS` is the only registry (`commands.ts:481-508`); `GROUPS` is derived from it (`run.ts:31`).
  Adding `template` creates a new group, and `hook guard`, `hook subagent-stop` extend `hook`. A group
  word followed by an unknown word is "unknown command" (`run.ts:37-38`).
- The error catalogue `CATALOGUE` (`src/cli/errors.ts:37`) ends at ERR-CLI-018; ERR-CLI-019 (template
  not found or outside the profile) and ERR-CLI-020 (per-user data folder) are new entries. A test
  mirrors the catalogue against the CHG-001 `errors.md` (regression-set E-31), and PLG-MSG-001
  (`scripts/check/rules.mjs:43,61`) reads the same CHG-001 file, so neither sees the CHG-002 rows
  without a change.
- `--version` is a new first-argument form beside `--help`/`-h`/`help` (`run.ts:79`); `sdd version` must
  keep printing `architect-plugin@<semver>` (`commands.ts:508`, `src/version.ts:5`).
- `serena-launch` today takes one positional plus `rest` after `--` (`commands.ts:505`); the spec makes
  the positional optional when `--user-data` is given (C002-IF-007 synopsis). The positional spec and
  `checkPositional` change together.
- `execute` resolves a global `--cwd` against `io.cwd` (`run.ts:133`) for every command, so the new
  `host-version` and `template` commands accept it too unless the plan says otherwise.
- `hookSessionStart` (`commands.ts:455`) gains `--host`; `trace --active --quiet --write`
  (`traceActive`, `:308`) is the command that `hook subagent-stop` runs, so a fault there must still
  exit 0 (C002-IF-007 exit codes).

### 3.3 Templates, Serena and version

- `defaultPluginRoot()` returns `CLAUDE_PLUGIN_ROOT` when set, else the folder above the bundle
  (`templates.ts:32-37`). In `architect-sdd` the bundle is `<package>/scripts/sdd.mjs`, so the folder
  above is the package and `templates/<profile>/` must sit there (a layout check for the staging task,
  C002-IF-003). A host that sets `CLAUDE_PLUGIN_ROOT` and also runs the npm `sdd` would read the Claude
  plugin's templates; low probability, worth one test.
- `resolveTemplate` joins `rel.split("/")` onto the profile folder with no `..` or link check (l.58-66).
  Today its callers pass constants (`change.ts:75`, `upgrade.ts:119`), so this is harmless; `template show`
  passes **agent-supplied text**, so C002-REQ-513's confinement (normalised and real path stay inside
  the profile folder) is new code, either inside `resolveTemplate` (then `change`/`upgrade` inherit it
  and `templates.test.ts` covers it) or a separate function (then the two paths can diverge).
- `serenaLaunch(dataDir, args, command)` calls `writeSerenaConfig(dataDir)` then `spawnSync` with
  inherited stdio (l.14-16). `--read-only` adds `--mode <cli folder>/../serena/architect-read-only.yml`:
  that path assumes the same folder shape (`<root>/scripts/sdd.mjs`, `<root>/serena/…`) in the plugin and
  in `architect-sdd`.
- `__SDD_VERSION__` is defined from the root `package.json` by `build.mjs` and `test.mjs` (E-14, E-17);
  C002-ADR-004 moves the build to `plugin.json`. Both files say `0.0.1` now and `tests/smoke.test.ts`
  asserts they are equal. `sdd --version` must print the bare version (C002-IF-007) while `sdd version`
  prints the prefixed form.

### 3.4 Build, package and checks (C002-COMP-013, C002-COMP-007)

- `build.mjs` removes every file under `plugins/architect/scripts/` except `sdd.mjs` (l.15-17) and
  `tests/smoke.test.ts` asserts the folder lists exactly `["sdd.mjs"]`. The second bundle
  (`sdd-mcp.mjs`) must therefore be written outside that folder; it is not part of the Claude Code
  plugin (C002-CON-12).
- `package.mjs` copies the whole `plugins/architect/` tree into the Claude staging (l.41); the new
  `plugins/architect/targets/` folder would ship in the Claude Code zips unless the copy filters it
  (C002-CON-10, ADR-002 consequence). `claude plugin validate` runs on the staged copy (l.78-79).
- `check.mjs` has six fixed steps and takes `--steps` (l.15-39); the plan adds a step. `TS-1118` calls it
  with `--steps validate,fixtures,structure`, so a new step does not slow that test.
- Checks that scan `ctx.plugin` (E-16) will see `targets/` once it exists: `path.mjs` scans every
  `.md`/`.json`/`.yml` outside `scripts/`, so a Windows drive path or `/Users/` string in a mapping
  table or wiring variant fails PLG-PATH-001. `layout.mjs` counts exactly 10 `sdd-*.md` files in
  `agents/` (generated agents must not land there), `dup.mjs` compares commands to agents only,
  `size.mjs` and `port.mjs` read `skills/` and `templates/` only, `tools.mjs` compares agent `tools` to
  the CHG-001 file `.sdd/001-…/50-interfaces/agents.md` (the path moves at the CHG-001 archive, baseline
  §4 note 7), `mcp.mjs` and `hooks.mjs` pin the Claude spelling. None of them may be re-pointed at
  generated output without a new `ctx`; C002-COMP-007 uses a separate check family for that.
- `licenses.mjs` is called with one metafile (`bundledPackages(root, result.metafile)`, `build.mjs:43`);
  ERR-BLD-001 over the union of both bundles needs it to accept two metafiles, and `TS-1114` asserts the
  notices of the `src/cli.ts` bundle only.

### 3.5 Plugin files that get wiring variants (C002-COMP-014 … C002-COMP-017)

The generator reads these files and translates them; the plan does not edit their Claude Code text
(C002-CON-10), except where a task adds host-neutral wording. Lines are current:

| Construct | Where | Variant needed |
|---|---|---|
| `${CLAUDE_PLUGIN_ROOT}` as the CLI spelling | `agents/sdd-conductor.md:19`, `agents/sdd-auditor.md:13`, `skills/sdd-conventions/SKILL.md:13` | `sdd` on both generated targets (bare, REQ-503) |
| `${CLAUDE_PLUGIN_ROOT}/templates/…` | `agents/sdd-spec-writer.md:19`, `commands/decide.md:18`, `commands/init.md:25` | `sdd template show …` (construct `plugin-root-templates`) |
| `${CLAUDE_PLUGIN_DATA}` | `commands/doctor.md:8`, `commands/init.md:9`, `.mcp.json` | `--user-data` |
| `AskUserQuestion` | `agents/sdd-conductor.md:7,61,66`, `commands/archive.md:15`, `skills/interview-protocol/SKILL.md:121,127` | host question tool |
| guard line "start `claude --agent architect:sdd-conductor`" | line 6 of all 13 commands; `agents/sdd-conductor.md:3`; `README.md:35,68,106,165` | dropped or replaced per target |
| Claude wiring sections | `interview-protocol:119`, `research-protocol:93`, `code-discovery:109`, `gate-protocol:87` | variant per section |
| eight-row doctor table and remedies | `commands/doctor.md:17-39` | host rows (C002-REQ-504 to C002-REQ-510) |
| eight-row toolchain record | `skills/code-discovery/SKILL.md:94` | host-dependent record (C002-REQ-507) |
| `hooks/hooks.json` (5 commands) | pinned by `TS-1122` | unchanged for Claude Code |
| Serena `--context claude-code` | `.mcp.json:11`, pinned by `scripts/check/mcp.mjs` and `TS-1007` | per-target Serena entry in `targets/` |

`size.mjs` budgets (24,000 characters per skill body, 64,000 per agent over its preloaded skills) apply
to the source; the Copilot package inlines skills (C002-IF-001), and the target check, not `size.mjs`,
must bound the inlined result.

### 3.6 Eval harness (C002-COMP-009)

`runSession` (`evals/harness/session.mjs:21`) has three importers (`evals/harness/run.mjs`,
`evals/harness/assert.mjs`, `evals/cap10/carto.mjs`). It owns the only SDK import and the
`AskUserQuestion` interception. The new runners reuse the case API, so `runSession` should keep its
signature; selecting a host inside it widens a 76-line function with 4 commits that three importers rely
on. `evals/harness/env.mjs` requires `CLAUDE_CODE_EXECPATH` and must not become mandatory for the other
hosts. Cost control stays as recorded in the project memory (evals $0.50 per run, $5 per M-3 task; the
OpenCode runs bill P-01's OpenRouter account (stop at 40 USD, Q-opencode-01), Copilot CLI runs bill AI Credits, and Claude Code evals run on the Claude Max subscription with `--auth subscription` (C002-T-060)).

## 4. What the new modules will import (new dependants of existing code)

| New module (component) | Existing code it will depend on | Consequence |
|---|---|---|
| `src/mcp/server.ts`, `src/mcp/*` (C002-COMP-005) | `decideBash`, `tokenise`, `decidePath`, `findWorkspace`, the quick-lint engine, `findCommand`/the CLI as a child process | any signature change of the guard cores or the quick-lint API now breaks a second shipped program; `build.mjs` bundles both from one tree |
| `scripts/generate/*` (C002-COMP-001) | frontmatter parser, hashing, path helpers of `src/` (C002-ADR-003) | `src/model/frontmatter.ts` and `src/io/*` gain a build-time consumer |
| `hook guard --host copilot` (C002-COMP-012) | `parseHookInput`, both cores | new input mapping, same cores |
| `tests/replay/*`, `evals/harness/runners/*` | the corpora JSON, `decideBash`/`decidePath` (for Claude), `src/mcp` (server), the generated packages | corpus format becomes a shared contract (section 2, BR-17) |
| `scripts/release-check.mjs` | generator modules, replay reports | none on existing code |

## 5. Questions the blast radius raises for the planner

1. **Writing-command table: one source.** Derive it from `COMMANDS` (add a `writes` marker per row and
   read it in the guard) or keep the table in `guard-bash.ts` and add a test that fails when a `COMMANDS`
   row is missing from it. The second keeps `guard-bash.ts` free of an import from `commands.ts`
   (which imports it). Not a P-01 decision.
2. **Where the repository-root helper lives** (shared by the guard and ERR-CLI-020), and whether
   `findWorkspace` stays the workspace rule for `decidePath` (the spec says yes).
3. **Second bundle location** outside `plugins/architect/scripts/` (for example `build/` or the npm
   staging folder) and who copies it; `smoke.test.ts` pins the plugin folder.

## Evidence

- **E-1** `src/hooks/guard-bash.ts:119` › `sddCli()` — first word must be `node` (l.120); accepts the literal `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs` (l.123) or a script named `sdd.mjs` outside `.sdd/` (l.125-130); its only two references are the two uses in the `allowed` expression of `decideBash` (l.221). A bare `sdd` matches no branch and gets `GUARD-BASH-001`.
  - layer: serena (find_referencing_symbols) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/hooks/guard-bash.ts:208` › `decideBash()` — referenced by `guardBash` (`src/cli/commands.ts:435`) and `tests/guards/bash-corpus.test.ts:46`; calls `tokenise` (l.217) and the five matchers (l.221); imports `findWorkspace`, `isCommand`, `normalisePath`, `pathKey`, `realPath` (l.9-11).
  - layer: serena · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/hooks/guard-bash.ts:133` › `VERSION_PROBES` — six exact probes, `node -v` but not `node --version`; `versionProbe` (l.134) matches word count and second word; its only reference is l.221. Corpus BG-166 (`node --version --eval=x`, deny) and the `version` category (13 cases, 6 allow and 7 deny) pin it.
  - layer: serena + grep (corpus read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-4** `src/hooks/guard-bash.ts:23` › `tokenise()` — exported; single reference `decideBash` l.217; bash and PowerShell dialects; `|` splits segments in bash only.
  - layer: serena · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-5** `src/cli/commands.ts:426` › `guardPath()` — with `guardBash` (l.434), `hookSessionStart` (l.455) and `hookPostWrite` (l.461) the four stdin-JSON entry points; each calls `parseHookInput(ctx.stdin())`. `parseHookInput` has these four references plus `tests/guards/bash-corpus.test.ts:46` and `tests/guards/fixture.ts:135`.
  - layer: serena · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-6** `src/hooks/guard-path.ts:45` › `decidePath()` — references: `guardPath` (`commands.ts:427`), `tests/guards/fixture.ts:135`; returns allow when `isArchitectAgent` is false (l.46); `findWorkspace` for the repository (l.52); real-path checks l.69-74; `WRITE_TOOLS` at l.18, memory folder at l.56. Tests that run it through the bundle: `cap11/TS-1103`, `TS-1104`, `TS-1105`.
  - layer: serena · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-7** `src/hooks/input.ts:25` › `isArchitectAgent()` — referenced by `decideBash` (`guard-bash.ts:210`) and `decidePath` (`guard-path.ts:46`) only.
  - layer: serena · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-8** `src/cli/commands.ts:481` › `COMMANDS` — 28 rows from `init` (l.481) to `version` (l.508); `hook session-start`/`hook post-write` (l.503-504); `serena-launch` (l.505, positional `plugin-data-dir`, `rest: true`); `serena-config` (l.506); `extract-features` (l.507, no `run`); `version` (l.508). Its references: `run.ts:8`, `GROUPS` (`run.ts:31`), `findCommand` (l.37, l.42), `topHelp` (l.55-56), and `tests/integration/cli/frontend.test.ts:9,43,131`.
  - layer: serena + grep · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-9** `src/cli/run.ts:33` › `findCommand()` — first word, or first two for a group in `GROUPS` (l.36-44); single reference `runCli` l.83. `execute` (l.102) has one reference (`runCli` l.84) and resolves `--cwd` at l.133 for every command.
  - layer: serena · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-10** `src/workspace/serena-launch.ts:14` › `serenaLaunch()` — `writeSerenaConfig(dataDir)` (l.15), `spawnSync(command, args, { stdio: "inherit" })` (l.16); one production caller `serenaLaunchCmd` (`commands.ts:469`). `writeSerenaConfig` is referenced by `serenaLaunch` and `serenaConfig` (`commands.ts:420`).
  - layer: serena · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-11** `src/workspace/templates.ts:32` › `defaultPluginRoot()` — `CLAUDE_PLUGIN_ROOT`, else the folder above the bundle; only reference `templatesDir` (l.39). `resolveTemplate` (l.58) is called by `createChange` (`change.ts:75`), `planUpgrade` (`upgrade.ts:119`) and tests; `listTemplates` (l.44) by `templates.test.ts` and `cap01/TS-123.test.ts:21`.
  - layer: serena · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-12** `src/workspace/templates.ts:58` › `resolveTemplate()` — joins `rel.split("/")` onto `<templates>/<profile>` and checks `existsSync` only (l.59-65); no normalisation, real-path or `..` check.
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-13** `src/version.ts:5` › `TOOL` — `architect-plugin@${VERSION}`, `VERSION` from `__SDD_VERSION__` (l.2-4); defined by `scripts/build.mjs:28` and `scripts/test.mjs:42` from the root `package.json`; `tests/smoke.test.ts:12-26` asserts `sdd version` output, a one-file `scripts/` folder and `plugin.json` version equal to `package.json`.
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-14** `scripts/build.mjs:15` › - — removes all files of `plugins/architect/scripts/` except `sdd.mjs`; bundles only `src/cli.ts` (l.20); `bundledPackages(root, result.metafile)` for one metafile (l.43); writes `THIRD_PARTY_NOTICES.md` (l.49).
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-15** `scripts/package.mjs:41` › - — `cpSync(plugins/architect → stage/plugins/architect, recursive)` with no filter; INSTALL.md is Claude-only (l.42-76); version read from `plugin.json` (l.13).
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-16** `scripts/check/path.mjs:12` › - — scans every `.md`, `.json`, `.yml`, `.txt` under `plugins/architect/` outside `scripts/` for drive-letter and `/Users/`, `/home/` paths; `layout.mjs:12-13` counts exactly 10 `sdd-*.md` in `agents/`; `dup.mjs:28-29` reads `commands/` and `agents/`; `port.mjs:13` reads `skills/` and `templates/`; `size.mjs:15,21` reads `skills/` and `agents/`; `lib.mjs:15-16` fixes the CHG-001 interface and task folders.
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-17** `scripts/test.mjs:24` › - — `findTests` collects every `*.test.ts` under `tests/` except folders named `fixtures` (l.12-18); the run preloads `tests/no-network.mjs` into the test process and, through `NODE_OPTIONS`, into every child process (l.52-57); `tests/no-network.mjs:20-30` makes `net.connect`, `tls.connect`, `dns.*`, `http.request/get`, `https.*` and `fetch` throw and log, and the run fails when the log is not empty (l.58-62).
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-18** `evals/harness/session.mjs:21` › `runSession()` — importers `evals/harness/run.mjs`, `evals/harness/assert.mjs`, `evals/cap10/carto.mjs`; the only SDK import is at l.4.
  - layer: grep · confidence: medium
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-19** `plugins/architect/agents/sdd-conductor.md:19` › - — `The CLI is node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" (written sdd below)`; same spelling at `agents/sdd-auditor.md:13` and `skills/sdd-conventions/SKILL.md:13`; `${CLAUDE_PLUGIN_ROOT}/templates` at `agents/sdd-spec-writer.md:19`, `commands/decide.md:18`, `commands/init.md:25`; `${CLAUDE_PLUGIN_DATA}` at `commands/doctor.md:8` and `commands/init.md:9`; `AskUserQuestion` at `agents/sdd-conductor.md:7,61,66`, `commands/archive.md:15`, `skills/interview-protocol/SKILL.md:121,127`; the guard line at l.6 of the 13 commands.
  - layer: grep · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-20** `tests/guards/bash-corpus.json:157` › `BG-019` — `node "{sdd}" lint 001 --cwd C:/Users/x/repo`, expect allow, the only corpus command with `--cwd`; `BG-044` (`npx sdd lint`, deny GUARD-BASH-001); no corpus command starts with a bare `sdd` or runs `serena-config`/`serena-launch`; 277 cases, 43 in the `sdd` and `version` categories.
  - layer: grep (file read) · confidence: medium (pattern search over the file; the case list was not read end to end)
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
