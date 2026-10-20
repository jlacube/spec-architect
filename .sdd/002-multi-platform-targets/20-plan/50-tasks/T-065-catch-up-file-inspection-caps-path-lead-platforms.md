---
id: C002-T-065
title: "Catch-up for revision D-018 … D-020: file-inspection variant and glob-prose construct, spend-cap exceptions, PATH lead, Copilot CLI model, platform rule"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-028, C002-T-038, C002-T-044, C002-T-045, C002-T-047, C002-T-064]
implements: [C002-REQ-111, C002-REQ-112, C002-REQ-507, C002-REQ-508, C002-REQ-606, C002-REQ-608, C002-REQ-610, C002-REQ-611, C002-REQ-612, C002-REQ-618, C002-REQ-627, C002-NFR-105]
satisfies_ac: [C002-AC-111.1, C002-AC-112.1, C002-AC-507.1, C002-AC-508.1, C002-AC-606.1, C002-AC-608.1, C002-AC-610.1, C002-AC-611.1, C002-AC-612.1, C002-AC-618.1, C002-AC-627.1]
verified_by: [C002-TS-673, C002-TS-674, C002-TS-120, C002-TS-675, C002-TS-676, C002-TS-677, C002-TS-678, C002-TS-679, C002-TS-680, C002-TS-681, C002-TS-682, C002-TS-637, C002-TS-667, C002-TS-668, C002-TS-511, C002-TS-634, C002-TC-673, C002-TC-674, C002-TC-120, C002-TC-675, C002-TC-676, C002-TC-677, C002-TC-678, C002-TC-679, C002-TC-680, C002-TC-912, C002-TC-913, C002-TC-914, C002-TC-915, C002-TC-916, C002-TC-681, C002-TC-682, C002-TC-637, C002-TC-667, C002-TC-668, C002-TC-511, C002-TC-634]
components: [C002-COMP-001, C002-COMP-002, C002-COMP-003, C002-COMP-004, C002-COMP-008, C002-COMP-009, C002-COMP-010, C002-COMP-015, C002-COMP-016]
risk_refs: [C002-RISK-034, C002-RISK-022, C002-RISK-015, C002-RISK-026]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-065 — Catch-up for revision D-018 … D-020: file-inspection variant and glob-prose construct, spend-cap exceptions, PATH lead, Copilot CLI model, platform rule

## Intent

The spec revision for defects D-018 (findings of C002-T-064), D-019 (findings of C002-T-045 on
Copilot CLI 1.0.98) and D-020 (findings of C002-T-056 on OpenCode 1.18.31) changed contracts that
done tasks already implemented (P-01 answers Q-opencode-glob-01 "Guide agents (Recommended)",
Q-ts634-budget-01 "Budget exception $1" and Q-cli-model-01 "Pass --model (Recommended)", and the
conductor's answer to Q-replay-rule-01, to be confirmed at G2; `../../10-spec/questions-log.md`
rounds 2026-10-20 and 2026-10-20 (2)). Done tasks are not reopened. This task brings their tables,
wiring, code and tests to the revised contracts and is recorded as the follow-up of C002-T-028,
C002-T-038, C002-T-044, C002-T-045, C002-T-047 and C002-T-064. It runs **no paid session**: the
reruns of C002-TC-511 and C002-TC-634 belong to C002-T-056, and the Copilot CLI release rows to
C002-T-054. The release-check catalogue mirror of ERR-REL-012 and the schema copy
`docs/releases/release-record.schema.json` were done by the architect (commit 4c0f7c6); this task
does not touch them.

