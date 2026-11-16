---
id: C002-T-065
title: "Catch-up for revision D-018 … D-020: file-inspection variant and glob-prose construct, spend-cap exceptions, PATH lead, Copilot CLI model, platform rule, PATH-only executable lookup"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: done
depends_on: [C002-T-028, C002-T-038, C002-T-044, C002-T-045, C002-T-047, C002-T-064]
implements: [C002-REQ-111, C002-REQ-112, C002-REQ-304, C002-REQ-405, C002-REQ-501, C002-REQ-507, C002-REQ-508, C002-REQ-515, C002-REQ-606, C002-REQ-608, C002-REQ-610, C002-REQ-611, C002-REQ-612, C002-REQ-618, C002-REQ-627, C002-REQ-634, C002-NFR-105]
satisfies_ac: [C002-AC-111.1, C002-AC-112.1, C002-AC-304.1, C002-AC-405.1, C002-AC-501.1, C002-AC-507.1, C002-AC-508.1, C002-AC-515.1, C002-AC-606.1, C002-AC-608.1, C002-AC-610.1, C002-AC-611.1, C002-AC-612.1, C002-AC-618.1, C002-AC-627.1, C002-AC-634.1]
verified_by: [C002-TS-673, C002-TS-674, C002-TS-120, C002-TS-675, C002-TS-676, C002-TS-677, C002-TS-678, C002-TS-679, C002-TS-680, C002-TS-614, C002-TS-306, C002-TS-681, C002-TS-682, C002-TS-637, C002-TS-683, C002-TS-667, C002-TS-668, C002-TS-684, C002-TS-685, C002-TS-686, C002-TS-687, C002-TS-511, C002-TS-634, C002-TC-673, C002-TC-674, C002-TC-120, C002-TC-675, C002-TC-676, C002-TC-677, C002-TC-678, C002-TC-679, C002-TC-680, C002-TC-614, C002-TC-306, C002-TC-912, C002-TC-913, C002-TC-914, C002-TC-915, C002-TC-916, C002-TC-681, C002-TC-682, C002-TC-637, C002-TC-683, C002-TC-667, C002-TC-668, C002-TC-684, C002-TC-685, C002-TC-686, C002-TC-687, C002-TC-511, C002-TC-634]
components: [C002-COMP-001, C002-COMP-002, C002-COMP-003, C002-COMP-004, C002-COMP-005, C002-COMP-008, C002-COMP-009, C002-COMP-010, C002-COMP-015, C002-COMP-016, C002-COMP-018]
risk_refs: [C002-RISK-034, C002-RISK-035, C002-RISK-022, C002-RISK-015, C002-RISK-026]
estimate: L
report: { commit: 880f9ea, completed_at: 2026-10-20, notes: "npm test 1465 pass + 1 skip; replay suite 44 + 2 skip; confirmation replay sdd-mcp-server/copilot-hooks 0 differing; C001 gate tests unchanged and green. No paid session. Candidates: TS-673 line 30 vs 26-line sdd-critic.md; TC-637 16 vs 13 rows; no fx-gate builder (C001 gate fixture used); TC-681 OpenCode row skipped (server mode); TC-306 note names the model field, not the value." }
---

# C002-T-065 — Catch-up for revision D-018 … D-020: file-inspection variant and glob-prose construct, spend-cap exceptions, PATH lead, Copilot CLI model, platform rule, PATH-only executable lookup

## Intent

The spec revision for defects D-018 (findings of C002-T-064), D-019 (findings of C002-T-045 on
Copilot CLI 1.0.98) and D-020 (findings of C002-T-056 on OpenCode 1.18.31), with the critic fixes that
followed it, changed contracts that done tasks already implemented (P-01 answers Q-opencode-glob-01
"Guide agents (Recommended)", Q-ts634-budget-01 "Budget exception $1", Q-cli-model-01 "Pass --model
(Recommended)", Q-capped-runs-01 "Don't count them (Recommended)" and Q-exec-lookup-01 "Fix everywhere
now (Recommended)", and the conductor's answer to Q-replay-rule-01, to be confirmed at G2;
`../../10-spec/questions-log.md` rounds 2026-10-20 and 2026-10-20 (2)). Done tasks are not reopened.
This task brings their tables, wiring, code and tests to the revised contracts and is recorded as the
follow-up of C002-T-013, C002-T-014, C002-T-019, C002-T-028, C002-T-038, C002-T-044, C002-T-045,
C002-T-047 and C002-T-064, and, for the `git` start of the `gate` commands, of CHG-001's gate code
(C002-CON-17). It runs **no paid session**: the reruns of C002-TC-511 and C002-TC-634 belong to
C002-T-056, and the Copilot CLI release rows to C002-T-054. The release-check catalogue mirror of
ERR-REL-012 and the schema copy `docs/releases/release-record.schema.json` were done by the architect
(commits 4c0f7c6 and f495222); this task does not touch them.

