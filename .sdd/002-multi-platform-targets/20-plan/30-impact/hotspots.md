---
id: C002-PLAN-IMPACT-03
artifact: plan/impact/hotspots
change: CHG-002
phase: 20-plan
status: draft
---

# CHG-002 — Hotspots among the touched files

Churn and size of the files that `blast-radius.md` lists, with the risk each carries for the plan.

## 1. Method and disclosures

- Commit `85bee21`. **ripwire is absent** (exit 127), so `ripwire --hotspots` was not available; churn
  is **git log based** (`git log --name-only` over the touched paths, counted per file with `sort |
  uniq -c`) and size is the line count of the file (Grep count mode). Every entry carries
  `ripwire failed: exit 127`. Complexity was not measured (no tool for it on the ladder); fan-in comes
  from the Serena references in `blast-radius.md`.
- **The history is short.** The repository has 188 commits, all between 2026-10-10 and 2026-10-14, the
  implementation of CHG-001. A count of 18 commits is a high rate here, but an absolute count of 2 does
  not mean "stable". Read churn together with defect history: five CHG-001 defects (D-007 … D-011) are
  fixes in the touched files (section 3).
- Counts are commits that touched the file since the first commit. Generated files
  (`plugins/architect/scripts/sdd.mjs`, `THIRD_PARTY_NOTICES.md`, `evals/results/*`) are left out.

## 2. Ranking

Order: churn first, then size, then how many CHG-002 components change the file. "Fan-in" is the number
of direct references found in `blast-radius.md`.

| Rank | File | Commits | Lines | Fan-in | CHG-002 components | Risk carried |
|---|---|---|---|---|---|---|
| 1 | `src/cli/commands.ts` | **18** (highest of all `src/`) | **533** (largest source file) | 5 | C002-COMP-018, C002-COMP-012 | The registry of 28 commands, about 35 functions and the hook entry points sit in one file. CHG-002 adds 5 rows, 3 options and the Copilot hook adapter entry points here; every task that adds a command edits it, so parallel tasks conflict. Last touched 2026-10-13 (`5c21ea0`, Serena launcher) |
| 2 | `tests/integration/cli/frontend.test.ts` | **11** | 166 | — | C002-COMP-013 | Three assertions are coupled to CHG-001 files and to `COMMANDS` (catalogue mirror, command list, per-command traces); each CHG-002 command or error code edits it (regression-set E-23, E-31) |
| 3 | `tests/integration/cli/helpers.ts` | 7 | — | 66 test files | C002-COMP-013 | `runBundled`/`runInProcess`/`makeWorkspace` are used by 141 call sites; a change of their environment (for example the `CLAUDE_PLUGIN_DATA` stub for the guard) reaches every CLI test |
| 4 | `scripts/test.mjs` | 5 | 64 | all tests | C002-COMP-013 | Version define, test discovery and the network preload for every child process; the replay and MCP tests meet its rules first |
| 5 | `package.json` | 5 | 28 | all scripts | C002-COMP-013 | Gains devDependencies (MCP SDK pinned exactly, OpenCode SDK), possibly `files`/`bin` for `architect-sdd` in a separate manifest; the version equals `plugin.json` by test |
| 6 | `plugins/architect/commands/init.md` | 5 | 29 | 1 (read by the generator) | C002-COMP-015 | Carries `${CLAUDE_PLUGIN_DATA}` (l.9) and `${CLAUDE_PLUGIN_ROOT}` (l.25); both need variants; edited five times for CHG-001 defects |
| 7 | `plugins/architect/agents/sdd-conductor.md` | 4 | 73 (largest agent) | 1 | C002-COMP-014 | Holds `AskUserQuestion`, the CLI spelling and the `Agent(` allowlist; any text edit re-opens Claude evals |
| 8 | `plugins/architect/.mcp.json` and `scripts/check/mcp.mjs` | 4 / 3 | — / — | pinned by `TS-1007`, `TS-1109` | C002-COMP-017 | Serena launch spelling changed in 4 commits (D-008 `--project .`, D-009/D-010 launcher); the Claude pin must stay while per-target Serena entries are added in `targets/` |
| 9 | `src/io/paths.ts` | 4 | — | both guards, `isInside` | C002-COMP-012 | Path resolution used by `decidePath` and `decideBash`; the Serena and `--cwd` rules and the repository-root helper reuse `normalisePath`, `pathKey`, `realPath` |
| 10 | `evals/harness/session.mjs` | 4 | 76 | 3 importers | C002-COMP-009 | The only SDK import and the `AskUserQuestion` interception; host selection must not change its signature |
| 11 | `scripts/build.mjs` | 3 | 51 | 5 scripts and tests | C002-COMP-013 | Wipes `plugins/architect/scripts/` except `sdd.mjs`; gains a second entry, a version source switch and a licence check over two metafiles |
| 12 | `src/cli/run.ts` | 3 | 143 | all invocations | C002-COMP-018 | Dispatch, `GROUPS`, global `--cwd`; gains `--version` and relies on the `findCommand` rule for the writing-command table |
| 13 | `src/hooks/guard-bash.ts` | 2 (created 2026-10-11, `794d13e`; structure-check pass `99e5352`) | 229 | 2 | C002-COMP-012 | Low churn, high consequence: the only barrier on Claude Code; the file has an open defect (D-011, `node --version`) and gains about four rule blocks (section 3). 5th largest source file (baseline §3) |
| 14 | `src/hooks/guard-path.ts` | 2 (`3e2aa18`, `13146b3`) | 82 | 2 | C002-COMP-012 | One new option; the memory-folder rule was itself a defect fix (D-007) |
| 15 | `scripts/package.mjs` | 2 | 104 | 1 | C002-COMP-013 | Written in two post-CHG-001 `build:` commits, outside any task; no requirement owned it before CHG-002 (current-state §2 gap 1); the Claude `INSTALL.md` text is inline |
| 16 | `tests/guards/path-corpus.json`, `bash-corpus.json` | 2 / 1 | 2,309 / 2,391 | corpus tests, bench, replay | C002-COMP-013, C002-COMP-008 | Largest data files in the repository; the replay suite becomes a second consumer, so a format change touches both readers |
| 17 | `plugins/architect/skills/{interview-protocol,gate-protocol,code-discovery,sdd-conventions}/SKILL.md` | 3 / 1 / 1 / 1 | 128 / 96 / 115 / 136 | 1 each | C002-COMP-016 | Hold the four wiring sections and the toolchain record; edited during CHG-001 defect fixes; skill budgets (24,000 characters, PLG-SIZE-001) apply |
| 18 | `plugins/architect/commands/doctor.md` | 2 | 39 | `TS-1116`, evals | C002-COMP-015 | Eight-row table and nine-row remedies table checked by `TS-1116` and the doctor evals |
| 19 | `scripts/check.mjs`, `scripts/check/*.mjs` | 1 / 1-3 each | 50 / 20-100 | `npm run check` | C002-COMP-007 | Recent (2026-10-12, `99e5352`); several checks fix CHG-001 paths (`lib.mjs:15-16`) |
| 20 | `src/workspace/templates.ts`, `serena-launch.ts`, `serena-config.ts` | 1 / — / — | 77 / 20 / 46 | 2-3 each | C002-COMP-018 | Small and single-purpose; `resolveTemplate` has no path confinement, which `template show` needs |