The work has five parts: **(a)** the construct `glob-prose` and the variant `file-inspection` on both
targets, and the OpenCode `doctor-probe` test for `.sdd/` (C002-IF-001 §2, §2.1, §6.1 Dot folders;
D-020 item 1); **(b)** the PATH lead of the pinned OpenCode binary and the test of `sdd host-version`
on a PATH with two installs (C002-IF-010 §4 PATH lead, C002-IF-007 `host-version`; D-020 item 4);
**(c)** the spend-cap rule and the cap exceptions (C002-IF-010 §2.2; D-020 items 2 and 3);
**(d)** the Copilot CLI runner: `--model` from the session agent's file, the runner rules of D-019
covered by test cases, and the model note of the Copilot install notes (C002-IF-010 §2, §3, §4,
C002-IF-005 §5; D-019 items 1 … 7); **(e)** the platform rule of the replay report and the release
check, and the revised rows of C002-TS-637, C002-TS-667 and C002-TS-668 (C002-IF-009 §2.1, §4, §5;
D-018 items 1 … 3).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/targets/opencode.json`, `plugins/architect/targets/copilot.json` › `constructs` | (a) the construct `glob-prose`: kind `tool-name`, detector the word `Glob` in a body (contexts `body` only, so the frontmatter `tools` entry stays a tool-mapping case), action `variant_required` (C002-IF-001 §2 row "`Glob` in prose") |
| modify | `plugins/architect/targets/opencode.json`, `plugins/architect/targets/copilot.json` › `variants` | (a) the fourteenth variant `file-inspection`: file `skills/sdd-conventions/SKILL.md`, anchor `lines` = the three lines 16 … 18 of the file-inspection rule exactly as the source holds them, `text_file` `file-inspection.md` (C002-IF-001 §2.1). Both tables name the same fourteen variants |
| add | `plugins/architect/targets/opencode/wiring/file-inspection.md` | (a) the OpenCode text of C002-IF-001 §6.1 Dot folders: `read`, `glob` and `grep` for inspecting files; `sdd status` (through `bash`, or `{{server_shell}}` under sdd MCP server enforcement) and `read` for finding files under `.sdd/`; `grep` with a `path` inside `.sdd/` for text in it; `glob` never used to find or rule out a `.sdd/` file, and an empty `glob` or `grep` result no proof of absence; the command-tool rule (allowlisted commands only, one per call, no `;`, `&&` or redirection) in OpenCode's tool names for both modes. The text names neither `Glob` nor `Bash` (C002-TS-674 row 1) |
| add | `plugins/architect/targets/copilot/wiring/file-inspection.md` | (a) the Copilot text of C002-IF-001 §6.1 "Copilot: not recorded": `read` and `search` for inspecting files; `sdd status` through the command tool of the package's mode and `read` of a file by its path for finding files under `.sdd/`; an empty `search` result no proof of absence; the command-tool rule in Copilot's tool names for both modes; neither `Glob` nor `Bash` (C002-TS-674 row 2) |
| modify | `plugins/architect/targets/opencode/wiring/doctor-probe.md` | (a) the test whether `.sdd/` exists is `sdd status` or `read` of `.sdd/`; no instruction to call `glob` on `.sdd/` (C002-IF-001 §2.1 `doctor-probe`; C002-TS-674 row 3; the cause of the C002-TS-511 failure in C002-T-056) |
| modify | `scripts/generate/translate/constructs.ts` › `GLOSSARY` | (a) the stand-in detector `glob-prose` with `anchor: true`, as for `claude-host` and `plugin-root` (used when a table has no construct of that id), so a fixture table that lacks the construct still makes a body line naming `Glob` an anchor |
| modify | `tests/integration/cap01/wiring.test.ts` | (a) C002-TC-673 (three rows on fx-plugin-glob-prose), C002-TC-674 (three rows on fx-src), the new row `fx-plugin-novariant-glob` of C002-TC-120; one `test()` per Examples row whose name starts with its TS ID; the two new fixtures are built by the tests in a temporary folder from fx-src, as the other `fx-plugin-novariant-*` fixtures are (test plan §2) |
| modify | `evals/harness/runners/opencode.mjs` › `driverHost` | (b) the PATH lead of C002-IF-010 §4: the folder of the pinned host binary right after the run's own `bin` folder when the case gives no PATH; a case PATH is taken as the machine configuration built it (below), with no second lead added; no lead for a case whose configuration removes OpenCode |
| modify | `evals/harness/machines.mjs` › `machine`, `withPath` | (b) a `lead` folder placed right after the folders the case prepends (its version shims) and before the configuration's own folders; the Git Bash env file applies the same order; a configuration that removes OpenCode gets no lead |
| modify | `evals/targets/doctor/doctor-cases.mjs` › `doctorCase` | (b) the OpenCode rows pass the pinned binary's folder (from the harness configuration of C002-ADR-005) as that lead to `machine`; the Claude Code and Copilot CLI rows are unchanged |
| modify | `tests/integration/cli/host-version.test.ts` | (b) C002-TC-675: three rows, `opencode.exe` and `opencode.cmd` shims in two folders of the CLI process's PATH, `sdd host-version opencode` prints the version of the first; no code change is expected in `src/cli/` (C002-IF-007 `host-version` describes the present lookup); a row that fails is a defect against C002-T-014's code, reported in the task report and fixed here |
| modify | `tests/integration/cap06/runner-caps.test.ts` | (b) C002-TC-676; (c) C002-TC-677 on the stub OpenCode host with per-step costs and a parallel subagent step |
| modify | `evals/harness/runners/opencode.mjs` › spend accounting | (c) only for a row of C002-TC-677 that fails: the cost of every finished step of the session agent and of its subagents is added, the sum compared with the cap after each step, the session aborted at once when the sum reaches the cap, and a subagent step that finishes before the abort takes effect still counted |
| modify | `evals/harness/run.mjs` (the `maxBudgetUsd: Math.min(…, 0.5)` clamp, about line 79), `evals/harness/caps.mjs` | (c) the cap-exception check of C002-IF-010 §2.2: a table of the exceptions in force (row `TS-634`, host `opencode`, 1.00 USD) next to `DEFAULT_MAX_BUDGET_USD`; before any session, a selected row whose `maxBudgetUsd` is above 0.50 and that the table does not list for the run's `--host` at a cap of at least the row's value ends the run with exit code 1 and the row's ID in the message; a listed row runs with its own cap; the clamp to 0.50 goes. The harness does not count the exception's runs (§2.2) |
| modify | `evals/targets/gate/TS-634.eval.mjs` | (c) the OpenCode row's `maxBudgetUsd` 1.0 (today 0.5), nothing else |
| add | `tests/integration/cap06/cap-exceptions.test.ts` | (c) C002-TC-679, six rows on fx-evals-caps with a stub host per `--host`, through `node evals/harness/run.mjs --host <host> --only <row>` |
| modify | `evals/harness/runners/copilot-cli.mjs` › the session start (about line 653) | (d) `--model <model>`: the case's `model` when given, else the `model` field of the session agent's file `agents/<agent>.agent.md` in the package copy (`architect:` prefix removed for the file name; C002-IF-010 §2 `model`). The flag is passed once, also for a relayed session agent |
| modify | `evals/harness/runners/copilot-cli.mjs` | (d) only for a row of C002-TC-678 or C002-TC-912 … 916 that fails (the code of C002-T-045 already passes the options of C002-IF-010 §4 and maps the agent names) |
| modify | `tests/integration/cap06/copilot-runner.test.ts` | (d) C002-TC-678 and C002-TC-680; C002-TC-912 … 916 extend the C002-T-045 tests that the test plan names, with the assertions the test plan lists as missing (the `prompt-file` harness record, `COPILOT_AUTO_UPDATE=false`, the `hooks` event from the host log) |
| modify | `plugins/architect/targets/copilot/install.md` | (d) the note of C002-IF-005 §5 after the six steps: Copilot CLI is no supported host; a P-03 who runs the conductor there passes `--model` with the `model` of `agents/sdd-conductor.agent.md`, since Copilot CLI 1.0.98 runs the session agent on its default model; the specialists run on their own files' models |
| modify | `tests/replay/expect.ts` › `expectationOf` (about line 95) | (e) the platform rule of C002-IF-009 §2.1: a case that falls to the last row and whose `platforms` list does not name the replay host's platform is `{ applicable: false, rule: "platforms" }` on every mechanism, in place of today's `omitted` expectation; the rows above it are unchanged, so a memory case limited to another platform stays `deny` (C002-REQ-625) |
| modify | `tests/replay/suite.ts`, `tests/replay/report.ts`, `tests/replay/main.ts` (the replay suite writer) | (e) a case of the platform rule goes into the report's `not_applicable` with `id`, `corpus`, `category` and the rule `platforms`, for every mechanism, `opencode-permissions` included (schema copy of commit 4c0f7c6); it is no longer an omitted case, and `npm run replay` no longer fails on it |
| modify | `scripts/release/replay.ts` (about lines 100 … 147) | (e) ERR-REL-012 as revised: a case of the platform rule is accepted under `not_applicable` with the rule `platforms`; replayed it is named under `replays cases that its mechanism excludes`, left out under `omits cases`; a case of an earlier row of §2.1 (the memory case `PG-901`) listed with the rule `platforms`, and a case of the platform rule listed with any other rule (Q-replay-rule-01), are named under `lists cases as not applicable without a rule` |
| modify | `tests/integration/cap06/fx-release.ts` | (e) the fx-release corpora: `PG-900` of category `outside` (today `traversal`) and the added memory case `PG-901`, both limited by `platforms` to `linux`; the clean reports list `PG-900` under `not_applicable` with the rule `platforms` and replay `PG-901` with `deny` and the source `C002-REQ-625` |
| modify | `tests/integration/cap06/release-check.test.ts` | (e) C002-TC-637 (the four platform rows of the revised Examples), C002-TC-682 (two rows) and its supporting test for Q-replay-rule-01, the three added rows of C002-TC-668 (24 rows in all) |
| modify | `tests/replay/scenarios/suite.test.ts` | (e) C002-TC-681 on fx-corpus-platforms, one test per Examples row (the `@mode-native` row on the pinned OpenCode 1.18.31 with the stub model) |
| modify | `tests/unit/replay/adapters.test.ts` | (e) C002-TC-667: the stub answers the `replace_text` call of `PG-050`, and each row also asserts that the stub received one `replace_text` call and no `write_file` call (D-018 item 1) |
| modify | `docs/releases/opencode/0.0.1/replay-*.json`, `docs/releases/copilot/0.0.1/replay-*.json` | (e) only if a regenerated report differs: the present corpora name `win32` in every `platforms` list, so no case moves to `not_applicable` on REF-WIN |

## Preconditions

- C002-T-028, C002-T-038, C002-T-044, C002-T-045, C002-T-047 and C002-T-064 done; C002-T-056 is
  in progress and waits for this task (C002-TC-511 and C002-TC-634).
- G2 re-approved after the D-018 … D-020 revision (gate records of `../../change.md`), with
  Q-replay-rule-01 confirmed or changed by P-01 at G2.
- REF-WIN with the pinned OpenCode 1.18.31 binary and Node.js 22.22.2 or later for the
  `@mode-native` row of C002-TC-681 (E-OC). No paid session: every runner case uses a stub host.

## Step outline (no production code)

1. Write or adjust the test cases first, each Examples row its own `test()` whose name starts with
   its TS ID (C002-TC-912 … 916 start with their TC ID). Watch C002-TC-673, 674, 676, 679, 680, 681,
   682 and the platform rows of C002-TC-637 fail against today's code; C002-TC-675, 677, 678, 668 and
   912 … 916 may already pass (the task report says which).
2. **(a) Construct and variant.** Add `glob-prose` and `file-inspection` to both tables and the
   stand-in detector to `GLOSSARY`. Write the two `file-inspection.md` texts from C002-IF-001 §6.1,
   checking each against the "holds" and "excludes" cells of C002-TS-674. Change the OpenCode
   `doctor-probe.md` test for `.sdd/`. Do not edit `skills/sdd-conventions/SKILL.md` or any other
   Claude Code text (C002-CON-10). Run `npm run package`, then C002-TC-673, 674 and 120, and
   `npm run check`: the target structure check and the inlining budget of C002-NFR-104 stay green
   (every agent inlines the skill), and the Claude Code package is byte-unchanged.
3. **(b) PATH lead.** Add the lead to `driverHost` and to `machine`, pass it from `doctorCase` for
   the OpenCode rows, and write C002-TC-676 with a stubbed host start that records the host process's
   environment, then runs `sdd host-version opencode` with that PATH and the shims of the row. Write
   C002-TC-675 against the bundled CLI.
4. **(c) Caps.** Add the exception table and the check before any session; remove the clamp; set the
   TS-634 OpenCode row's cap to 1.00 USD. Write C002-TC-677 (stub host with step-finish costs and a
   parallel subagent step) and C002-TC-679 (fx-evals-caps); change the spend accounting only for a
   row that fails. Confirm that every other case file under `evals/` sets no `maxBudgetUsd` above
   0.50 (C002-TC-679 also reads them) and name any in the task report.
5. **(d) Copilot CLI runner.** Pass `--model` from the session agent's file; write C002-TC-680 and
   C002-TC-678 against the stub host; extend the C002-T-045 tests for C002-TC-912 … 916 with the
   missing assertions. Add the model note to the Copilot install notes and regenerate
   (`npm run package`), so that `dist/copilot/INSTALL.md` carries it.
6. **(e) Platform rule.** Change `expectationOf`, the replay suite writer and the release check's
   replay part; update fx-release (`PG-900` category `outside`, `PG-901` added). Run C002-TC-681,
   C002-TC-637, C002-TC-682 with the supporting Q-replay-rule-01 test, the three new rows of
   C002-TC-668 and C002-TC-667. Run `npm run replay -- --all` on REF-WIN for both targets: 0 differing
   decisions and an unchanged not-applicable list (no present case is limited away from `win32`);
   rewrite a report under `docs/releases/` only if it differs.
7. Run `npm test`, `npm run replay`, `npm run check` and `npm run bench` (generation p95 of
   C002-NFR-103 within 5 s with the added variant).

## Verification

- `npm test -- cap01/wiring`, `npm test -- cli/host-version`
- `npm test -- cap06/runner-caps`, `npm test -- cap06/cap-exceptions`, `npm test -- cap06/copilot-runner`
- `npm test -- cap06/release-check`, `npm test -- unit/replay`
- `npm run replay -- suite`, `npm run replay -- --all`
- `npm run package`, `npm test`, `npm run check`, `npm run bench`

## Done when

- [ ] Both tables hold the construct `glob-prose` and the fourteen variants, `file-inspection` included; the generated OpenCode and Copilot `sdd-conventions` skill and every agent that inlines it carry the target's `file-inspection` text, which names neither `Glob` nor `Bash`; the OpenCode doctor tests `.sdd/` without `glob`; C002-TC-673, 674 and 120 (five rows) pass; the Claude Code text is unchanged and `npm run check` is green
- [ ] The OpenCode runner and the doctor machine configurations put the pinned binary first on the host's PATH as C002-IF-010 §4 orders it; C002-TC-675 and 676 pass
- [ ] `run.mjs` refuses a cap above 0.50 USD without an exception for the row and host, and runs `TS-634` on OpenCode at 1.00 USD; C002-TC-677 and 679 pass; no other case file sets a cap above 0.50 USD
- [ ] The Copilot CLI runner passes `--model` from the session agent's file or the case; C002-TC-678, 680 and 912 … 916 pass; `dist/copilot/INSTALL.md` carries the Copilot CLI model note
- [ ] Replay reports list the cases of the platform rule under `not_applicable` with the rule `platforms`; the release check accepts them there and refuses the other handlings; C002-TC-681, 682, 637 (all rows), 667 and 668 (24 rows) pass; the regenerated replay reports show 0 differing decisions
- [ ] Carried: C002-TC-511 and C002-TC-634 (paid OpenCode reruns) to C002-T-056; the conductor-model check of C002-TC-615 to C002-T-054
- [ ] The task report lists the items that needed no code change (the `src/cli/` lookup of C002-TC-675, the OpenCode spend accounting, the Copilot CLI options) and names this task as the follow-up of C002-T-028, C002-T-038, C002-T-044, C002-T-045, C002-T-047 and C002-T-064
- [ ] Progress reported: `sdd task set C002-T-065 --status done --commit <sha>`