The work has six parts: **(a)** the construct `glob-prose` with the detector `\bGlob\b` and the
variant `file-inspection` on both targets, and the OpenCode `doctor-probe` test for `.sdd/`
(C002-IF-001 §2, §2.1, §6.1 Dot folders; D-020 item 1; critic CR-67); **(b)** the PATH lead of the
pinned OpenCode binary (C002-IF-010 §4 PATH lead; D-020 item 4); **(c)** the spend-cap rule per step
on OpenCode and per session on Copilot CLI, the cap exceptions matched by row ID, case file and host,
and the result field `caps` (C002-IF-010 §2.2, §3; D-020 items 2 and 3; critic CR-64, CR-65, CR-68);
**(d)** the Copilot CLI runner: `--model` from the session agent's file, the runner rules of D-019
covered by test cases, and the model note of the Copilot install notes (C002-IF-010 §2, §3, §4,
C002-IF-005 §5; D-019 items 1 … 7; critic CR-69); **(e)** the platform rule of the replay report with
its precedence over C002-REQ-633, the rule per not-applicable entry and the release check that
accepts only `win32` replay reports (C002-IF-009 §2.1, §4, §5; D-018 items 1 … 3; critic CR-60,
CR-61, CR-62, CR-66); **(f)** the PATH-only executable lookup of every executable the sdd CLI and the
sdd MCP server start (C002-IF-007 §Executable lookup, C002-IF-002 §5.2 steps 3 and 4, C002-CON-17;
critic CR-63).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/targets/opencode.json`, `plugins/architect/targets/copilot.json` › `constructs` | (a) the construct `glob-prose`: kind `tool-name`, `detect` `\bGlob\b` (the whole, case-sensitive word, as `bash-prose` matches `Bash`, so `Global` and the host tool name `glob` do not match), contexts `body` only (the frontmatter `tools` entry stays a tool-mapping case), action `variant_required` (C002-IF-001 §2 row "`Glob` in prose") |
| modify | `plugins/architect/targets/opencode.json`, `plugins/architect/targets/copilot.json` › `variants` | (a) the fourteenth variant `file-inspection`: file `skills/sdd-conventions/SKILL.md`, anchor `lines` = the three lines 16 … 18 of the file-inspection rule exactly as the source holds them, `text_file` `file-inspection.md` (C002-IF-001 §2.1). Both tables name the same fourteen variants |
| add | `plugins/architect/targets/opencode/wiring/file-inspection.md` | (a) the OpenCode text of C002-IF-001 §6.1 Dot folders: `read`, `glob` and `grep` for inspecting files; `sdd status` (through `bash`, or `{{server_shell}}` under sdd MCP server enforcement) and `read` for finding files under `.sdd/`; `grep` with a `path` inside `.sdd/` for text in it; `glob` never used to find or rule out a `.sdd/` file, and an empty `glob` or `grep` result no proof of absence; the command-tool rule (allowlisted commands only, one per call, no `;`, `&&` or redirection) in OpenCode's tool names for both modes. The text names neither `Glob` nor `Bash` (C002-TS-674 row 1) |
| add | `plugins/architect/targets/copilot/wiring/file-inspection.md` | (a) the Copilot text of C002-IF-001 §6.1 "Copilot: not recorded": `read` and `search` for inspecting files; `sdd status` through the command tool of the package's mode and `read` of a file by its path for finding files under `.sdd/`; an empty `search` result no proof of absence; the command-tool rule in Copilot's tool names for both modes; neither `Glob` nor `Bash` (C002-TS-674 row 2) |
| modify | `plugins/architect/targets/opencode/wiring/doctor-probe.md` | (a) the test whether `.sdd/` exists is `sdd status` or `read` of `.sdd/`; no instruction to call `glob` on `.sdd/` (C002-IF-001 §2.1 `doctor-probe`; C002-TS-674 row 3; the cause of the C002-TS-511 failure in C002-T-056) |
| modify | `scripts/generate/translate/constructs.ts` › `GLOSSARY` | (a) the stand-in detector `glob-prose` with `anchor: true` and the same `\bGlob\b` pattern, as for `claude-host` and `plugin-root` (used when a table has no construct of that id), so a fixture table that lacks the construct still makes a body line naming `Glob` an anchor, and a line with `Global` or `glob` stays no anchor |
| modify | `tests/integration/cap01/wiring.test.ts` | (a) C002-TC-673 (five rows on fx-plugin-glob-prose, the two `Global` and `glob` rows included), C002-TC-674 (three rows on fx-src), the new row `fx-plugin-novariant-glob` of C002-TC-120; one `test()` per Examples row whose name starts with its TS ID; the two new fixtures are built by the tests in a temporary folder from fx-src, as the other `fx-plugin-novariant-*` fixtures are (test plan §2) |
| modify | `evals/harness/runners/opencode.mjs` › `driverHost` | (b) the PATH lead of C002-IF-010 §4: the folder of the pinned host binary right after the run's own `bin` folder when the case gives no PATH; a case PATH is taken as the machine configuration built it (below), with no second lead added; no lead for a case whose configuration removes OpenCode |
| modify | `evals/harness/machines.mjs` › `machine`, `withPath` | (b) a `lead` folder placed right after the folders the case prepends (its version shims) and before the configuration's own folders; the Git Bash env file applies the same order; a configuration that removes OpenCode gets no lead |
| modify | `evals/targets/doctor/doctor-cases.mjs` › `doctorCase` | (b) the OpenCode rows pass the pinned binary's folder (from the harness configuration of C002-ADR-005) as that lead to `machine`; the Claude Code and Copilot CLI rows are unchanged |
| modify | `tests/integration/cap06/runner-caps.test.ts` | (b) C002-TC-676; (c) C002-TC-677 on the stub OpenCode host with per-step costs and a parallel subagent step; C002-TC-614, OpenCode rows: the turn-cap and the spend-cap row, each asserting `caps` `{ turns: 30, usd: 0.50 }` in the result record |
| modify | `evals/harness/runners/opencode.mjs` › spend accounting | (c) only for a row of C002-TC-677 that fails: the cost of every finished step of the session agent and of its subagents is added, the sum compared with the cap after each step, the session aborted at once when the sum reaches the cap, and a subagent step that finishes before the abort takes effect still counted |
| modify | `evals/harness/run.mjs` (the `maxBudgetUsd: Math.min(…, 0.5)` clamp, about line 79), `evals/harness/caps.mjs` | (c) the cap-exception check of C002-IF-010 §2.2: a table of the exceptions in force (row `TS-634`, case file `evals/targets/gate/TS-634.eval.mjs`, host `opencode`, 1.00 USD; raised to 2.00 USD after this task by C002-T-056 rerun plan step X0, defect D-022) next to `DEFAULT_MAX_BUDGET_USD`; before any session, a selected row whose `maxBudgetUsd` is above 0.50 runs only when an exception matches its row ID, its case file (the repository-relative path with `/` separators of the file that defines the row) and the run's `--host` together, at a cap of at least the row's value; otherwise the run ends with exit code 1 and a message naming the row's ID and its case file. The `Math.min(…, 0.5)` clamp goes: the row's `maxBudgetUsd` (default 0.50) and `maxTurns` (default 30) pass to `runSession` unchanged, and the harness writes them into each result record as `caps` `{ turns, usd }` beside `usage`, on every host (C002-IF-010 §3 `caps`). The harness does not count the exception's runs (§2.2 Runs) |
| modify | `evals/targets/gate/TS-634.eval.mjs` | (c) the OpenCode row's `maxBudgetUsd` 1.0 (today 0.5), nothing else; 2.00 from C002-T-056 rerun plan step X0 on (defect D-022) |
| add | `tests/integration/cap06/cap-exceptions.test.ts` | (c) C002-TC-679, seven rows on fx-evals-caps with a stub host per `--host`, through `node evals/harness/run.mjs --host <host> --only <row>`, the case file of each row at the path of the row's `file` column inside the fixture's case folder |
| modify | `evals/harness/runners/copilot-cli.mjs` › the session start (about line 653) | (d) `--model <model>`: the case's `model` when given, else the `model` field of the session agent's file `agents/<agent>.agent.md` in the package copy (`architect:` prefix removed for the file name; C002-IF-010 §2 `model`). The flag is passed once, also for a relayed session agent |
| modify | `evals/harness/runners/copilot-cli.mjs` | (c), (d) only for a row of C002-TC-614 (Copilot CLI turn-cap row), C002-TC-678 or C002-TC-912 … 916 that fails (the code of C002-T-045 already passes the options of C002-IF-010 §4, maps the agent names and applies the spend cap per session through `--max-ai-credits`) |
| modify | `tests/integration/cap06/copilot-runner.test.ts` | (c), (d) C002-TC-614 Copilot CLI row (1 AI Credit per turn below the limit of 50, turn cap, `caps` in the result), C002-TC-678 and C002-TC-680; C002-TC-912 … 916 extend the C002-T-045 tests that the test plan names, with the assertions the test plan lists as missing (the `prompt-file` harness record, `COPILOT_AUTO_UPDATE=false`, the `hooks` event from the host log) |
| modify | `plugins/architect/targets/copilot/install.md` | (d) the one Copilot CLI note of C002-IF-005 §5 after the six steps (C002-TS-306): Copilot CLI is no supported host of the package; Copilot CLI runs a session agent started with `--agent architect:sdd-conductor` on its default model; the conductor runs on its tier only with `--model` followed by the `model` field of `agents/sdd-conductor.agent.md`. No other Copilot CLI setting is named; in particular the notes do not contain `GITHUB_COPILOT_PROMPT_MODE_REPO_HOOKS` |
| modify | `tests/integration/cap03/package.test.ts` | (d) C002-TC-306: the note after the steps and the absent variable name, on the generated `dist/copilot/INSTALL.md` |
| modify | `tests/replay/expect.ts` › `expectationOf` (about line 95) | (e) the platform rule of C002-IF-009 §2.1: a `platforms` list names `win32`, `posix` or both; a case that falls to the last row and whose `platforms` list does not name the replay host's platform is `{ applicable: false, rule: "platforms" }` on every mechanism, in place of today's `omitted` expectation; a `platforms` field that is not a non-empty list of these two values excludes nothing. Precedence: the platform rule is decided before the capability rule of C002-REQ-633, so a case with a `requires` field that the platform rule excludes is not applicable with the rule `platforms`, and one it leaves applicable (PG-163) is replayed with its capability. The rows above the last are unchanged, so a memory case limited to another platform stays `deny` (C002-REQ-625) |
| modify | `tests/replay/suite.ts`, `tests/replay/report.ts`, `tests/replay/main.ts` (the replay suite writer) | (e) a case of the platform rule goes into the report's `not_applicable` with `id`, `corpus`, `category` and the rule `platforms`, for every mechanism, `opencode-permissions` included; it is no longer an omitted case, and `npm run replay` no longer fails on it |
| modify | `scripts/release/replay.ts` (`checkReport`, about lines 100 … 147) | (e) ERR-REL-012 as revised, in this order: first the platform check, a report whose `replay_host.platform` is not `win32` gives one ERR-REL-012 line `was replayed on <platform>, not on win32: <case ids>`, with the cases that the platform rule excludes on that platform and not on `win32` (or `none`), and `checkReport` checks that report no further (no other ERR-REL-012 line, no differing count); then, for a `win32` report, a case of the platform rule is accepted under `not_applicable` with the rule `platforms`, named under `replays cases that its mechanism excludes` when replayed and under `omits cases` when left out; each not-applicable entry is checked against the rule that excludes its case, so a case of an earlier row of §2.1 (the memory case `PG-901`) listed with the rule `platforms`, and a case of the platform rule listed with any other rule or none (Q-replay-rule-01), are named under `lists cases as not applicable without a rule`; the capability check counts every case of the cited corpora that requires a capability, a case of the platform rule included |
| modify | `scripts/release/check.ts` (the replay loop, about lines 207 … 215) | (e) for a report that `checkReport` refused as replayed on another platform: no ERR-REL-001 line from its differing count and no ERR-REL-006 host-version check of `opencode-permissions` (C002-IF-009 §5 first row: "not checked further"); its release-record entry keeps the path and mechanism with 0 applicable and differing |
| modify | `tests/integration/cap06/fx-release.ts` | (e) the fx-release corpora: `PG-900` of category `outside` and the memory case `PG-901`, both limited by `platforms` to `posix` (today `linux`, not a value of `replay_host.platform`); the clean reports list `PG-900` under `not_applicable` with the rule `platforms` and replay `PG-901` with `deny` and the source `C002-REQ-625`; a builder for fx-release-no-platforms, a copy whose corpora of the release commit hold no `platforms` list (C002-TC-683) |
| modify | `tests/integration/cap06/release-check.test.ts` | (e) C002-TC-637 (16 rows as planned; written: 13 rows, defect D-021 item 2: the platform rows on `posix` cases, the row `PG-900` under the rule `C002-REQ-626` and the `posix` replay-host row added), C002-TC-682 (two rows), C002-TC-683 (two rows), the three added rows of C002-TC-668 (24 rows in all) |
| modify | `tests/replay/scenarios/suite.test.ts` | (e) C002-TC-681 on fx-corpus-platforms (`PG-900`, `PG-901`, `PG-902`; `PG-163` replayed), one test per Examples row (the `@mode-native` row on the pinned OpenCode 1.18.31 with the stub model) |
| modify | `tests/unit/replay/adapters.test.ts` | (e) C002-TC-667: the stub answers the `replace_text` call of `PG-050`, and each row also asserts that the stub received one `replace_text` call and no `write_file` call (D-018 item 1) |
| modify | `tests/unit/replay/expect.test.ts` | (e) unit cases for the precedence and the `platforms` values: a `["posix"]` case with `requires` on a `win32` host is not applicable with the rule `platforms`; a `["win32"]` case with `requires` on a `win32` host is applicable; a `platforms` value outside `win32`/`posix`, or an empty list, excludes nothing |
| modify | `docs/releases/opencode/0.0.1/replay-*.json`, `docs/releases/copilot/0.0.1/replay-*.json` | (e) only if a regenerated report differs: every `platforms` list of the present corpora is `["win32"]`, so no case moves to `not_applicable` on REF-WIN |
| modify | `src/io/paths.ts` › `executableNames` and a new shared resolver beside it | (f) the lookup rule of C002-IF-007 §Executable lookup, in one place for every start: the folders of the given `PATH` (on Windows the environment's `Path` key, whatever its letter case) in their order; an empty entry or one that is not an absolute path skipped, so the working folder and the repository are searched only where the PATH names them by an absolute path; on Windows each folder tried for the name with each extension of `PATHEXT` in its order (`.COM;.EXE;.BAT;.CMD` when unset or empty), a name that already ends in an extension tried as given; each match classified `native` (`.com`, `.exe`) or `shim` (`.bat`, `.cmd`), any other extension passed over; on other platforms a regular file with execute permission. Two answers: the first match native or shim (the probes), and the first native match with the reason `not found on PATH` or `only a .cmd or .bat shim was found` (every other start). The resolver never starts a process. Its signature is the implementer's, documented in the module; no interface file names it |
| modify | `src/cli/host-version.ts` › `run` (about line 58) | (f) each probe resolves its name (`opencode`, `code`, `code-insiders`) with the resolver's first-match answer and then runs by the absolute path of the match, with the folder of the match as working folder: a native match without a shell, a `.cmd` or `.bat` match through the platform shell with the match's absolute path quoted and the fixed arguments after it (the only shell use, for these fixed command lines only); no match gives `<host> missing` without starting anything. Today's `[command, …args].join(" ")` through `shell: true` goes (it let `cmd.exe` search the working folder first) |
| modify | `src/gate/gate.ts` › `gitUser` (line 115) | (f) CHG-001 code (C001-IF-01, C001-REQ-816): `git` resolved with the native-match answer and started by its absolute path, `cwd` the repository root as today; no native match gives `unknown`, as a missing git does today. Arguments, output and exit codes unchanged (C002-CON-17) |
| modify | `src/gate/commit.ts` › `git` (line 10) | (f) CHG-001 code (C001-REQ-816, C001-REQ-817): the same resolved `git`, started by its absolute path without a shell; no native match fails as a missing git does today, so `gate approve --commit` gives ERR-CLI-018 `not a git repository` from the first precondition. Messages and exit codes unchanged |
| modify | `src/workspace/serena-launch.ts` › `serenaLaunch`, `defaultSpawner` | (f) `serena` (or `options.command`) resolved with the native-match answer and started by its absolute path, with `SERENA_HOME` and the arguments as today; no native match returns the launch's start error naming `serena` (exit code non-zero) without starting anything; the `Spawner` seam of the tests stays |
| modify | `src/mcp/tools/shell.ts` › `resolveOnPath` (line 66), `killTree` (about line 159) | (f) `resolveOnPath` becomes a thin call of the shared resolver's native-match answer over the server's PATH, so an empty or relative entry is skipped and `PATHEXT` order applies (C002-IF-002 §5.2 step 3; ERR-MCP-006 reasons unchanged); at `timeout_ms` on Windows `taskkill` is resolved the same way and started by its absolute path, without a shell (§5.2 step 4); when no native `taskkill` is found the server kills the child itself, as today when the kill fails |
| modify | `tests/unit/io/paths.test.ts` | (f) unit cases of the resolver: PATH order; `.`, an empty entry and a relative entry skipped; `PATHEXT` order and the default; a name with an extension; native, shim and other-extension classification; the `Path` key on Windows; the two answers and their reasons |
| add | `tests/fixtures/stub-exe/recording-stub.cs` and a test helper `tests/integration/stub-exe.ts` | (f) the native recording stub of the test plan fixture `stub-exe`: compiled once per test run with the .NET Framework compiler `csc.exe`, as `evals/harness/machines.mjs` compiles `tests/fixtures/cfg-node18/node-shim.cs`, into a temporary folder and copied under the names a row needs (`git.exe`, `serena.exe`, `taskkill.exe`, `opencode.exe`, `node.exe`); it appends each start (its absolute path, arguments, working folder and the environment variables the row names) to a log file beside it, prints the text its configuration gives, and in the never-ending form starts one child copy of itself that never ends. The helper also writes the recording `.cmd` stubs. On REF-WIN the tests do not skip when `csc.exe` is present, which it is on Windows 11 |
| add | `tests/integration/cli/exec-lookup.test.ts` | (f) C002-TC-684: six rows, the npm `sdd` of fx-tgz in a copy of fx-gate (written: the CHG-001 gate fixture `tests/integration/cap08/gate-fixture.ts`, defect D-021 item 3) |
| modify | `tests/integration/cli/host-version.test.ts` | (f) C002-TC-675: eight rows, the planted working-folder stubs and the relative PATH entries included, against the bundled CLI |
| modify | `tests/integration/cli/serena-user-data.test.ts` | (f) C002-TC-685: four rows |
| modify | `tests/integration/mcp/shell.test.ts` | (f) C002-TC-686 (six rows) and C002-TC-687 on the server of fx-tgz |

## Preconditions

- C002-T-028, C002-T-038, C002-T-044, C002-T-045, C002-T-047 and C002-T-064 done (C002-T-013 and
  C002-T-014 through C002-T-038, C002-T-019 through C002-T-064); C002-T-056 is in progress and waits
  for this task (C002-TC-511 and C002-TC-634).
- G2 re-approved after the D-018 … D-020 revision and its critic fixes (gate records of
  `../../change.md`), with Q-replay-rule-01 confirmed or changed by P-01 at G2.
- REF-WIN with the pinned OpenCode 1.18.31 binary and Node.js 22.22.2 or later for the
  `@mode-native` row of C002-TC-681 (E-OC), Git for Windows (the real `git.exe` rows of C002-TC-684)
  and the .NET Framework `csc.exe` (fixture `stub-exe`). No paid session: every runner case uses a
  stub host.

## Step outline (no production code)

1. Write or adjust the test cases first, each Examples row its own `test()` whose name starts with
   its TS ID (C002-TC-912 … 916 start with their TC ID). Watch C002-TC-673 (the `Global` and `glob`
   rows), 674, 676, 679, 680, 681, 682, 683, 684 … 687, the platform rows of C002-TC-637 and the
   planted-stub rows of C002-TC-675 fail against today's code; C002-TC-614, 677, 678, 668 and
   912 … 916 may already pass apart from the `caps` assertions (the task report says which).
2. **(a) Construct and variant.** Add `glob-prose` with `\bGlob\b` and `file-inspection` to both
   tables and the stand-in detector to `GLOSSARY`. Write the two `file-inspection.md` texts from
   C002-IF-001 §6.1, checking each against the "holds" and "excludes" cells of C002-TS-674. Change the
   OpenCode `doctor-probe.md` test for `.sdd/`. Do not edit `skills/sdd-conventions/SKILL.md`,
   `commands/init.md` or any other Claude Code text (C002-CON-10); `commands/init.md:26` and the
   `## Global items` heading of the dod-catalogue skill must generate without ERR-GEN-002. Run
   `npm run package`, then C002-TC-673, 674 and 120, and `npm run check`: the target structure check
   and the inlining budget of C002-NFR-104 stay green (every agent inlines the skill), and the Claude
   Code package is byte-unchanged.
