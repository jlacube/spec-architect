---
id: C002-T-066
title: "Catch-up for revision D-026, D-027: Copilot CLI model substitution, session_model and agent_models, fail-closed injection-summary merge, install-notes fallback, checklist models_used"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-045, C002-T-046, C002-T-047, C002-T-065]
implements: [C002-REQ-304, C002-REQ-612, C002-REQ-614, C002-REQ-615, C002-REQ-617, C002-NFR-203]
satisfies_ac: [C002-AC-304.1, C002-AC-612.1, C002-AC-614.1, C002-AC-615.1, C002-AC-617.1]
verified_by: [C002-TS-680, C002-TS-691, C002-TS-692, C002-TS-693, C002-TS-306, C002-TS-617, C002-TS-618, C002-TC-680, C002-TC-691, C002-TC-692, C002-TC-693, C002-TC-306, C002-TC-617, C002-TC-618]
components: [C002-COMP-002, C002-COMP-004, C002-COMP-009, C002-COMP-011]
risk_refs: [C002-RISK-026, C002-RISK-036, C002-RISK-022]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-066 — Catch-up for revision D-026, D-027: Copilot CLI model substitution, session_model and agent_models, fail-closed injection-summary merge, install-notes fallback, checklist models_used

## Intent

The spec revision for defects D-026 (findings of C002-T-049) and D-027 (findings of C002-T-054)
changed contracts that done tasks implemented (P-01 answers Q-copilot-opus-01 "accept Sonnet" and
Q-copilot-map-01 "Keep opus, note fallback (Recommended)", `../../10-spec/questions-log.md` round
2026-10-21 (2)). Done tasks are not reopened. This task brings the eval harness, the Copilot install
notes, the VS Code checklist and its record template to the revised contracts, and is recorded as the
follow-up of C002-T-045, C002-T-046, C002-T-047 and C002-T-065. It runs **no paid session**: every
runner case uses a stub host; the Copilot CLI release rows belong to C002-T-054. The schema copy
`docs/releases/release-record.schema.json` (entries with `result` and `models`) was done by the
architect in commit 68bd52c; this task does not touch it.

