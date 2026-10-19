---
id: C002-T-063
title: "Catch-up for revision D-010 … D-014: install sources, plugin-root detector, doctor description and hooks row, replay expectations"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-019, C002-T-027, C002-T-029, C002-T-035, C002-T-038, C002-T-040, C002-T-042, C002-T-058, C002-T-061]
implements: [C002-REQ-103, C002-REQ-104, C002-REQ-216, C002-REQ-322, C002-REQ-323, C002-REQ-324, C002-REQ-326, C002-REQ-405, C002-REQ-501, C002-REQ-505, C002-REQ-509, C002-REQ-510, C002-REQ-602, C002-REQ-604, C002-REQ-606]
satisfies_ac: [C002-AC-103.1, C002-AC-104.1, C002-AC-216.1, C002-AC-322.1, C002-AC-323.1, C002-AC-324.1, C002-AC-326.1, C002-AC-405.1, C002-AC-501.1, C002-AC-505.1, C002-AC-509.1, C002-AC-510.1, C002-AC-602.1, C002-AC-604.1, C002-AC-606.1]
verified_by: [C002-TS-343, C002-TS-345, C002-TS-347, C002-TS-349, C002-TS-659, C002-TS-664, C002-TS-657, C002-TS-658, C002-TS-516, C002-TS-526, C002-TS-660, C002-TS-606, C002-TS-226, C002-TS-502, C002-TS-509, C002-TS-515, C002-TS-609, C002-TS-661, C002-TC-343, C002-TC-345, C002-TC-347, C002-TC-349, C002-TC-659, C002-TC-664, C002-TC-657, C002-TC-658, C002-TC-516, C002-TC-526, C002-TC-660, C002-TC-606, C002-TC-226, C002-TC-502, C002-TC-509, C002-TC-515, C002-TC-609, C002-TC-661]
components: [C002-COMP-018, C002-COMP-001, C002-COMP-002, C002-COMP-007, C002-COMP-015, C002-COMP-005, C002-COMP-008, C002-COMP-010]
risk_refs: [C002-RISK-001, C002-RISK-022, C002-RISK-025, C002-RISK-030]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-063 — Catch-up for revision D-010 … D-014: install sources, plugin-root detector, doctor description and hooks row, replay expectations

## Intent

The spec revision for defects D-010 … D-014 (`../revision-D010-D014-digest.md`; P-01 answers
Q-hooks-row-01 and Q-safety-08 in `../../10-spec/questions-log.md`) changed contracts that done tasks
already implemented: C002-T-019, C002-T-026 … C002-T-029, C002-T-035, C002-T-038 and C002-T-058. Done
tasks are not reopened. This task brings their code, tables, wiring and tests to the revised
contracts, and is recorded as the follow-up of C002-T-038 and C002-T-058. It also re-baselines the
replay expectations of C002-IF-009 §2.1 and §2.3, so that C002-T-041 can reach 0 differing decisions.
The CLI catalogue mirror of ERR-CLI-021 and ERR-CLI-022 (`src/cli/errors.ts`) already follows the
revised errors.md (commit 0c6c7bf; the three `--agents` reasons of ERR-CLI-022 in commit ad664e3);
this task does not touch it.