3. **(b) PATH lead.** Add the lead to `driverHost` and to `machine`, pass it from `doctorCase` for
   the OpenCode rows, and write C002-TC-676 with a stubbed host start that records the host process's
   environment, then runs `sdd host-version opencode` with that PATH and the shims of the row.
4. **(c) Caps.** Add the exception table keyed by row ID, case file and host, and the check before
   any session; remove the clamp; write `caps` into every result record; set the TS-634 OpenCode
   row's cap to 1.00 USD (2.00 USD after this task, C002-T-056 step X0). Write C002-TC-614 (both runners, `caps`), C002-TC-677 (stub host with
   step-finish costs and a parallel subagent step) and C002-TC-679 (fx-evals-caps, the
   `evals/targets/other/` row included); change the spend accounting only for a row that fails.
   Confirm that every other case file under `evals/` sets no `maxBudgetUsd` above 0.50 (C002-TC-679
   also reads them) and name any in the task report.
5. **(d) Copilot CLI runner.** Pass `--model` from the session agent's file; write C002-TC-680 and
   C002-TC-678 against the stub host; extend the C002-T-045 tests for C002-TC-912 … 916 with the
   missing assertions. Add the one Copilot CLI note to the Copilot install notes, without the
   workspace-hooks variable, regenerate (`npm run package`) and run C002-TC-306, so that
   `dist/copilot/INSTALL.md` carries the note.