## 3. Risk reading

1. **`guard-bash.ts` is the file where a small edit costs most.** It has two commits, 229 lines and one
   open defect, and it is what makes `Bash` safe for ten agents on Claude Code. The plan adds the bare
   `sdd` form, an exact `node --version` probe, Serena-command confinement with a repository-root
   search, the writing-command table with the `--cwd` rule, and an environment read. Treat these as
   four tasks, not one, each with its corpus cases written first (C002-REQ-607), and run
   `npm test -- tests/guards` and `npm run bench` after each.
2. **`commands.ts` is the integration hotspot.** 18 commits of 188 total touch it, and it is 533 lines.
   Splitting the new commands into new modules registered by one line each keeps the conflicts to the
   `COMMANDS` array and lowers the risk for parallel tasks. Not a requirement; a plan choice.
3. **Defects live in the touched files.** The CHG-001 defects recorded as fixes in these files are D-007
   (memory folder in `guard-path.ts`, `13146b3`), D-008 (`--project .` in `.mcp.json`, `ed8f69e`), D-009
   and D-010 (opt-in commit and Serena launcher, `5c21ea0`: `commands.ts`, `serena-launch.ts`,
   `.mcp.json`, `init.md`, `gate-protocol`) and D-011 (open, `node --version`, `guard-bash.ts`). The
   Serena launcher and the Serena/`--cwd` confinement therefore sit on the area with the most recent
   fixes.
4. **Two sources for one list.** The writing-subcommand names live in the spec table
   (C002-IF-008 §1.2), in `COMMANDS`, and will live in the guard. Churn on `commands.ts` makes drift
   likely; the plan should include the consistency test of `regression-set.md` §4.1.
