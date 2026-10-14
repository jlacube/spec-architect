---
id: C002-SPEC-CTX-04
artifact: spec/context/current-state
change: CHG-002
phase: 10-spec
status: draft
kind: brownfield
---

# Current state — what the CHG-002 deltas modify

CHG-002 is **brownfield**: requirements that change CHG-001 behaviour are `MODIFIED` and cite the
CHG-001 requirement they change (C002-DEC-008: CHG-001 is not archived yet, LINT-DELTA-001 is waived at
G2/G3). The living specs in `.sdd/_living/` are inventory only and hold no requirements, so the
requirement IDs below come from `.sdd/001-architect-agent-suite/10-spec/`.

This file builds on, and does not repeat, `.sdd/002-multi-platform-targets/00-ideation/evidence/baseline-survey.md`
(the counts of Claude-specific constructs, the generator module sketch, the test list). Entries `E-n`
below are new; `baseline E-n` refers to that survey.

Evidence taken at commit `8623d49` (source tree identical to `74fe494` for the files cited; only `.sdd/`
is modified). Layers: Serena (symbol overviews and references for `src/hooks/` and `src/workspace/`), grep
and file reads for scripts and JSON. ripwire is absent (`ripwire --version` exit 127), so every entry
carries `ripwire failed: exit 127`. LSP and ast-grep were not needed.

## 1. Component table

