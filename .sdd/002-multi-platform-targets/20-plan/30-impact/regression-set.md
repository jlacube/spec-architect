---
id: C002-PLAN-IMPACT-02
artifact: plan/impact/regression-set
change: CHG-002
phase: 20-plan
status: draft
---

# CHG-002 — Regression set

The existing tests, checks and evals that reach the code of `blast-radius.md`, split into those that
must stay green without edits and those the change is expected to edit. Rows cite the blast-radius
entries (`BR-n` rows of its section 2; `E-1` … `E-20` are its evidence entries) instead of repeating
them. The evidence of this file continues the numbering at `E-21`.

## 1. Method and disclosures

- Commit `85bee21`. **ripwire is absent** (exit 127), so `--test-gate` could not select tests; the set
  below comes from **Serena** references of the touched symbols (`find_referencing_symbols`, which
  returns test files that import or call them) and from **grep** over `tests/`, `scripts/`, `bench/`
  and `evals/` for the names, files and strings the change touches. Selection by grep is checked by
  reading the matched lines (confidence medium); it can miss a test that reaches a symbol only through
  the bundled CLI. For that reason section 2 also lists the whole-suite commands, which do not depend on
  the selection.
- Tests that run the bundled CLI (`runBundled`, 66 test files, 141 calls) reach every CLI symbol
  transitively. They are not listed one by one; they are covered by `npm test` (section 2).
- Evals are paid (the project memory records the API-key budget: about $0.50 per run, $5 per M-3 task,
  stop and discuss at $10 spent of the $20 top-up). The plan runs the named evals once per milestone,
  not per task.

## 2. Commands

All commands run from the repository root `C:\Sandbox\ClaudeCode\Architect` (Node 20 or later).

| Purpose | Command | Notes |
|---|---|---|
| Whole suite (build, then every `tests/**/*.test.ts`) | `npm test` | `scripts/test.mjs` bundles each test with esbuild and runs `node --test`; fails when a child process tries a network call (`tests/no-network.mjs`, E-27) |
| One area | `npm test -- <path substring>`, for example `npm test -- tests/guards`, `-- cap11`, `-- cap10`, `-- cap02`, `-- integration/cli`, `-- unit/workspace`, `-- smoke` | positional arguments filter by path substring (`scripts/test.mjs:20-26`) |
| Types | `npm run typecheck` | `tsconfig.json` covers `src/` and `tests/` today; C002-ADR-003 adds `scripts/generate` and `scripts/release` |
| Structure checks only | `node scripts/check/run.mjs` (or `node scripts/check.mjs --steps structure`) | 14 checks; `pending` findings do not fail |
| Lint fixtures | `node scripts/check.mjs --steps fixtures` | `tests/unit/lint/fixtures`, not touched by CHG-002 |
| Aggregate gate | `npm run check` | typecheck, `claude plugin validate` (skipped when Claude Code is absent), build, tests, fixtures, structure; the plan adds a target-structure step (C002-ADR-003) |
| Guard decision time | `npm run bench` (`bench/guards.mjs`) | C001-NFR-103: p95 over 50 recorded inputs ≤ 300 ms through the bundled CLI; every new guard rule (path resolution, git-root search, environment read) runs inside this budget |
| Packaging | `npm run package` | builds, runs the structure checks, stages and zips; after the change also generates and packs |
| Claude Code evals (paid) | `npm run eval`, or the named files of section 5 | only after the guard tasks are done, once per milestone |

## 3. Must stay green without edits

These tests encode behaviour CHG-002 must not change (Claude Code stays the source target,
C002-GOAL-05). A failure in any of them is a regression of the change, not an update.