**Critic review of the revision (architect commit ad664e3, test-designer commit df0d9e6).** Four
more follow-ups land here, on the code of the same done tasks: (h) the `hooks` line of
`sdd host-version` falls back to the user settings only when the workspace settings file is missing
(critic CR-45; code of C002-T-014); (i) the install takes its agent names from the guard hook's
`--agents` (critic CR-50; code of C002-T-058); (j) the `opencode-permissions` replay adapter sends
Edit and MultiEdit shell cases as `write` (critic CR-48; code of C002-T-042); (k) the Copilot doctor's
`ok` Version text names the profile and `.code-workspace` settings it does not read (critic CR-45;
the wiring of item (d)).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/cli/install-copilot.ts` › `loadPackage` | (a) `scripts/sdd.mjs` is a required source file, named last in the order of C002-IF-005 §3; a missing one refuses with ERR-CLI-022 `source file missing: scripts/sdd.mjs` (or in the `source files missing: <files>` list) before any write. Check the other ERR-CLI-022 reasons of errors.md §5 against the code (folder missing, manifest not an object, no `package_version`, no agent file listed, `install/mcp.json` or `install/hooks.template.json` unparsable, no `servers` object, no PreToolUse entry) and change only a reason whose text differs. (i) The agent names come from the template (C002-IF-007 §Install step 1, revised for critic CR-50): the `PreToolUse` entries of `install/hooks.template.json` hold exactly one `hook guard` command with a non-empty `--agents` value, split at commas with blank names dropped as the hook splits it; the manifest's `files` list `agents/<name>.agent.md` for every name and no `agents/<name>.agent.md` whose name is not among them. Each failure refuses before any write with its ERR-CLI-022 reason of errors.md §5 (`install/hooks.template.json has no single hook guard command with --agents`; `architect-target.json does not list <files>, which --agents names`, in `--agents` order; `architect-target.json lists <files>, which --agents does not name`, in manifest order). The agents written are the files of those names, in manifest order; the header comment names the template as the source of the agent list |
| modify | `tests/integration/cap03/install.test.ts` | (a) the revised and new rows: C002-TC-343 (`unchanged .vscode/mcp.json`, `unchanged .github/architect-install.json`), C002-TC-345 (every Examples row with its reason text, `scripts/sdd.mjs` missing, the four pkg-cp variants of (i): a guard command without `--agents`, two PreToolUse entries each with a `hook guard --agents` command, a manifest without `agents/sdd-critic.agent.md`, a manifest that also lists `agents/my-helper.agent.md`; and nothing written into the `--package` folder), C002-TC-347 (`written .vscode/mcp.json`), C002-TC-349 (the two non-object rows with their detail texts), C002-TC-659 (injected failure of the fourth write: one ERR-CLI-017 line with `(already written: …)` in write order, exit 3) and C002-TC-664 (the next run completes the install) |
| modify | `plugins/architect/targets/copilot.json` › construct `plugin-root` | (b) `detect` becomes the pattern of step 3: every `${PLUGIN_ROOT}` spelling is a leak, `/scripts/sdd.mjs` included (C002-IF-001 §2 row `${CLAUDE_PLUGIN_ROOT}`) |
| modify | `scripts/generate/translate/constructs.ts` › `GLOSSARY` | (b) the `plugin-root` stand-in detector uses the same pattern as (b) above; (c) a new stand-in `doctor-description` (context `frontmatter`) for the host list of `commands/doctor.md` |
| modify | `plugins/architect/targets/opencode.json`, `plugins/architect/targets/copilot.json` › `constructs` | (c) one `doctor-description` entry each, context `frontmatter`, action `replace`, with the host-list text of C002-IF-001 §2 for that target |
| modify | `tests/integration/cap01/constructs.test.ts` | (c) C002-TC-657 (the generated doctor description per target, read from the tables; no `Claude Code`) and C002-TC-658 (fixture `fx-plugin-nodesc`: ERR-GEN-001 on `commands/doctor.md` line 2, target `copilot` only) |
| modify | `plugins/architect/targets/copilot/wiring/doctor-report.md` | (d) Copilot hooks row per C002-IF-006 §2: `hooks enabled` → `ok` with the Version text `chat.useHooks on; profile and .code-workspace settings, Workspace Trust and organisation policy not read, confirmed by the manual VS Code checklist` and an empty Fix ((k), revised for critic CR-45); `hooks disabled (chat.useHooks)` → `error`, Version `disabled (chat.useHooks)`; `hooks unknown` or no `hooks` line → `error`, Version `cannot be read`. The `.cmd`-shim rule names the mode through `{{enforcement_mode}}` (C002-IF-006 §2); change it only if it does not |
| modify | `plugins/architect/targets/copilot/wiring/doctor-remedies-host.md` | (d), (k) the Copilot hooks remedies row states the same check: `chat.useHooks` on; profile and `.code-workspace` settings, Workspace Trust and organisation policy not read |
| modify | `tests/integration/cap05/doctor-variants.test.ts` | (d), (k) the generated Copilot doctor body holds the three hooks-row cases of (d), the `ok` case with the Version text of (k), in both Copilot modes |
| modify | `evals/targets/doctor/TS-526.eval.mjs`, `TS-509.eval.mjs`, `TS-515.eval.mjs` | (d), (h) TS-526 expects Version `cannot be read` and its Fix in each of its three rows per mode: no workspace `.vscode/settings.json` and no user settings; a workspace file that cannot be parsed (`{ "chat.useHooks": tru`) beside user settings with `true`; a workspace file with `"chat.useHooks": "yes"` beside user settings with `true`; TS-509 Claude Code row without a PATH `sdd` expects `completed with warnings`, and its OpenCode row and every TS-515 row use the OpenCode package generated for native permission enforcement. No paid run here: the rows run in C002-T-045 and C002-T-056 |
| modify | `src/cli/host-version.ts` › `useHooks`, `hooksState` and the header comment (lines 10–13) | (h) C002-IF-007 `host-version` Output, revised for critic CR-45 (code at about lines 104–125): the workspace `.vscode/settings.json` is read first; only a missing file, or a file without the key, leads to the user settings of the default profile. A workspace file that exists but cannot be read, does not parse, has no object at its top level, or holds `chat.useHooks` with a value other than `true` or `false` gives `hooks unknown`, without reading the user settings. The user settings keep their rule (any outcome other than `true` or `false` is `hooks unknown`). The header comment names the settings not read (other profiles, `.code-workspace`, Workspace Trust, organisation policy) |
| modify | `tests/integration/cli/host-version.test.ts` | (h) tests of the probe for the new C002-TS-526 rows: an unparsable workspace file and a workspace file with `"chat.useHooks": "yes"`, each beside user settings with `true`, give `hooks unknown`; a missing workspace file, and a workspace file without the key, still fall back to the user settings (supports C002-TC-526, an eval case) |
| modify | `tests/replay/adapters/opencode-permissions.ts` › `callOf`, shell branch | (j) C002-IF-009 §2.2 row "Write, Edit, MultiEdit, NotebookEdit, Read, Glob, Grep" (revised for critic CR-48): Edit and MultiEdit shell cases are sent as `write` with the command text as `filePath` and a one-line `content`, like Write and NotebookEdit, not as `edit`, so that the permission rule decides and no edit-target file is needed for them; Read stays `read` with `filePath`, Glob and Grep stay `glob` and `grep` with `pattern` |
| modify | `tests/replay/expect.ts` | (e) the three rows of C002-IF-009 §2.1 added for D-014, in table order before the last row: shell-corpus write-tool cases `deny` on every mechanism (source `C001-REQ-1103`); the `${CLAUDE_PLUGIN_DATA}` Serena cases of the row's list `deny` on `sdd-mcp-server` only (`C002-REQ-517`); the linked-`cwd` cases PG-135 and PG-136 `deny` on `sdd-mcp-server` only (`C002-REQ-401`); `ExpectedSource` gains `C001-REQ-1103`, `C002-REQ-401` and `C002-REQ-517` |
| modify | `tests/unit/replay/expect.test.ts` | (e) one test per new row and per mechanism, from the case IDs the row names |
| modify | `tests/replay/adapters/sdd-mcp-server.ts` › `ALLOWED_REFUSAL` | (e) adds `ERR-MCP-003`: a refusal after the boundary allowed the call reads as `allow`, with the I/O error in `detail` (C002-IF-009 §2.3) |
| modify | `tests/replay/scenarios/suite.test.ts` | (e) C002-TC-609 gains the two planted rows of the revised C002-TS-609 |
| modify | `docs/releases/release-record.schema.json` | (e) byte copy of `../../10-spec/50-interfaces/release-record.schema.json` (new `expected_source` values and their conditions, `hooks_state` required for a released Copilot record); the schema-copy equality test of C002-T-006 passes |
| modify | `docs/releases/opencode/0.0.1/replay-*.json`, `docs/releases/copilot/0.0.1/replay-*.json` | (e) regenerated by `npm run replay` against the revised expectations; each validates against the schema copy |
| modify | `tests/integration/cap06/structure-checks.test.ts` | the revised C002-TC-606 rows (`edit/*`, `new`, `runCommands`, `runTasks`, `vscode`, `vscode/runCommand`, `edit/createFile`, `runInTerminal`, `shell`), with the tool sets read from the check's data (C002-IF-005 §6.1), and `${PLUGIN_ROOT}/scripts/sdd.mjs` reported by the table detector; `scripts/check/targets/*.mjs` changes only for a row that fails |
| modify | `tests/replay/scenarios/opencode-host.test.ts` | C002-TC-226: the built-ins of OpenCode 1.18.31 `init`, `review`, `customize-opencode`, bound to no Architect agent, and `architect-init` beside `init` |
| modify | `tests/integration/mcp/shell.test.ts` | (g) adds C002-TC-660; the server's guard call does not expand `${CLAUDE_PLUGIN_DATA}` (code of commit 5b4392b, `decideBash(…, { expands: false })`), so the code is expected to need no change |
| modify | `src/hooks/guard-bash.ts` › header comment | (f) optional: the comment names `serena-launch` with or without `--read-only`, as BG-381 and C002-IF-008 §1.1 allow; no rule changes |

## Preconditions

- C002-T-019, C002-T-027, C002-T-029, C002-T-035, C002-T-038, C002-T-040, C002-T-042, C002-T-058 and
  C002-T-061 done. The replay adapters of C002-T-041 exist (commit 5b4392b); C002-T-041 is not done
  and waits for this task.
- G2 re-approved after the D-010 … D-014 revision.
- For the conditional paid row of step 5: `--auth subscription` (test plan §4.1 "Eval auth"); a run
  with `--auth api-key` needs P-01's decision first.

## Step outline (no production code)

1. Write or adjust the test cases first, each Examples row its own `test()` whose name starts with
   its TS ID (test plan §1). Watch C002-TC-345 (`scripts/sdd.mjs` row), C002-TC-657, C002-TC-658 and
   the C002-TC-606 rows fail where the code lags.
2. **(a) Install sources.** Add `scripts/sdd.mjs` to the required source files of `loadPackage` and
   name it in the missing-files reason. Run the install rows. C002-TC-659 makes the fourth write
   fail through a fault-injection point on the install's writes that only tests can set (add one if
   C002-T-058 left none), and C002-TC-664 runs again without it. **(i) Agent names.** Read the
   agent names from the single `hook guard … --agents` command of the template, compare them with
   the manifest's agent files both ways, and refuse with the three reasons of errors.md §5; run the
   four new C002-TC-345 variants, each with nothing written.
3. **(b) Plugin-root detector.** Set the Copilot `plugin-root` pattern and the `GLOSSARY` stand-in to
   exactly `\$\{PLUGIN_ROOT\}|\$\{CLAUDE_PLUGIN_ROOT\}(?!/templates/|/scripts/sdd\.mjs)` (JSON-escaped
   in the table), so `${PLUGIN_ROOT}/scripts/sdd.mjs` is found by the table detector and by the
   generator, not only by TGT-PORT-001's direct check. Leave the OpenCode pattern unchanged.
4. **(c) Doctor description.** Add the `doctor-description` entries and the stand-in. A table
   without the entry stops generation with ERR-GEN-001 on the description (C002-REQ-104). The source
   `commands/doctor.md` stays byte-unchanged (C002-CON-10, C002-RISK-022).
5. **(d) Doctor hooks row.** Edit the two Copilot wiring files, then regenerate and run
   `cap05/doctor-variants`. Update the three eval case files; their paid rows run in their carrying
   tasks (C002-TS-526 in C002-T-045, C002-TS-509 and C002-TS-515 OpenCode rows in C002-T-056; the
   C002-TS-516 rows in the checklist run of C002-T-050). **(h) Probe.** Change `hooksState` so that
   only a missing workspace file, or one without the key, leads to the user settings; run
   `cli/host-version` with the two new fixtures (unparsable, `"yes"`) and the fallback rows. **(k)**
   The `ok` Version text of the wiring is the C002-IF-006 §2 text with the profile and
   `.code-workspace` settings. **Paid run, only if needed:** when the
   Claude Code row "no `sdd` executable on PATH" of `TS-509.eval.mjs` changes its assertion (C002-T-038
   step 4 ran it against the old text), run that one row once on E-CC with `--auth subscription`, at
   most one rerun after a failure, and add the session to the ledger with its `provider` and `auth`
   (test plan §4.1, §4.2). When the assertion is unchanged, no session runs.
6. **(e) Replay expectations.** Add the three §2.1 rows and the `ExpectedSource` values to
   `expect.ts`; the release check (C002-T-047) imports them and never copies them. Add `ERR-MCP-003`
   to `ALLOWED_REFUSAL`. Copy the schema to `docs/releases/`. Re-run
   `npm run replay -- --mechanism sdd-mcp-server` (both targets), `--mechanism copilot-hooks` and
   `--mechanism opencode-permissions`, and write the four reports. **(j)** Before the
   `opencode-permissions` run, send the Edit and MultiEdit shell cases as `write` in `callOf`. A case that still differs is a
   product defect or a spec defect, never a new expectation: name it in the task report.
7. **TS-606, TS-226, TS-502.** Run the revised rows. Change `scripts/check/targets/*.mjs` only for a
   TS-606 row that fails. C002-TC-502 already compares both copies (C002-T-061 report); check that
   its test name and fixture follow the revised wording (`003-export`).
8. **(f), (g).** Correct the guard header comment if it still says `--read-only` is required. Add
   C002-TC-660 and confirm that no folder named `${CLAUDE_PLUGIN_DATA}` appears in the fixture and
   no `serena_config.yml` under `C:/fx-data`.
9. Run `npm run check`, so the D-013 detector and the new construct pass the target structure step.

## Verification

- `npm test -- cap03/install`, `npm test -- cap01/constructs`, `npm test -- cap05/doctor-variants`
- `npm test -- cap06/structure-checks`, `npm test -- mcp/shell`, `npm test -- npm-build/npm-staging`
- `npm test -- unit/replay`, `npm test -- tests/guards` and `npm run bench` (guard cores unchanged)
- `npm run replay -- suite`, `npm run replay -- opencode-host`
- `npm run replay -- --mechanism sdd-mcp-server`, `npm run replay -- --mechanism copilot-hooks`,
  `npm run replay -- --mechanism opencode-permissions`
- `npm test -- cli/host-version`
- `npm run check`
- Only for step 5's paid row: `node evals/harness/run.mjs --host claude-code --tier dev --filter evals/targets/doctor/TS-509.eval.mjs --auth subscription` (with `--only` for that Examples row)

## Done when

- [ ] C002-TC-343, 345 (the four `--agents` variants of (i) included), 347, 349, 659 and 664 pass; every refusal leaves `.github/`, `.vscode/`, `<package>/hooks.json` and `<package>/plugin.json` as they were
- [ ] C002-TC-657 and C002-TC-658 pass; `commands/doctor.md` is byte-unchanged; `npm run check` reports no TGT-PORT-001 finding the table detector misses
- [ ] `sdd host-version` gives `hooks unknown` for an unusable workspace settings file without reading the user settings ((h)); `cli/host-version` passes
- [ ] The generated Copilot doctor shows the hooks row of C002-IF-006 §2 in both modes, the `ok` row with the Version text of (k); the case files of C002-TC-509, 515 and 526 follow the revised rows (carried: their paid runs to C002-T-045 and C002-T-056, C002-TC-516 to C002-T-050)
- [ ] C002-TC-606, 226, 502, 609 and 660 pass
- [ ] `docs/releases/release-record.schema.json` equals the spec copy; the four reports under `docs/releases/*/0.0.1/` are regenerated and validate; `sdd-mcp-server` (both targets), `copilot-hooks` and `opencode-permissions` (Edit and MultiEdit shell cases sent as `write`, (j)) show 0 differing decisions, or the task report names each remaining case as a defect
- [ ] The task report lists which items needed no code change ((a) reasons, (d) `.cmd`-shim rule, (g)) and names this task as the follow-up of C002-T-038 and C002-T-058, and for (h) and (j) of C002-T-014 and C002-T-042
- [ ] Progress reported: `sdd task set C002-T-063 --status done --commit <sha>`