5. **Build scripts are young and not task-owned.** `package.mjs` and the tail of `build.mjs` were
   written after the CHG-001 plan; only `build.mjs` has a requirement (C001-REQ-1113, C001-REQ-1114).
   CHG-002 adds the requirements (C002-REQ-413, C002-REQ-518, C002-REQ-519, C002-REQ-502) and the
   first tests for packaging, so expect the first failures in `package.mjs`, not in the generator.
6. **Test-harness files with fan-in.** `tests/integration/cli/helpers.ts` (7 commits) and
   `scripts/test.mjs` (5) are test infrastructure used by every suite; changes there run through all
   1,000-plus tests, so keep their edits additive (new options, new helpers).
7. **The executable lookup reaches CHG-001 code** (added for the D-018 … D-020 critic follow-up;
   C002-CON-17, C002-T-065). The shared resolver lands in `src/io/paths.ts` (rank 9, both guards) and
   the starts it serves sit in `serena-launch.ts` (rank 20), `src/mcp/tools/shell.ts`,
   `src/cli/host-version.ts` and CHG-001's `src/gate/gate.ts` and `src/gate/commit.ts`, which were not
   ranked because CHG-002 did not touch them at `85bee21`. Add the resolver beside the guards'
   functions without editing them, move one start at a time, and keep CHG-001's gate tests unedited
   (`regression-set.md` §4.6; C002-RISK-035).

## Evidence

- **E-1** `src/cli/commands.ts:1` › - — 533 lines, 18 commits (highest of the files counted), 28 rows in `COMMANDS` (l.481-508), last commit `5c21ea0` on 2026-10-13; ranked first of the touched files by commits, and the largest file under `src/` (next: `src/workspace/status.ts`, 231 lines; `src/hooks/guard-bash.ts`, 229 lines).
  - layer: grep (git log `--name-only` counted with `sort | uniq -c`; Grep count mode for lines) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/hooks/guard-bash.ts:1` › - — 229 lines; commits `794d13e` (2026-10-11, creation) and `99e5352` (2026-10-12); defect D-011 open on it (`.sdd/001-architect-agent-suite/change.md:23`, text matched by current-state E-6).
  - layer: grep (git log) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/hooks/guard-path.ts:1` › - — 82 lines; commits `3e2aa18` (2026-10-11) and `13146b3` (2026-10-12, "Path guard allows the agent's own memory folder (D-007)"); `src/hooks/input.ts` 1 commit, 27 lines.
  - layer: grep (git log) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-4** `tests/integration/cli/frontend.test.ts:1` › - — 166 lines, 11 commits; `tests/integration/cli/helpers.ts` 7 commits; `scripts/test.mjs` 5 commits, 64 lines; `package.json` 5 commits.
  - layer: grep (git log) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-5** `scripts/package.mjs:1` › - — 104 lines, 2 commits (`8c2ee72`, `0c5ade3`, both 2026-10-12, subject prefix `build:` and not a numbered CHG-001 task); `scripts/build.mjs` 3 commits, 51 lines; `scripts/check.mjs` 1 commit, 50 lines (`99e5352`).
  - layer: grep (git log) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-6** `plugins/architect/.mcp.json:1` › - — 4 commits with `scripts/check/mcp.mjs` 3; `ed8f69e` ("Serena launched with --project ." D-008) and `5c21ea0` (D-009, D-010); `commands/init.md` 5 commits, 29 lines; `agents/sdd-conductor.md` 4 commits, 73 lines; `commands/doctor.md` 2 commits, 39 lines.
  - layer: grep (git log) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-7** `tests/guards/bash-corpus.json:1` › - — 2,391 lines, 1 commit (`794d13e`); `tests/guards/path-corpus.json` 2,309 lines, 2 commits; `tests/guards/fixture.ts` 137 lines, 2 commits.
  - layer: grep (git log, Grep count mode) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-8** `evals/harness/session.mjs:1` › - — 76 lines, 4 commits; `evals/harness/overlay.mjs` 122 lines, 5 commits; `evals/harness/run.mjs` 114 lines, 6 commits.
  - layer: grep (git log, Grep count mode) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-9** `src/io/paths.ts:1` › - — 4 commits; `src/cli/run.ts` 3 commits, 143 lines; `src/cli.ts` 3 commits; `src/workspace/templates.ts` 1 commit, 77 lines; `src/workspace/serena-launch.ts` 20 lines; `src/workspace/serena-config.ts` 46 lines.
  - layer: grep (git log, Grep count mode) · confidence: medium (per-file commit counts for `serena-launch.ts` and `serena-config.ts` were not isolated)
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