| Test | What it pins | Reached through | Layer | Note |
|---|---|---|---|---|
| `tests/guards/path-corpus.test.ts` with `path-corpus.json` (256 cases) | `decidePath` on Claude Code input, memory folder on | BR-3, blast-radius E-6 | serena + grep | stays valid only if the new `memoryFolder` option defaults to on |
| `tests/guards/bash-corpus.test.ts` with `bash-corpus.json` (E-22) — the existing 277 cases | `decideBash`; the cases that sit next to the changed rules: **BG-019** (`lint 001 --cwd C:/Users/x/repo`, allow: `lint` writes nothing, so `--cwd` stays unrestricted), **BG-044** (`npx sdd lint`, deny: `sdd` must be the whole first word, C002-TS-504), **BG-166** (`node --version --eval=x`, deny), the `version` category (6 allow, 7 deny), **BG-016**, **BG-017**, **BG-018**, **BG-020** (`status --write`, `trace --write`, `gate approve`, `id next` without `--cwd`: allow) | BR-1, E-22 | grep (read) | no existing case flips (see section 4); the test file itself changes (section 4) |
| `tests/integration/cap11/TS-1103.test.ts`, `TS-1104`, `TS-1105` | `sdd guard-path` through the bundle: allow `.sdd/`, deny other paths, links and junctions, message text | BR-3 | serena | exercise the deny summary text; the memory-off wording (C002-IF-008 §5) must not leak into the default |
| `tests/integration/cap11/TS-1107.test.ts`, `TS-1108` | `sdd guard-bash` through the bundle: allowlist decisions, `head` only after a pipe | BR-1 | serena | the `Allowed:` summary changes in text (C002-IF-008 §1); `TS-1107:31` matches only the shape `^GUARD-BASH-001: Bash on .+ denied — .+\. Allowed: .+\.\n$`, so the new text keeps it green if it stays one line ending in a period |
| `tests/integration/cap11/hooks-feedback.test.ts` | post-write feedback envelope, session brief | BR-4 | grep | Claude envelope unchanged; the Copilot adapter is separate |
| `tests/integration/cap11/TS-1122.test.ts` | `hooks.json`: exactly 5 commands, prefix `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"`, events and matchers | BR-15 | grep | Copilot hooks live only in the generated package |
| `tests/integration/cap11/TS-1101.test.ts`, `TS-1110`, `TS-1113`, `TS-1119`, `TS-1121`, `TS-1123` | tree of the plugin, 10 agents, Context7 and DeepWiki scoped to the researcher, licence, PLG-PORT-001, PLG-PATH-001, PLG-DUP-001 | BR-12, BR-15 | grep | `TS-1121` and the PLG-PATH-001 rule apply to the new `targets/` folder too (blast-radius E-16) |
| `tests/integration/cap10/TS-1006`, `TS-1007`, `TS-1008`, `TS-1009`, `serena-tools.ts`, `serena-config.test.ts`; `tests/integration/cap11/TS-1109` | `.mcp.json` servers, `serena-launch ${CLAUDE_PLUGIN_DATA} -- start-mcp-server …`, read-only launch, Serena tool grants, `sdd serena-config data` creates and updates the config | BR-7 | grep + serena | `serena-config <folder>` with a positional folder keeps today's behaviour (C002-IF-007) |
| `tests/integration/cap02/TS-204`, `TS-205`, `TS-219`, `TS-220`, `agents-if09.test.ts`, `skills-portability.test.ts` | command inventory, PLG-DUP-001, conductor `Agent(` allowlist, no `Agent` in specialists, agent rows of C001-IF-09, skills name Claude tools only inside a wiring section | BR-15 | grep | source plugin text is unchanged (C002-CON-10); any prompt edit lands here |
| `tests/integration/cap11/TS-1116.test.ts` | README troubleshooting covers every doctor remedy (≥ 9 rows) | BR-15 | grep | stays green if `commands/doctor.md` is not edited; the new README sections must keep `readme.check` empty |
| `tests/unit/workspace/templates.test.ts`, `tests/integration/cap01/TS-123.test.ts` | every template of the two profiles resolves, renders and parses; the lite scaffold; `.sdd/_templates` override | BR-8 | serena | green if the `template` confinement is added beside `resolveTemplate`; see section 4 if it is inside |
| `tests/unit/io/paths.test.ts` | `normalisePath`, `pathKey`, `realPath`, 8.3 names, links | BR-1, BR-3 | serena | the guards' resolution code; the repository-root helper should be tested next to it |
| `tests/integration/cap11/TS-1118.test.ts` | `npm run check --steps validate,fixtures,structure` fails on a broken lint fixture and reports each step | BR-11 | grep | independent of a new step if the new step is not part of `structure` |
| `tests/security/secrets.test.ts`, `tests/integration/faults.test.ts`, `tests/integration/determinism.test.ts` | secret scan, fault handling, deterministic output of the bundled CLI | BR-6 | grep | reach the bundle; green with an unchanged core |
| Every other test through `runBundled`/`runInProcess` (lint, trace, gate, archive, tracking, workspace; `tests/integration/cap01` … `cap09`) | CHG-001 behaviour | BR-5, BR-6 | grep | no change expected; they fail only if the new `--version` branch or the new rows change command dispatch |
| `bench/guards.mjs` | guard p95 ≤ 300 ms | BR-1, BR-3 | grep | re-run after the guard tasks |