| Component | Files (entry point) | Owning CHG-001 requirements | Current behaviour | Why CHG-002 touches it |
|---|---|---|---|---|
| Plugin packaging | `scripts/package.mjs` (`npm run package`), `scripts/build.mjs` (`npm run build`), `package.json`, `.claude-plugin/marketplace.json` | C001-REQ-1101 (layout), C001-REQ-1102 (marketplace), C001-REQ-1113, C001-REQ-1114 (notices and license allowlist, enforced in `build.mjs`), C001-REQ-1117 (package runs the checks). **No requirement owns `npm run package` or `dist/` itself** (E-1) | `build.mjs` bundles `src/cli.ts` to `plugins/architect/scripts/sdd.mjs`, deletes every other file in that folder, fails on a non-allowlisted license, rewrites `THIRD_PARTY_NOTICES.md`. `package.mjs` runs build and the structure checks, stages `.claude-plugin/marketplace.json` and `plugins/architect/` under `dist/architect-<version>/`, writes a Claude-only `INSTALL.md`, runs `claude plugin validate` (skipped when `claude` is absent), writes two zips. `package.json` is `private: true` with no `bin` | New per-target staging and install notes; an npm package for the CLI; a generator must write outside `plugins/architect/scripts/` |
| Path guard core | `src/hooks/guard-path.ts` `decidePath` (l.45), `src/hooks/input.ts` (`HookInput`, `isArchitectAgent` l.25); entry point `guardPath` `src/cli/commands.ts:427`, registered as `guard-path` (l.501), wired in `hooks/hooks.json` PreToolUse `Write\|Edit\|NotebookEdit` | C001-REQ-1103 (path guard, `GUARD-PATH-001`), C001-REQ-1104 (normalisation); contract C001-IF-07 §1-§2 | Pure function of `HookInput`. Allows every caller whose `agent_type` does not start with `architect:sdd-`. For an Architect agent and a tool in `WRITE_TOOLS` (Write, Edit, MultiEdit, NotebookEdit; l.18) it allows only `.sdd/` and `.claude/agent-memory/<agent_type with ':' replaced by '-'>` (l.56) after lexical, real and physical resolution, link and hard-link checks; denies on doubt | The core stays unchanged (G-5). Open for deltas: identity supplied by a per-target adapter; the memory folder has no counterpart on the new targets (C002-DEC-009). C001-REQ-1103 names Write, Edit and NotebookEdit; the code also gates MultiEdit (E-4) |
| Bash guard core and the CLI allowlist entry | `src/hooks/guard-bash.ts` `decideBash` (l.208), `sddCli` (l.119), `VERSION_PROBES` (l.133); entry point `guardBash` `src/cli/commands.ts:435` (`guard-bash`, l.502), wired in `hooks.json` PreToolUse `Bash\|PowerShell` | C001-REQ-1106 (allowlist, `GUARD-BASH-001`), C001-REQ-1107 (compound commands, `GUARD-BASH-002`); contract C001-IF-07 §3 (row "sdd CLI", row "tool versions"). Open defect D-011 (ref C001-REQ-1106) | Pure function of `HookInput`. The first segment must match `sddCli` (only `node <path>/sdd.mjs`, or the literal `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs`, never inside `.sdd/`), a version probe, a ripwire read verb, `ast-grep run --pattern`, or `git <read verb>`; PowerShell accepts only `sddCli` and version probes. A bare `sdd …` falls through every matcher and is denied with `GUARD-BASH-001` (E-5). `VERSION_PROBES` lists `node -v` but not `node --version` (E-6) | Specified change: accept a bare `sdd …` (G-4, G-5) and, with D-011, `node --version`; new corpus cases; `ALLOWED` text (l.16-17) and C001-IF-07 §3 follow |
| Hook entry points and output envelope | `src/cli/commands.ts` `guardPath` (l.427), `guardBash` (l.435), `hookSessionStart` (l.456), `hookPostWrite` (l.462); `src/hooks/post-write.ts`; `src/hooks/session-start.ts`; `plugins/architect/hooks/hooks.json` | C001-REQ-1121 (shell-agnostic hook commands), C001-REQ-1103, C001-REQ-1106; contract C001-IF-07 §2, §4 | Four stdin-JSON commands built on `parseHookInput`; exit 0 allow, 2 deny. Post-write prints Claude's `hookSpecificOutput` JSON. `hooks.json` holds 5 commands, each `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" <args>` (baseline E-4, E-12, E-13) | Where a per-target adapter flag or an MCP write server attaches; not changed for Claude Code |
| Serena launch | `src/workspace/serena-launch.ts` `serenaLaunch` (l.15), called only by `serenaLaunchCmd` `src/cli/commands.ts:469` (`serena-launch`, l.505); `src/workspace/serena-config.ts`; `plugins/architect/.mcp.json` (l.11-34); `plugins/architect/serena/architect-read-only.yml`; `scripts/check/mcp.mjs` | C001-REQ-1013 (launch through `sdd serena-launch`), C001-REQ-1006 (read-only launch, context `claude-code`), C001-REQ-1005 (no ripwire MCP), C001-REQ-1007, C001-REQ-1008 (Serena tool grants), C001-REQ-1108 (servers); contract C001-IF-14 §4 | `serenaLaunch(dataDir, args, command = "serena")` writes the Serena config under `dataDir`, then runs `serena` with inherited stdio and returns its exit code; it prints nothing on stdout. Nothing Claude-named in the code (E-7). The Claude spelling lives in `.mcp.json`: `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`, `--context claude-code`, `SERENA_HOME` | The launcher is reusable as is: a target passes its own data folder and Serena context. The context names and the read-only mode on other hosts are not established by the repository (baseline §4 note 6) |
| Structure checks | `scripts/check/run.mjs` (14 checks, l.19), `scripts/check/lib.mjs` (`context`, l.10), `scripts/check.mjs` (`npm run check`, 6 steps l.15-36), `scripts/check/{layout,tools,mcp,hooks,port,size,dup,evals,path,readme,rules,ci}.mjs` | C001-REQ-1117 (`npm run check`), C001-REQ-1101 (PLG-LAYOUT-001), C001-REQ-1108 and C001-REQ-1006 (PLG-MCP-001), C001-REQ-1121 (PLG-HOOK-001), C001-REQ-1118 (PLG-PORT-001), C001-REQ-1122 (PLG-DUP-001), C001-REQ-1116 (PLG-EVAL-001), C001-REQ-1120 (PLG-PATH-001), C001-REQ-1115 (PLG-README-001), C001-REQ-1119 (PLG-CI-001), C001-NFR-105 (PLG-SIZE-001), C001-NFR-204 and C001-REQ-217 (PLG-TOOLS-001), C001-NFR-503, C001-NFR-601, C001-NFR-402 (rules, msg, PORT-002); catalogue C001-IF-08 §3 | Every check receives one `ctx` (`repo`, `plugin`, `interfaces`, `tasks`) and reads only `plugins/architect/` plus the CHG-001 interface and task folders (E-8). `run.mjs` is a flat list: adding a target output means adding checks that take a different `plugin` root, or generalising `ctx`. `check.mjs` has no step for generated outputs. PLG-HOOK-001 and PLG-MCP-001 pin the Claude spelling; PLG-EVAL-001 expects `plugins/architect/evals/`, which does not exist and whose owner task C001-T-063 is `todo` (findings are `pending`) | New per-target structure checks (SC-4, SC-5) must not break these 14; PLG-TOOLS-001 and `taskStatus` read CHG-001 paths that move when CHG-001 is archived (baseline §4 note 7) |
| Eval harness | `evals/harness/session.mjs` `runSession` (l.21), `env.mjs`, `machines.mjs`, `metrics.mjs`, `assert.mjs`, `overlay.mjs`, `plugin-eval.mjs`, `plugin-cases.mjs`, `cases.mjs`; `npm run eval` (`package.json:17`) runs `evals/harness/run.mjs` | C001-REQ-1116 (delegation suite, in `plugin-eval.mjs`), C001-DOD-002 and the C001-CAP-02 scenarios (interview and gate behaviour run through `runSession`); decision C001-ADR-007 (plan). **No requirement owns the harness itself** (E-9) | `runSession` imports `query` from `@anthropic-ai/claude-agent-sdk` (l.4), loads the plugin as `{ type: "local" }`, selects a main-thread `agent`, answers `AskUserQuestion` through `canUseTool` (l.36-46), denies every other tool not in `allowTools`, records each SDK message with a time stamp, and caps turns (30) and spend (`maxBudgetUsd` 0.5). It is the only SDK import (baseline E-23) | A second runner (OpenCode, Copilot CLI per C002-DEC-003) must keep the case API; the cases' prompts and graders name `architect:<agent>` |