The work has five parts, the fifth **(e)** the backfill of `result` and `models` into the committed
OpenCode injection summary of C002-T-049, without a session (P-01 answer to Q-inj-result-01,
"Backfill, no spend (Recommended)"; C002-DOD-009). The first four: **(a)** the run's model substitution `--copilot-model` and
`SDD_EVAL_COPILOT_MODEL` with its checks before any session (C002-IF-010 §1); **(b)** the model rule
of the Copilot CLI runner with `session_model` and `agent_models` in its results (C002-IF-010 §2
model rule, §3); **(c)** the injection summary from the per-host injection case sets, merged
fail-closed, with the test seam `deps.releasesRoot` (C002-IF-010 §5.1, §5.2); **(d)** the models
statement and the refusal sentence of the Copilot install notes (C002-IF-005 §5 Models) and
`models_used` in the checklist and its record template (C002-IF-009 §4 Models used).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `evals/harness/run.mjs` › `parseArgs`, `main` | (a) the option `--copilot-model <from>=<to>[,<from>=<to>…]`, else the variable `SDD_EVAL_COPILOT_MODEL`, read only on `--host copilot-cli`, the option before the variable; before any session, exit code 1 with the C002-IF-010 §1 lines for the option on another host and for a value not of the form (each model ID of letters, digits, `.`, `_` and `-`; each `<from>` once), the source named `--copilot-model` or `SDD_EVAL_COPILOT_MODEL` and the value as given; the parsed substitution handed to the Copilot CLI runner through the harness context |
| modify | `evals/harness/runners/copilot-cli.mjs` › `agentModel` and the session start (about line 680) | (b) the model rule of C002-IF-010 §2: chosen model from the case, else the agent file's `model` (source `case` or `agent file`); passed model after the substitution; `--model <passed>` once, also for a relayed agent; a session agent whose file has no `model` field, in a row without one, ends before the host starts with `end_reason` `error` and the error text `no model field in agents/<agent>.agent.md` |
| modify | `evals/harness/runners/copilot-cli.mjs` › session result | (b) `session_model` `{ agent, chosen, source, substitution, passed, used }` and `agent_models` `{ "<agent>": [<model ID>, …] }` from the JSON events' assistant messages, agents named as C002-IF-010 §3 "Agent names on Copilot CLI" names them; `used` empty when the host made no model call (a refused `--model`) |
| modify | `evals/harness/run.mjs` › the result records | (b) `session_model` and `agent_models` written into each result record of a Copilot CLI row, as `models` is |
| modify | `evals/harness/run.mjs` › `injectionSummary`, `INJECTION_SOURCES` and the summary write after the run (about lines 381 … 396 and 525 … 536) | (c) the injection case set per host by row ID and case file (`INJ-01` … `INJ-22` of `evals/injection/injection.eval.mjs`; on `copilot-cli` also `TS-359` of `evals/targets/copilot-guard/TS-359.eval.mjs`; C002-IF-010 §5.1, §5.2); the "When" rule (a paid run, or a stub-host run with the seam, on `opencode` or `copilot-cli`, with at least one row of the set started; on `copilot-cli` only while `plugins/architect/targets/copilot.json` gives `sdd-mcp-server`; never on `claude-code`); the merge rules 1 … 5 of §5.2 (base, base refused with its five problem texts and the different-host-versions text, entries of the run with `result` and `models`, kept entries, write in ascending `id` order); rule 3 as revised for plan critic CR-53: a run's entry replaces a base entry only when that entry gives `acted_upon` `false`, and is added when the base has none; a base entry acted upon is final for the package version: when its row started a session in the run, whatever the session gave, the entry is kept with its `result` and `models`, one standard-error line `eval: injection summary keeps <id> acted upon (<path>): a later session does not clear it; a new package version starts a new summary` per such row in ascending `id` order, the run's other entries merged and written by rule 5, and exit code 1 (also when every session passed); `<r>` + `<k>` = `<n>` in the standard-output line, the kept acted-upon entries counted in `<k>`; validation against `$defs/injectionSummary` of `docs/releases/release-record.schema.json` before the write, with the validator the release check uses (C002-T-047); the standard-output line `injection summary: <path> (<n> cases, <a> acted upon; <r> from this run, <k> kept)` and the standard-error line `eval: injection summary not written (<path>): <problem>; the file is unchanged` with exit code 1 |
| modify | `evals/harness/run.mjs` › `main` (`deps`) | (c) the test seam `deps.releasesRoot` of C002-IF-010 §5.2: version and Copilot enforcement mode read under that folder, the summary written there, paths in the lines and `result` relative to it, result files under `<releasesRoot>/evals/results/` unless `--results-dir` is given; the summary rules apply with or without `deps.stopRule`; with `deps.releasesRoot` and no replaced runner of the run's `--host`, exit code 1 before any session with `eval: a releases root applies to a stub-host run only; no session started`; no option and no variable sets it |
| add | `tests/integration/cap06/injection-summary.test.ts` | (c) C002-TC-691 (six rows, the no-base row first, and the supporting tests: the seam refusal, and the entry acted upon kept by a passing session with the `keeps` line and exit code 1), C002-TC-692 (nine rows, the `target` and `tier` rows included), C002-TC-693 (two rows), on fx-evals-injection built in a temporary folder by the test; one `test()` per Examples row whose name starts with its TS ID; row 2 of C002-TC-691 waits for the alignment of C002-TS-691 with C002-IF-010 §5.2 rule 3 [NEEDS CLARIFICATION: Q-ts691-acted-01] |
| modify | `tests/integration/cap06/copilot-runner.test.ts` | (a), (b) C002-TC-680, thirteen rows (today three), through `main` of `run.mjs` with the stub Copilot CLI host and, for the two `--host opencode` rows, the stub OpenCode host; supporting tests: the agent file without a `model` field, and `agent_models` with a subagent that has assistant messages |
| modify | `plugins/architect/targets/copilot/install.md` | (d) with the prerequisite on the Claude models of the three tiers, the models statement of C002-IF-005 §5 Models (the host runs an agent whose model the plan does not offer on its default model, Sonnet at the tested versions, so the opus-tier agents run a tier below their own; where P-03 sees the model that ran: in VS Code the chat's model picker, on Copilot CLI the file that `--usage-output-file` writes), naming the tier and no model ID; and in the one Copilot CLI note after the steps the sentence that Copilot CLI refuses a `--model` the plan does not offer before the session starts and that P-03 then names a model the plan offers, on which the conductor runs; no other Copilot CLI setting, no `GITHUB_COPILOT_PROMPT_MODE_REPO_HOOKS` |
| modify | `tests/integration/cap03/package.test.ts` | (d) C002-TC-306: the two models lines, the models statement without `claude-opus-5.5` and `claude-sonnet-5.5`, and the refusal sentence of the Copilot CLI note, on the generated `dist/copilot/INSTALL.md` |
| modify | `docs/checklists/vscode-copilot.md` | (d) the fresh-install step records in `models_used` the model ID that VS Code showed for the turns of `sdd-conductor`, or `not shown`, and whether VS Code showed it where the install notes say it does (C002-TS-617); no step added, removed or renumbered, so the step index and the release check's step check are unchanged |
| modify | `docs/checklists/records/TEMPLATE.md` | (d) the field `models_used` (mapping from agent name as VS Code shows it to a model ID or `not shown`) with the key `sdd-conductor`, in the place C002-IF-009 §4 shows it |
| modify | `docs/releases/opencode/0.0.1/injection.json` | (e) backfill, no session (P-01 answer to Q-inj-result-01, "Backfill, no spend (Recommended)"): each of the 22 entries gets `result`, the repository-relative path of its row's counted `t049-INJ-*` result file under `evals/results/`, and `models`, the `models` of that result record; `id`, `acted_upon`, the entry count, their order and every other field unchanged |
| modify | `tests/integration/cap06/checklist.test.ts` | (d) C002-TC-617 (the fresh-install step's `models_used` Then line) and the template check of C002-TC-618 (`models_used` holds the key `sdd-conductor`) |

## Preconditions

- C002-T-045, C002-T-046, C002-T-047 and C002-T-065 done.
- G2 re-approved after the D-026/D-027 revision (gate records of `../../change.md`).
- REF-WIN as for C002-T-065. No paid session: every runner case uses a stub host, and the tests
  write only into temporary folders (the repository's `docs/releases/` is never written by a test).

## Step outline (no production code)

1. Write or adjust the test cases first, each Examples row its own `test()` whose name starts with
   its TS ID. Watch C002-TC-680 rows 4 … 13, C002-TC-691 … 693, the new lines of C002-TC-306, the
   `models_used` line of C002-TC-617 and the template check of C002-TC-618 fail against today's code;
   rows 1 … 3 of C002-TC-680 already pass apart from the `session_model` assertions (the task report
   says which).
2. **(a) Substitution.** Parse `--copilot-model`, else read `SDD_EVAL_COPILOT_MODEL` on
   `--host copilot-cli` only; check host, form, model-ID characters and the unique `<from>` before
   the cap-exception check, so a refused run starts no stub and writes no ledger entry; hand the
   substitution to the runner through the harness context. Run C002-TC-680 rows 9 … 13.
3. **(b) Model rule and results.** Take the chosen model from the case or the agent file, apply the
   substitution, pass `--model` once; end a session agent without a `model` field before the host
   starts; build `session_model` and `agent_models` from the JSON events and write both into the
   result records. Run C002-TC-680 rows 1 … 8 and its supporting tests, then the whole of
   `npm test -- cap06/copilot-runner` (C002-TC-912 … 916 unchanged).
4. **(c) Injection summary.** Replace the `INJ-*` pattern by the case sets of C002-IF-010 §5.1 keyed
   by row ID and case file; add the "When" rule (mode from the Copilot table, none on `claude-code`),
   the merge rules 1 … 5 with the schema validation, the two log lines and exit code 1 of a refused
   base after the sessions, rule 3 as revised (an entry acted upon is final for the package version:
   kept whatever a later session of its row gives, the `keeps` line per row, the other entries
   merged and written, exit code 1), and the seam `deps.releasesRoot` with its refusal. A refused base keeps the
   result files and ledger entries of the run's sessions (§5.2 rule 2). Run C002-TC-691 … 693, then
   `npm test -- cap06/runner-caps` and `npm test -- cap06/cap-exceptions` (C002-TC-614, 677, 679,
   917 … 919 unchanged: the stop-rule tests run without the seam and write no summary).
5. **(d) Install notes.** Add the models statement and the refusal sentence to
   `plugins/architect/targets/copilot/install.md`; do not edit any Claude Code text (C002-CON-10).
   Regenerate with `npm run package` and run C002-TC-306; no committed golden file holds the install
   notes today, so a test that compares a generated Copilot file with a stored copy is updated with
   the regenerated text and named in the task report. The Claude Code package is byte-unchanged.
6. **(d) Checklist and template.** Add the `models_used` instruction to the fresh-install step and the
   field to `records/TEMPLATE.md`; run C002-TC-617 and the template check of C002-TC-618, then
   `npm test -- cap06/release-check`: the release check does not read `models_used` and refuses
   nothing for it (C002-IF-009 §4 Models used), so a record carrying it still gives `released` in the
   clean fx-release rows.
7. Run `npm test`, `npm run replay -- suite` and `npm run check`. Report the commit: it moves the
   release-candidate commit of C002-T-048 (harness and Copilot package changed), so C002-T-054 re-runs
   C002-T-048 step 5 and its own steps 1 and 2 at it before its paid step 3, and C002-T-052 re-runs
   C002-T-048 step 5 and C002-T-049 steps 1 and 2 at it before its release check (plan critic CR-52).
8. **(e) Backfill of the OpenCode summary** (P-01 answer to Q-inj-result-01; C002-DOD-009). With a
   one-off script run from the repository root (kept out of the shipped code; no session, no ledger
   entry): for each entry of `docs/releases/opencode/0.0.1/injection.json`, find its row's counted
   session of C002-T-049 step 3, the `openrouter` ledger entry of `evals/results/spend-chg002.json`
   for task C002-T-049 and that row whose `valid_run` is not `false` (one per `INJ-*` row, none was
   rerun), and its result file `evals/results/t049-<id>-*.json`; refuse when a row has no such file
   or more than one, or when the file's pass result does not give the entry's `acted_upon`. Copy the
   file's repository-relative path (`/` separators) into `result` and its record's `models` into
   `models`. Before writing, check that the entry count (22), the `id` values, their order and every
   `acted_upon` value equal the committed file's, and validate the summary against
   `$defs/injectionSummary` of `docs/releases/release-record.schema.json` with the release check's
   validator; write nothing on any mismatch. Then run `node scripts/release-check.mjs --target
   opencode --dry-run` (outcome `released`, as in C002-T-049). The task report lists the 22 `result`
   paths, the `models` per entry, the check results and the dry-run outcome, and states that no
   session ran.

## Verification

- `npm test -- cap06/copilot-runner`, `npm test -- cap06/injection-summary`
- `npm test -- cap06/runner-caps`, `npm test -- cap06/cap-exceptions`
- `npm test -- cap03/package`, `npm test -- cap06/checklist`, `npm test -- cap06/release-check`
- `npm run package`, `npm test`, `npm run check`
- Step 8: `node scripts/release-check.mjs --target opencode --dry-run` after the backfill

## Done when

- [ ] `run.mjs` reads `--copilot-model`, else `SDD_EVAL_COPILOT_MODEL`, on `--host copilot-cli` only, and refuses the option on another host and a value not of the `<from>=<to>[,<from>=<to>…]` form before any session; C002-TC-680 rows 9 … 13 pass
- [ ] The Copilot CLI runner passes `--model` by the model rule of C002-IF-010 §2, ends a session agent without a `model` field before the host starts, and every Copilot CLI result record gives `session_model` and `agent_models`; C002-TC-680 (thirteen rows) and C002-TC-912 … 916 pass
- [ ] `run.mjs` writes the injection summary from the host's injection case set (`TS-359` on Copilot CLI), merges a run of fewer rows into the existing summary, refuses a base it cannot merge with nothing written and exit code 1, never replaces a base entry acted upon (the `keeps` line and exit code 1, the other entries written; C002-IF-010 §5.2 rule 3, plan critic CR-53), gives each entry `result` and `models`, validates before the write, writes no Copilot summary under `copilot-hooks` and none on `claude-code`, and honours `deps.releasesRoot` only for a stub-host run; C002-TC-691, 692 and 693 pass, with the supporting seam-refusal test
- [ ] `dist/copilot/INSTALL.md` carries the models statement (tier named, no model ID) and the refusal sentence of the Copilot CLI note; C002-TC-306 passes; the Claude Code text is unchanged and `npm run check` is green
- [ ] The checklist's fresh-install step records `models_used` and the record template holds it with the key `sdd-conductor`; C002-TC-617 and the template check of C002-TC-618 pass; the release-check tests pass unchanged
- [ ] `docs/releases/opencode/0.0.1/injection.json` gives every one of its 22 entries the `result` and `models` of its row's counted C002-T-049 session, with the entry count, the `id` values and every `acted_upon` value unchanged, validates against `$defs/injectionSummary`, and the OpenCode release-check dry run still gives `released`; the backfill and its checks are in the task report
- [ ] Carried: C002-TC-615 and C002-TC-359 (paid Copilot CLI rows) to C002-T-054; the review of the executed record for C002-TC-618 to C002-T-050
- [ ] The task report names this task as the follow-up of C002-T-045, C002-T-046, C002-T-047 and C002-T-065, and lists the items that needed no code change
- [ ] Progress reported: `sdd task set C002-T-066 --status done --commit <sha>`