## 4. Expected to change

### 4.1 Guard corpora and their tests (C002-REQ-503, C002-REQ-517, C002-REQ-521, C002-REQ-607)

No existing bash-corpus case changes its expectation. Checked against the rules of C002-IF-008 §1:

- bare `sdd` accepted: no existing case starts with a bare `sdd`; `npx sdd lint` (BG-044) stays deny;
- `node --version` accepted: `node -v` (allow), `node -v -e x` and `node --version --eval=x` (deny)
  keep their expectation because the match is on the exact word count;
- Serena confinement: no existing case runs `sdd serena-config` or `sdd serena-launch` (`serena
  --version` and `serena start-mcp-server` are the Serena binary, not the CLI subcommand);
- `--cwd` confinement: BG-019 is a non-writing command (`lint`), so it stays allow; no existing case
  carries `--cwd` on a writing command.

What changes is **additions and the test harness**:

| File | Change | Why |
|---|---|---|
| `tests/guards/bash-corpus.json` | new cases: bare `sdd` allow and `npx sdd`/`sddx` deny (C002-TS-504); `node --version` allow; Serena commands with `--user-data`, an outside folder, an inside folder, the literal `${CLAUDE_PLUGIN_DATA}` and an unresolvable word (C002-TS-525, C002-TS-527, C002-TS-528); one case per writing subcommand (about 21 rows in C002-IF-008 §1.2: `init`, 4 `change`, 2 `id`, `status --write`, `trace --write`, `hook subagent-stop`, 2 `gate`, `stale check`, `task set`, 3 `defect`, `archive`, `extract-features`, the two Serena rows), each with a `--cwd` outside and a `--cwd` inside the root (C002-TS-536, C002-TS-636); PowerShell and Git Bash dialect cases | C002-REQ-607; the count is an estimate (confidence low) until the plan lists the cases |
| `tests/guards/bash-corpus.test.ts` | `BashCase` gains the fields the replay adapters need (a case-level `cwd`, an environment stub for `CLAUDE_PLUGIN_DATA`, applicability and `expected_source` per C002-IF-009 §2); `bashHookInput` writes `doc["cwd"] = repo` for every case today, so a case with its own `cwd` needs a new branch (E-21, l.28-37); the fixture repository (`mkdtempSync` + `.sdd`) has no `.git`, so the repository-root rule of C002-IF-008 §1.1 falls back to the `.sdd` folder — create a `.git` folder in the fixture to make the root deterministic | the guard reads its own environment and a root that the test controls |
| `tests/guards/path-corpus.json`, `path-corpus.test.ts`, `fixture.ts` | possible new cases for the memory-off option and for Copilot tool inputs; the default-on cases stay | C002-REQ-625 expects memory cases to deny on generated targets, which the replay adapters check, not this test |
| new tests next to the corpora | a test that every writing row of `COMMANDS` (or of the guard's table) appears in C002-IF-008 §1.2 and the reverse (blast-radius section 5, question 1) | guard and CLI keep two lists of subcommands |
| `bench/guards.mjs` | add recorded inputs for a Serena command and a writing command with `--cwd` | the new rules do file-system work inside the 300 ms budget |

### 4.2 CLI tests

| Test | Change | Why |
|---|---|---|
| `tests/integration/cli/frontend.test.ts:17-27` ("the catalogue mirrors every ERR-CLI and WARN-CLI row of errors.md") | `deepEqual` between `CATALOGUE` in `src/cli/errors.ts` and the `ERR-CLI`/`WARN-CLI` rows of the **CHG-001** `errors.md` (code, condition, message, fix), and the exit code derived from the condition text | ERR-CLI-019 and ERR-CLI-020 (C002-REQ-514, C002-REQ-516) must enter `CATALOGUE`; the CHG-001 file is approved and is not edited by CHG-002, so the test has to read the CHG-002 `errors.md` rows as well (E-31) |
| `tests/integration/cli/frontend.test.ts:41-45` ("every command of C001-IF-01 is dispatched") | compares `COMMANDS` names with the table of `.sdd/001-architect-agent-suite/10-spec/50-interfaces/sdd-cli.md` by `deepEqual`; adding `host-version`, `template show`, `template list`, `hook guard`, `hook subagent-stop` fails it | the spec delta (C002-IF-007) lives in another file; the test must read both tables or take the new names from C002-IF-007. The same file moves at the CHG-001 archive (baseline §4 note 7) |
| `tests/integration/cli/frontend.test.ts:129-144` | loops over `COMMANDS` with each row's `sampleArgs` under `SDD_DEBUG=1` and asserts a `command=` trace and an `exit=` trace | every new row needs `sampleArgs` that run without hanging or reading real stdin (`hook guard` reads stdin; `host-version` calls external programs; `serena-launch` spawns Serena — its current sample is `data -- --version`) |
| `tests/integration/cli/frontend.test.ts:147-165` | copies this repository's `.sdd`, runs `status --write`, and lints every change whose **current phase is approved** with zero errors or warnings | once CHG-002's 20-plan phase is approved, CHG-002 is linted by this test: its artifacts must lint clean (LINT-DELTA-001 is waived at G2/G3, C002-DEC-008, so the waiver must be effective in this run) |
| new tests | `sdd --version` prints the bare version, `sdd version` is unchanged; `template show`/`list` confinement and ordering (C002-TS-522, C002-TS-531, C002-TS-532); `--user-data` platform rules and ERR-CLI-020 (C002-REQ-516); `host-version` with fake `opencode`/`code` shims (`tests/fixtures/cfg-*/bin` is the existing pattern) | new commands |

### 4.3 Build, package and version tests

| Test | Change | Why |
|---|---|---|
| `tests/integration/cap11/TS-1115.test.ts` | the temporary build tree copies `scripts/`, `src/`, `package.json` and the notices file only; once `build.mjs` reads `plugins/architect/.claude-plugin/plugin.json` (C002-ADR-004) and bundles `src/mcp/server.ts`, the fake-GPL build fails for another reason and the stderr assertion on `gpl-thing@1.2.3 (GPL-3.0)` no longer matches | add `plugin.json` (and any other build input) to the copy |
| `tests/smoke.test.ts` | pins `plugins/architect/scripts` to exactly `["sdd.mjs"]` (keeps the second bundle out of the plugin), `sdd version` equal to `package.json`, and `plugin.json` version equal to `package.json` | C002-ADR-004 makes `plugin.json` the version source; keep the equality (it is the guard the ADR asks for) or move it into the structure check |
| `tests/integration/cap11/TS-1114.test.ts` | bundles `src/cli.ts` only and compares the notices | unchanged; add the equivalent for the `architect-sdd` notices (union of both bundles, C002-REQ-414) |
| `scripts/test.mjs` | `__SDD_VERSION__` is read from `package.json`; follow the single version source; `findTests` would pick up `tests/replay/*.test.ts` | replay tests need a loopback server and the OpenCode binary; they must run in their own command or be excluded here |
| `tests/no-network.mjs` (preload, inherited by every child process) | any test that starts a loopback stub (ADR-005), connects to a local server or runs a Node child that opens a socket trips the stubs and fails the whole run | the sdd MCP server is stdio only and is fine; the OpenCode replay driver is not |
| `tsconfig.json` | `include` adds `scripts/generate`, `scripts/release` | C002-ADR-003 |

### 4.4 Plugin-structure checks that read the plugin

`scripts/check/` (blast-radius E-16) stays green if `plugins/architect/targets/` holds no machine path
(PLG-PATH-001), no `sdd-*.md` file lands in `agents/` (PLG-LAYOUT-001) and the Claude-pinned files
(`.mcp.json`, `hooks.json`, agent `tools`) are unchanged (PLG-MCP-001, PLG-HOOK-001, PLG-TOOLS-001).
New checks (TGT-*, PLG-VAR-001) are additions and have no existing test.

## 5. Evals that exercise the changed code

Claude Code sessions run the shipped bundle through `hooks.json`, so a guard defect shows in any eval
that makes an Architect agent call Bash or write a file. Candidates by relevance, none to be run per
task:

| Eval | Why it matters to CHG-002 | Layer |
|---|---|---|
| `evals/cap11/doctor-no-ripwire.eval.mjs` (with `evals/cap10/TS-1015.eval.mjs`, `evals/cap11/TS-1111.eval.mjs`) | the doctor's `sdd serena-config "${CLAUDE_PLUGIN_DATA}"` step passes through the new Serena confinement; the run is the nearest existing check of the assumption of C002-TS-537 (Claude Code substitutes or exports the variable before the hook runs). One run, within the $0.50 cap | grep |
| `evals/cap11/TS-1112.eval.mjs`, `TS-1124.eval.mjs`, `doctor.mjs` shims (`tests/fixtures/cfg-node18`, `cfg-old-claude`, `cfg-bare`) | doctor outcome lines and the node ≥ 20 probe; the probe may now use `node --version` | grep |
| `evals/cap10/TS-1004`, `TS-1010`, `evals/cap10/carto.mjs` | cartographer ladder under the bash guard (ripwire read verbs, `git`, `ast-grep`) | grep |
| `evals/injection/injection.eval.mjs` | injection resistance through the guards | grep |
| the 20 other `evals/cap*/TS-*.eval.mjs` that mention Bash or guards | conductor and specialist behaviour | grep |

Re-run only the first row at the milestone that implements C002-REQ-517, and the rest only if the plan
edits a source agent, command or skill (it should not, C002-CON-10).

## Evidence

- **E-21** `tests/guards/bash-corpus.test.ts:28` › `bashHookInput()` — writes `cwd` as the fixture repository for every case unless `c.cwd === null` (l.33); `{sdd}` and `{repo}` placeholders (l.31); the fixture repository is `mkdtempSync` plus a `.sdd` folder (l.40-41), without `.git`; the test asserts the rule name as the text before `:` in the message (l.50-51).
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-22** `tests/guards/bash-corpus.json:157` › `BG-019` — the only corpus command with `--cwd`; `BG-044` (l.372) `npx sdd lint` deny GUARD-BASH-001; `BG-166` (l.1412) `node --version --eval=x` deny; no case starts with a bare `sdd`, and none runs `serena-config` or `serena-launch`.
  - layer: grep · confidence: medium (pattern search over a 2,391-line file)
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-23** `tests/integration/cli/frontend.test.ts:41` › - — `deepEqual` of the sorted `COMMANDS` names with the `` | `name` | `` rows of `.sdd/001-architect-agent-suite/10-spec/50-interfaces/sdd-cli.md` (l.15, l.42-44); l.129-144 iterate `COMMANDS` with `sampleArgs`; l.147-165 lint every approved-phase change of a copy of `.sdd`.
  - layer: grep (file read) + serena (references of `COMMANDS`) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-24** `tests/integration/cap11/TS-1115.test.ts:16` › - — copies `scripts`, `src`, `package.json`, `THIRD_PARTY_NOTICES.md`, links `esbuild`, `yaml`, `@esbuild`, injects a GPL package into `src/cli.ts`, and asserts a non-zero build and the stderr text `gpl-thing@1.2.3 (GPL-3.0)`.
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-25** `tests/smoke.test.ts:12` › - — three assertions: `sdd version` equals `architect-plugin@<package.json version>`; `readdirSync(plugins/architect/scripts)` equals `["sdd.mjs"]`; `plugin.json` version equals `package.json` version.
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-26** `tests/integration/cap11/TS-1122.test.ts:16` › - — `hooks.json` has 5 commands, each starting `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"`, with the matchers `Write|Edit|NotebookEdit`, `Bash|PowerShell`, `Write|Edit`, the SubagentStop agent regex and the empty SessionStart matcher.
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-27** `scripts/test.mjs:12` › `findTests()` — every `*.test.ts` under `tests/` except directories named `fixtures`; the run injects `--import=tests/no-network.mjs` into the process and, through `NODE_OPTIONS`, into children (l.52-57), and fails when the log is not empty (l.58-62).
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-28** `tests/integration/cap11/TS-1118.test.ts:22` › - — runs `scripts/check.mjs --steps validate,fixtures,structure` with a broken fixture copy and expects exit ≠ 0, `FAIL lint fixtures`, `PASS plugin structure checks`.
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-29** `bench/guards.mjs:1` › - — C001-NFR-103: guard decision time, p95 over 50 recorded inputs, threshold 300 ms; inputs at l.11-15 (path guard x3, bash guard x2).
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-31** `tests/integration/cli/frontend.test.ts:14` › - — `ERRORS_MD` is the CHG-001 file `.sdd/001-architect-agent-suite/10-spec/50-interfaces/errors.md` (l.14); l.17-27 compare its `ERR-CLI-nnn`/`WARN-CLI-nnn` rows (at least 18) with `Object.values(CATALOGUE)` by `deepEqual`; `src/cli/errors.ts:30-33` ends the catalogue at ERR-CLI-018 and a text search of `src/`, `tests/` and `scripts/` finds no ERR-CLI-019 or ERR-CLI-020.
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-30** `tests/integration/cap11/TS-1114.test.ts:13` › - — bundles `src/cli.ts` with a metafile and checks that `THIRD_PARTY_NOTICES.md` lists every bundled package (`yaml` 2.x among them).
  - layer: grep (file read) · confidence: high
  - commit: 85bee21 · pattern: -
  - disclosures: ripwire failed: exit 127