## 2. Gaps in CHG-001 ownership that the spec-writer must handle

1. **Packaging has no requirement of its own.** `npm run package`, `dist/` and the two zips appear in no CHG-001
   requirement, interface or ADR (searched `10-spec/` and `20-plan/`); only `README.md:69` and
   `scripts/package.mjs` describe them. A delta against packaging is therefore `ADDED`, not `MODIFIED`,
   unless the spec-writer attaches it to C001-REQ-1101 or C001-REQ-1102.
2. **The eval harness has no requirement of its own** (same search). Its owners are C001-REQ-1116 (suite
   content), C001-DOD-002 (scenarios) and C001-ADR-007 (design). New runners are `ADDED`.
3. **C001-REQ-1103 and the code differ slightly.** The statement lists Write, Edit and NotebookEdit; `WRITE_TOOLS`
   also holds MultiEdit. A `MODIFIED` delta on C001-REQ-1103 should quote the code's set.
4. **C001-REQ-1105 is retired** (tombstone, see C001-REQ-1123 rationale); do not reuse the number.
5. **Interface text moves with the code.** The allowlist row "sdd CLI" and the row "tool versions" of C001-IF-07 §3,
   the `ALLOWED` text in `guard-bash.ts:16-17`, and the first paragraph of `guard-bash.ts` all state `node <path>/sdd.mjs`.
6. **Guard tests that pin today's behaviour:** `tests/guards/bash-corpus.test.ts` (277 cases),
   `tests/guards/path-corpus.test.ts` (256 cases), `tests/integration/cap11/TS-1103` to `TS-1108` (baseline §3.2, E-24).
   A bare `sdd …` or `node --version` is currently a deny case if any corpus entry covers it; not searched case by case.

## Evidence