6. **(e) Platform rule.** Change `expectationOf` (values `win32`/`posix`, precedence before
   C002-REQ-633), the replay suite writer, `checkReport` (the `win32` check first, then the rule per
   not-applicable entry) and the replay loop of `check.ts`; update fx-release (`posix`) and add
   fx-release-no-platforms and the `PG-902` case of fx-corpus-platforms. Run C002-TC-681, C002-TC-637
   (16 rows as planned; 13 rows, defect D-021 item 2), C002-TC-682, C002-TC-683, the three new rows of C002-TC-668 and C002-TC-667. Run
   `npm run replay -- --all` on REF-WIN for both targets: 0 differing decisions and an unchanged
   not-applicable list (no present case is limited away from `win32`); rewrite a report under
   `docs/releases/` only if it differs.
7. **(f) Executable lookup.** Write the resolver's unit cases, then the resolver in `src/io/paths.ts`.
   Move each start to it in this order, running the start's tests after each: the server's
   `resolveOnPath` and `taskkill` (C002-TC-686, 687, then the existing `npm test -- mcp/shell`, with
   C002-TC-409, 423, 641 and 642 unchanged), `serena-launch` (C002-TC-685, then `npm test --
   cli/serena-user-data` and `npm test -- cap10`), `host-version` (C002-TC-675, then the existing
   host-version tests, the `.cmd`-only test included), and last the `git` of CHG-001's `gate` code
   (C002-TC-684, then the CHG-001 gate tests of `30-impact/regression-set.md` §4.6, which stay green
   without edits: C001-TC-801, 805, 808, 809, 810, 813, 814, 816, 818 and 819 in
   `tests/integration/cap08/`, and the gate tests of `tests/integration/cli/frontend.test.ts`). Search
   `src/` for any other `spawn`, `spawnSync`, `execFile`, `execFileSync` or `exec` call that starts a
   bare name; each one found is moved to the resolver and named in the task report, or, when it is not
   in the table of C002-IF-007 §Executable lookup, reported as a spec defect with `sdd defect add`
   instead of being changed.