- **E-1** `scripts/package.mjs:33` › - — `npm run package` runs build and the structure checks, stages `.claude-plugin/marketplace.json` and `plugins/architect/` into `dist/architect-<version>/` (l.39-41), writes a Claude-only `INSTALL.md` (l.42-76), runs `claude plugin validate` on plugin and marketplace as optional steps (l.78-79), and zips the plugin alone and the marketplace folder (l.98-103); the version is read from `plugin.json` (l.13). A text search for `package.mjs`, `npm run package` and `dist/` finds no CHG-001 requirement or interface (only `README.md:69` and the repository inventory).
  - layer: grep (file read) · confidence: high for behaviour, medium for the absence of an owning requirement
  - commit: 8623d49 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `scripts/build.mjs:15` › - — deletes every file in `plugins/architect/scripts/` except `sdd.mjs` (l.15-17), bundles `src/cli.ts` (l.19-40), fails on a non-allowlisted license (l.43-48) and rewrites `THIRD_PARTY_NOTICES.md` (l.49); comments cite C001-ADR-002, C001-CON-02, C001-REQ-1113, C001-REQ-1114.
  - layer: grep (file read) · confidence: high
  - commit: 8623d49 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `package.json:4` › - — `private: true`, no `bin`; scripts `build`, `test`, `check`, `bench`, `eval`, `eval:report`, `package` (l.11-20); `devDependencies` only.
  - layer: grep (file read) · confidence: high
  - commit: 8623d49 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-4** `src/hooks/guard-path.ts:18` › `WRITE_TOOLS` — Write, Edit, MultiEdit, NotebookEdit; `decidePath` (l.45) returns allow at once when `isArchitectAgent` is false (l.47); allowed folders `.sdd` and `.claude/agent-memory/<agent_type with ':' → '-'>` (l.56). `decidePath` and `isArchitectAgent` have the callers listed in baseline E-9 and E-10.
  - layer: serena (symbols overview) + grep (file read) · confidence: high
  - commit: 8623d49 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-5** `src/hooks/guard-bash.ts:119` › `sddCli()` — returns false unless the first word is `node` (l.120); accepts the literal `"${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"` (l.123) or a script whose file name is `sdd.mjs` outside `.sdd/` (l.125-130). Its only references are two uses in `decideBash` at l.220 (Serena `find_referencing_symbols`). In that expression a bare `sdd` matches no other branch (`ripwire`, `astGrep`, `gitRead`, `versionProbe`), so `decideBash` returns the `GUARD-BASH-001` deny (l.222-224).
  - layer: serena · confidence: high
  - commit: 8623d49 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-6** `src/hooks/guard-bash.ts:133` › `VERSION_PROBES` — `node -v`, `git --version`, `claude --version`, `serena --version`, `ast-grep --version`, `uv --version`; `versionProbe` (l.134) matches exact word count and second word, so `node --version` is denied. Matches the text of defect D-011 (`.sdd/001-architect-agent-suite/change.md:23`).
  - layer: grep (file read) · confidence: high
  - commit: 8623d49 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-7** `src/workspace/serena-launch.ts:15` › `serenaLaunch()` — calls `writeSerenaConfig(dataDir)` then `spawnSync(command, args, { stdio: "inherit" })`; single production caller `serenaLaunchCmd` at `src/cli/commands.ts:469`. The only `CLAUDE_PLUGIN_*` reference under `src/` outside comments is `process.env["CLAUDE_PLUGIN_ROOT"]` at `src/workspace/templates.ts:33` and the pattern at `src/hooks/guard-bash.ts:123`.
  - layer: serena (references) + grep · confidence: high
  - commit: 8623d49 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-8** `scripts/check/lib.mjs:10` › `context()` — returns `repo`, `plugin` (`plugins/architect`), `interfaces` (`.sdd/001-architect-agent-suite/10-spec/50-interfaces`, l.15) and `tasks` (`.sdd/001-architect-agent-suite/20-plan/50-tasks`, l.16); `taskStatus` (l.73) turns a check's findings into `pending` while its owner task is not done (`run.mjs:21-33`). `scripts/check.mjs:15-36` defines 6 steps: typecheck, validate (`claude plugin validate` on `plugins/architect` and `.`), build, tests, fixtures, structure.
  - layer: grep (file read) · confidence: high
  - commit: 8623d49 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-9** `evals/harness/session.mjs:21` › `runSession()` — options `pathToClaudeCodeExecutable` (l.29), `plugins` as `{ type: "local" }` (l.30), `settingSources: []` (l.31), Claude Code preset system prompt (l.33), `maxTurns` 30 and `maxBudgetUsd` 0.5 defaults (l.21), `canUseTool` answering `AskUserQuestion` and denying tools outside `allowTools` (l.36-50). Six harness files cite a C001 requirement or task id (`plugin-eval.mjs`, `plugin-cases.mjs`, `overlay.mjs`, `machines.mjs`, `env.mjs`, `assert.mjs`); the CHG-001 spec text mentions the harness only as the place scenarios run (`70-dod.md:32`, `CAP-02-conductor/acceptance.md:14`).
  - layer: grep (file read) · confidence: high for behaviour, medium for the absence of an owning requirement
  - commit: 8623d49 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-10** `plugins/architect/.mcp.json:11` › `serena` — `command: node`, args begin `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs serena-launch ${CLAUDE_PLUGIN_DATA} --`, then `start-mcp-server --context claude-code --mode planning --mode ${CLAUDE_PLUGIN_ROOT}/serena/architect-read-only.yml --project .` and the two dashboard flags set to `False`; `env.SERENA_HOME` is `${CLAUDE_PLUGIN_DATA}/serena`. `scripts/check/mcp.mjs:8` pins `--context claude-code` and l.24-28 pin the launcher prefix and `SERENA_HOME`.
  - layer: grep (file read) · confidence: high
  - commit: 8623d49 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-11** `scripts/check/hooks.mjs:7` › `PREFIX` — every `hooks.json` command must start with `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" `; operators `&&`, `||`, `;`, `|`, `>`, `<`, `$(` and a backtick are rejected (l.8, l.22). `plugins/architect/hooks/hooks.json` holds five such commands (lines 7, 11, 17, 23, 28).
  - layer: grep (file read) · confidence: high
  - commit: 8623d49 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-12** `scripts/check/evals.mjs:13` › `check()` — reads `plugins/architect/evals/<case>/prompt.md` and `graders/*.md`; requires 40 prompts, 3 must-route per agent and 1 must-not per agent; owner `C001-T-063` (l.11), whose file has `status: todo`. A glob for `plugins/architect/evals/*/prompt.md` returns no file, so the check reports `pending` findings today.
  - layer: grep (file read) + glob · confidence: high
  - commit: 8623d49 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-13** `scripts/check/layout.mjs:6` › `PATHS` — requires 11 paths under `plugins/architect/` (including `.claude-plugin/plugin.json`, `hooks/hooks.json`, `.mcp.json`, `scripts/sdd.mjs`), exactly 10 `sdd-*.md` agents (l.12-13) and a `SKILL.md` in each skill folder (l.14-15). A generated target output cannot live under `plugins/architect/agents/`.
  - layer: grep (file read) · confidence: high
  - commit: 8623d49 · pattern: -
  - disclosures: ripwire failed: exit 127