8. Run `npm test`, `npm run replay`, `npm run check` and `npm run bench` (generation p95 of
   C002-NFR-103 within 5 s with the added variant; the guard p95 of C001-NFR-103 unchanged, since the
   guards start no process).

## Verification

- `npm test -- cap01/wiring`, `npm test -- cap03/package`
- `npm test -- unit/io/paths`, `npm test -- cli/host-version`, `npm test -- cli/exec-lookup`,
  `npm test -- cli/serena-user-data`, `npm test -- mcp/shell`
- `npm test -- cap08`, `npm test -- cli/frontend`, `npm test -- cap10` (CHG-001 gate and Serena tests,
  unchanged)
- `npm test -- cap06/runner-caps`, `npm test -- cap06/cap-exceptions`, `npm test -- cap06/copilot-runner`
- `npm test -- cap06/release-check`, `npm test -- unit/replay`
- `npm run replay -- suite`, `npm run replay -- --all`
- `npm run package`, `npm test`, `npm run check`, `npm run bench`

## Done when

- [ ] Both tables hold the construct `glob-prose` with the detector `\bGlob\b` and the fourteen variants, `file-inspection` included; the generated OpenCode and Copilot `sdd-conventions` skill and every agent that inlines it carry the target's `file-inspection` text, which names neither `Glob` nor `Bash`; the OpenCode doctor tests `.sdd/` without `glob`; C002-TC-673 (five rows), 674 and 120 (five rows) pass; the Claude Code text is unchanged and `npm run check` is green
- [ ] The OpenCode runner and the doctor machine configurations put the pinned binary first on the host's PATH as C002-IF-010 §4 orders it; C002-TC-676 passes
- [ ] `run.mjs` refuses a cap above 0.50 USD unless an exception matches the row's ID, case file and host, runs `TS-634` of `evals/targets/gate/TS-634.eval.mjs` on OpenCode at 1.00 USD (the cap of this task; C002-T-056 step X0 raises it to 2.00 USD), passes every row's caps to `runSession` without a clamp and records them as `caps` in every result record; C002-TC-614, 677 and 679 pass; no other case file sets a cap above 0.50 USD
- [ ] The Copilot CLI runner passes `--model` from the session agent's file or the case; C002-TC-678, 680 and 912 … 916 pass; `dist/copilot/INSTALL.md` carries the one Copilot CLI note and no `GITHUB_COPILOT_PROMPT_MODE_REPO_HOOKS`; C002-TC-306 passes
- [ ] Replay reports list the cases of the platform rule under `not_applicable` with the rule `platforms`, decided before the capability rule; the release check refuses a report replayed on another platform than `win32` with one ERR-REL-012 line and checks it no further, accepts the platform-rule cases under the rule `platforms` and refuses every other handling; C002-TC-681, 682, 683, 637 (16 rows as planned; 13 rows, defect D-021 item 2), 667 and 668 (24 rows) pass; the regenerated replay reports show 0 differing decisions
- [ ] Every start of the table of C002-IF-007 §Executable lookup goes through the one resolver of `src/io/paths.ts` and runs its match by absolute path: the probes, `git` of the `gate` commands, `serena`, the server's commands and `taskkill`; C002-TC-675 (eight rows), 684, 685, 686 and 687 pass; no stub planted in a working folder or repository records a start; the CHG-001 gate tests (C001-TC-801, 805, 808, 809, 810, 813, 814, 816, 818, 819) and the existing `mcp/shell`, `cli/serena-user-data`, `cap10` and host-version tests pass without edits
- [ ] Carried: C002-TC-511 and C002-TC-634 (paid OpenCode reruns) to C002-T-056; the conductor-model check of C002-TC-615 to C002-T-054
- [ ] The task report lists the items that needed no code change (the OpenCode spend accounting, the Copilot CLI options), every bare-name start that step 7 found and moved, and names this task as the follow-up of C002-T-013, C002-T-014, C002-T-019, C002-T-028, C002-T-038, C002-T-044, C002-T-045, C002-T-047 and C002-T-064 and of CHG-001's gate code
- [ ] Progress reported: `sdd task set C002-T-065 --status done --commit <sha>`
