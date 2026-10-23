---
id: C002-T-067
title: "Fix for revision D-023 item 2, D-024, D-028: OpenCode ripwire map rule and deny summary, partial-spend reconciliation from the OpenRouter key usage, key redaction"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: in-progress
depends_on: [C002-T-030, C002-T-043, C002-T-056, C002-T-066]
implements: [C002-REQ-207, C002-REQ-503, C002-REQ-612, C002-REQ-614, C002-REQ-617, C002-REQ-638, C002-REQ-639, C002-REQ-640, C002-REQ-641]
satisfies_ac: [C002-AC-207.1, C002-AC-503.1, C002-AC-612.1, C002-AC-614.1, C002-AC-617.1, C002-AC-638.1, C002-AC-639.1, C002-AC-640.1, C002-AC-641.1]
verified_by: [C002-TS-209, C002-TS-505, C002-TS-617, C002-TS-680, C002-TS-691, C002-TS-692, C002-TS-695, C002-TS-696, C002-TS-697, C002-TS-698, C002-TS-699, C002-TS-700, C002-TS-701, C002-TC-209, C002-TC-505, C002-TC-617, C002-TC-680, C002-TC-691, C002-TC-692, C002-TC-921, C002-TC-922, C002-TC-923, C002-TC-924, C002-TC-925, C002-TC-926, C002-TC-927]
components: [C002-COMP-001, C002-COMP-002, C002-COMP-009, C002-COMP-011, C002-COMP-012]
risk_refs: [C002-RISK-001, C002-RISK-015, C002-RISK-037]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-067 — Fix for revision D-023 item 2, D-024, D-028: OpenCode ripwire map rule and deny summary, partial-spend reconciliation from the OpenRouter key usage, key redaction

## Intent

The spec revision for defects D-024, D-028 and D-023 item 2, with the fixes of its critic review
(spec CR-85 … CR-97), changes code of done tasks. It follows P-01's answers to Q-c002-defects-01
("Fix most, defer D-023(1) (Recommended)"), Q-key-redact-01 ("Redact host text too (Recommended)")
and Q-model-refusal-01 ("Count as no-run (Recommended)"); see `../questions-log.md` round
2026-10-23. Done tasks are not reopened. This task is the follow-up of C002-T-030 and C002-T-043
(OpenCode native rules and their gap list), of C002-T-056 step X0 (ledger and stop rule) and of
C002-T-066 (injection-summary merge, Copilot CLI model rule, checklist).

It has three parts:
- **(a)** D-024: the bounded ripwire default map in the OpenCode native `bash` rules, with its gap
  row as a characterization check, the guard export `RIPWIRE_MAP_BOUND` and the deny summary text
  (C002-IF-001 §6.3, C002-IF-008 §1).
- **(b)** D-023 item 2: the reconciliation of a `partial` OpenCode spend from the OpenRouter key
  usage (a settled before-read after a recent session, `ended_at`, the 0.9 × bound, the read
  schedule), the stays-partial cases, the key check with one refusal text per case, the key
  redaction, and the run folder of a paid session deleted with `SDD_EVAL_KEEP_RUN` refused
  (C002-IF-010 §2.3, §4).
- **(c)** D-028 and its critic fixes in the merge of `run.mjs`: rule 3 fail-closed for a record
  without `end_reason` (CR-94), and the missing-model refusal of Copilot CLI counted as a no-run
  refusal of the second form (CR-95). The rest of D-028 is test rows for behaviour that C002-T-066
  implemented (C002-IF-009 §4, C002-IF-010 §2 model rule, §5.2).

It runs **no paid session**. Every new test uses a stub host or a stubbed host start, and a stubbed
key usage read (`deps.keyUsage`), so no request reaches `openrouter.ai`.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/hooks/guard-bash.ts` › `RIPWIRE_MAP_BOUND` (new export), `ripwire()` | (a) export the map bound `"--max-tokens"` as a third constant beside `RIPWIRE_VALUE_VERBS` and `RIPWIRE_FLAG_VERBS`; `ripwire()` reads it in place of its literal. Both verb lists keep their values, and `--test-gate` stays out of the value list (C002-IF-001 §6.3 ripwire rules; C002-CON-06). No decision changes |
| modify | `src/hooks/guard-bash.ts` › the `Allowed:` summary text (about line 32) | (a) `ripwire read verbs` becomes `ripwire read verbs or the bounded default map`. The rest of the text stays byte-equal to C002-IF-008 §1. The same text reaches the Claude Code hook, the sdd MCP server command tool and the Copilot guard hooks through the one core |
| modify | `scripts/generate/emit/opencode-permissions.ts` › `bashRules()` | (a) one rule `ripwire *--max-tokens=*` `allow`, built from `RIPWIRE_MAP_BOUND`, after the flag-verb rules and before the `ast-grep` rule; no rule that names `--token-budget` (C002-IF-001 §6.3 ripwire rules table) |
| modify | `scripts/generate/emit/opencode-permissions.ts` › `GLOB_GAPS` | (a) the ripwire verb-form entry follows the revised gap row (BG-449, BG-451 as examples). One new entry for the default-map form: glob `ripwire *--max-tokens=*`, effect false allow, examples BG-448, BG-443 and BG-447, with BG-442 and BG-444 still denied (C002-IF-001 §6.3, What a glob cannot express) |
| modify | `plugins/architect/targets/opencode.json` › `permissions.native-permissions.bash` | (a) the same rule at the same place as `bashRules()`, so the table check gives no ERR-GEN-004 (C002-IF-004) |
| modify | `tests/fixtures/targets/opencode-native-permissions.json`, `opencode-sdd-mcp-server.json`, `opencode-gap-no-lsp.json` | (a) the native `bash` list of each golden table gains the rule at the same place; nothing else changes |
| modify | `tests/integration/cap02/permissions.test.ts` | (a) the native rule list holds `ripwire *--max-tokens=*` once, after the verb rules and before `ast-grep`, read from `RIPWIRE_MAP_BOUND`; no rule names `--token-budget`; the decision loop gains `ripwire . --max-tokens=4000` (allow) and `ripwire . --token-budget=4000` (deny). The **characterization check** of the ripwire gap (critic CR-88), the supporting test of C002-TC-209: `GLOB_GAPS` holds the default-map entry, and the generated native rules allow BG-448, BG-443 and BG-447 as known false allows while BG-442 and BG-444 stay denied. The test records the gap; it is no expectation of C002-REQ-207 |
| modify | `tests/replay/scenarios/opencode-host.test.ts` | (a) C002-TC-209: the two ripwire rows of C002-TS-209 (nine rows) |
| modify | `tests/integration/cli/guard-message.test.ts` | (a) C002-TC-505: the `Allowed:` summary names `ripwire read verbs or the bounded default map` |
| modify | `evals/harness/run.mjs` › `main` (`deps.keyUsage`), the paid OpenCode session step, `ledgerEntry` and the ledger write | (b) the before-read, the after-reads, the settle rule, the reconciled entry fields, the standard-output line and the three `stays partial` lines of C002-IF-010 §2.3, in the order of §2.3 item 3 (before the stop rule of the next session or the end of the run). In detail: **`ended_at`** (the session's end, ISO 8601 UTC) in every OpenCode ledger entry that `run.mjs` writes; the **before-read** by the previous session's `ended_at` (one read when it ended 20 minutes or more before, or there is none; else the previous session's settled after-read when no session ran since, or a wait read at once and then every 60 s, none later than 20 minutes after the previous end, settled without a bound); the **after-reads** at 60 s … 1200 s after the session's end, at most 20; the **settle bound** `U0` + 0.9 × `usage.usd`. The test seam `deps.keyUsage` `{ read, intervalMs, limitMs }` replaces the 60 s and the 20 minutes in both waits, and with a stub host acts only together with `deps.stopRule` `true`; no option and no variable sets it |
| modify | `evals/harness/run.mjs` › `main`, before any session | (b) on `--host opencode` with the real runner, `SDD_EVAL_KEEP_RUN` set to a non-empty value ends the run before any session with exit code 1 and the line `eval: SDD_EVAL_KEEP_RUN applies to stub-host runs only: the run folder of a paid OpenCode session holds host files that are not redacted; no session started` (C002-IF-010 §4 Run folder of a paid session). Stub-host runs and the Copilot CLI runner keep the switch |
| modify | `evals/harness/run.mjs` › `injectionSummary`, merge rule 3 and the no-run refusal test | (c) rule 3: a session record without `end_reason` is not `completed`, so its entry reads acted upon (fail-closed; critic CR-94). No-run refusal: the common criteria, then either the host-refusal form (`spend` `reported`, `usage.usd` 0) or the missing-model form on Copilot CLI (`error` `no model field in agents/<agent>.agent.md`, `session_model.passed` `null`, `spend` `unreported`, `copilot_usage` `null`), so such a session gives no entry, removes none, locks nothing and prints the `no entry for <id>` line (C002-IF-010 §5.2 No-run refusal; critic CR-95) |
| modify | `evals/harness/runners/copilot-cli.mjs` › the missing-model refusal record | (c) only if C002-TC-680 row 14 shows a field missing: the record gives `session_model.passed` `null` and `copilot_usage` `null` besides the fields of C002-T-066 |
| add | `evals/harness/` › the key usage reader (a module or a function of `run.mjs`) | (b) `GET https://openrouter.ai/api/v1/key` with `Authorization: Bearer <key>` as its only credential header and a 30 s timeout. A read fails on no response, a status other than 200, or a `data.usage` that is not a finite number of at least 0. The reader keeps `data.usage` only, never `data.label`. A failure carries a reason, never the request, its headers or the response body |
| modify | `evals/harness/runners/opencode.mjs` › the key file read and the paid-session entry | (b) the key check of C002-IF-010 §4 Key check, before any use of the key: before the before-read and before the host process starts. The key value is the file's whole content with the white space at its ends removed. One refusal text per case (critic CR-58, spec CR-85), each on standard error, with no session started, no key usage read and the path of the key file, never the key: **missing file** → `paid OpenCode session refused: no OpenRouter key in <key file>`, the text that the runner ships today, unchanged; **empty value (only white space), shorter than 20 characters, or holding `"`, `\` or a control character (a line break included, so a file of two lines)** → `paid OpenCode session refused: the OpenRouter key in <key file> is shorter than 20 characters or holds a character that JSON escapes`. The checked key is the one the host process and the reads get |
| modify | `evals/harness/runners/opencode.mjs` › the run folder of a paid session | (b) delete the run folder, with the host's isolated data folders, when the session ends, after an error too (C002-IF-010 §4 Run folder of a paid session) |
| modify | `evals/harness/run.mjs` and `evals/harness/runners/opencode.mjs` › every writer of standard output, standard error, result records, result files, transcripts, ledger entries and logs on `--host opencode` | (b) every occurrence of the exact key value replaced with `[REDACTED]` in each complete line or file before it is written, after any JSON encoding. This covers host events, error texts, tool output, model messages and any host file the runner copies or quotes (C002-IF-010 §4 Key redaction) |
| add | `tests/integration/cap06/spend-reconciliation.test.ts` | (b) C002-TC-921 (eight rows), C002-TC-922, C002-TC-923 (four rows), C002-TC-924 (four rows), C002-TC-925 (six rows), C002-TC-926 (two rows) and C002-TC-927 (three rows), on fx-evals-caps with the case file `evals/targets/caps/reconcile.eval.mjs` (rows `REC-00`, `REC-01`, `REC-02`) built by the test, a temporary ledger and a temporary home folder; one `test()` per Examples row whose name starts with its TS ID; the supporting test of `SDD_EVAL_KEEP_RUN` and of the deleted run folder |
| add | `tests/unit/evals/key-usage.test.ts` | (b) the request-level supporting tests of C002-TC-924 (test plan §8; critic CR-59), with a stubbed fetch and no socket |
| modify | `tests/integration/cap06/checklist.test.ts` | (c) C002-TC-617: the `models_used` instruction in the Record of `VSC-02` and the `note` instruction (D-028 items 1 and 2), in place of the fresh-install-step assertion |
| modify | `docs/checklists/vscode-copilot.md` › the Record of `VSC-02` | (c) only if the C002-TC-617 test shows a missing part of the two instructions of C002-TS-617; no step added, removed or renumbered, so the step index and the release check's step check are unchanged |
| modify | `tests/integration/cap06/copilot-runner.test.ts` | (c) C002-TC-680 row 14, the missing-model refusal after `copilot --version`, now a no-run refusal of the second form (D-028 item 6; CR-95) |
| modify | `tests/integration/cap06/injection-summary.test.ts` | (c) C002-TC-691 rows 4 and 7 (a `turn cap` end with a passing result document; a missing-model refusal of `INJ-19` that gives no entry); C002-TC-692 row 5 (a base that fails two checks) and, on every row, no second `not written` line; the supporting test of rule 3 for a record without `end_reason` |

## Preconditions

- C002-T-030, C002-T-043, C002-T-056 and C002-T-066 done (all are).
- G2 re-approved after the D-023 item 2, D-024, D-028 revision and its critic fixes, and G3 after
  this plan revision (gate records of `../../change.md`).
- REF-WIN with Node.js 22.22.2 or later. For C002-TC-209, the replay environment E-OC with the
  pinned OpenCode 1.18.31 and the loopback stub model (no network, no spend). The tests write only
  into temporary folders. The repository's ledger `evals/results/spend-chg002.json`, `docs/releases/`
  and P-01's key file are never read or written by a test.
- **No order against the releases** (P-01 answer to Q-t067-order-01, "No dependency
  (Recommended)"). C002-T-052 and C002-T-055 do not depend on this task (`../10-strategy.md` §2, row
  "Fix task for the D-023 item 2, D-024, D-028 revision"). This task's commit changes the bundled
  CLI (the deny summary) and a generator input (the OpenCode table), so it moves the
  release-candidate commit of C002-T-048. A release task whose release check runs after this commit
  first re-runs the unpaid steps at the new commit, as after C002-T-066 (plan critic CR-52):
  C002-T-048 step 5, then C002-T-049 steps 1 and 2 for OpenCode or C002-T-054 steps 1 and 2 for
  Copilot. No paid row reruns: no session of the release evidence changes.

## Step outline (no production code)

1. **Tests first.** Write or adjust every case of `verified_by`, each Examples row its own `test()`
   whose name starts with its TS ID, and watch them fail against today's code: C002-TC-921 … 927,
   the ripwire rows of C002-TC-209 and its characterization check, the summary of C002-TC-505, the
   new assertions of `permissions.test.ts`, C002-TC-680 row 14, C002-TC-691 row 7 and the rule-3
   test without `end_reason`. The other D-028 rows (C002-TC-617, 691 row 4, 692 row 5) are expected
   to pass at once, since C002-T-066 implemented their behaviour. The task report says which passed
   without a code change and names any that did not.
2. **(a) Guard export and summary.** Add `RIPWIRE_MAP_BOUND` and read it in `ripwire()`; change the
   summary text. Run `npm test -- tests/guards` (the bash corpus unchanged: no decision moves,
   C002-RISK-001), C002-TC-505, the CHG-001 guard tests that read the summary (`cap11/TS-1107`,
   `TS-1108`; regression-set §3), and `npm run bench` (guard p95 ≤ 300 ms).
3. **(a) Native rules and gap rows.** Add the default-map rule to `bashRules()` from the export, the
   gap entries to `GLOB_GAPS`, and the rule to the OpenCode table and the three golden tables.
   - Run `npm test -- cap02/permissions` with the characterization check, and the table check
     (`npm run check`, no ERR-GEN-004).
   - Run `npm run replay -- opencode-host` for C002-TC-209 on the pinned host: the map under
     `--max-tokens` allowed, and under `--token-budget` only denied.
   - Run `npm run replay -- suite`. The `opencode-permissions` development report may now list the
     gap cases of the default-map form as differing, which is the expected gap of C002-IF-001 §6.3.
     The `sdd-mcp-server` and `copilot-hooks` reports stay at 0 differing decisions.
   - Run `npm run package`. The OpenCode package of the `sdd-mcp-server` mode differs only where
     the table file and the bundled CLI enter it (manifest `source_digest`, the summary text); it
     gains no `bash` rule. The S-07 record stays as it is (`bash_rules_match_shell_corpus: false`,
     mode `sdd-mcp-server`).
4. **(b) Key check, redaction and run folder.** Move the key read of the OpenCode runner ahead of
   every use. Keep the missing-file text, and add the second refusal text for an empty, short or
   unsafe value (Targets, key check row; critic CR-58). Route every write of the runner and of
   `run.mjs` on `--host opencode` through one redaction of the exact key value, applied to the
   complete line or file after JSON encoding. Delete the paid session's run folder at its end, and
   refuse `SDD_EVAL_KEEP_RUN` on the real OpenCode runner before any session. The task report lists
   each writer that now goes through the redaction, and each host file the runner copies or quotes.
   Run C002-TC-925 (six rows), C002-TC-924 row 4, the `SDD_EVAL_KEEP_RUN` and run-folder supporting
   tests, and C002-TC-907 (missing key file and host environment; its missing-file text is
   unchanged).
5. **(b) Key usage reader.** Add the reader with its failure reasons, and run the supporting unit
   cases of `tests/unit/evals/key-usage.test.ts`.
6. **(b) Reconciliation.** In the paid OpenCode session step of `run.mjs`, after the stop rule
   allows the session and the key check passes:
   - **Before-read.** Take `U0` and its time by the previous session's `ended_at` (Targets, the
     `run.mjs` row). An entry without `ended_at` is left out. A failed or unsettled before-read is
     kept with its reason, and the session still runs.
   - **Entry.** Write every OpenCode entry with `ended_at`. After a session whose result gives
     `spend` `partial`, write the entry with `cost_source` `partial` as today.
   - **After-reads.** When `U0` exists, read at `intervalMs`, 2 × `intervalMs`, … up to `limitMs`
     after the session's end, passing over a failed read. Settle at the first successful read that
     equals the latest earlier successful after-read (never the before-read), when its value is at
     least `U0` + 0.9 × `usage.usd`, compared with the 1e-9 tolerance that `stopRule` uses: 17.2400
     + 0.9 × 0.60 = 17.7800 settles (C002-TS-695), and 17.7700 does not (C002-TS-697).
   - **Outcome.** On a settle, rewrite the entry with `cost_usd`, `cost_source` `openrouter key usage
     delta`, `cost_usd_recorded` and `openrouter_usage` (C002-IF-010 §2.3 Reconciled cost), keep the
     settled value for the next before-read, and print the `ledger: <id> reconciled …` line with
     four decimals. Otherwise print the `stays partial` line with the reason of its case (three
     reasons, C002-IF-010 §2.3 When it stays partial; only for a session that ends `partial`) and
     leave the entry.
   - **Unchanged.** The result record and the result file are never changed by this step, and the
     cap records stay as written: the done-check of a capped session decides its overshoot bound
     from the delta (C002-IF-010 §2.2). Only then does the stop rule of the next session run.
   - **Tests.** Run C002-TC-921 … 923, C002-TC-926, C002-TC-927 and C002-TC-924 rows 1 … 3. Then run
     `npm test -- cap06/runner-caps`, `npm test -- cap06/cap-exceptions`, `npm test --
     cap06/copilot-runner` and `npm test -- cap06/injection-summary`. C002-TC-614, 677 … 679, 907 and
     917 … 919, the Copilot CLI cases and the summary cases stay unchanged: a stub-host test without
     `deps.keyUsage` reconciles nothing. A test that compares a whole OpenCode ledger entry gains
     `ended_at`; the task report names it.
7. **(c) Merge rule 3 and the missing-model refusal.** Make rule 3 read a record without
   `end_reason` as not `completed`, and add the missing-model form to the no-run refusal test. Run
   C002-TC-680, C002-TC-691, C002-TC-692, C002-TC-693, C002-TC-920 and C002-TC-617. Edit the Record
   of `VSC-02` only if C002-TC-617 fails. Report any other failure as a defect of the C002-T-066 code
   with `sdd defect add --ref <TS-ID>` instead of changing the scenario. D-028 item 5 (the
   internal-error line of §5.2 rule 5) has no scenario: the task report quotes the line as `run.mjs`
   writes it and states whether it equals the contract text.
8. Run `npm test`, `npm run replay -- suite`, `npm run check` and `npm run bench`. Report the
   commit, which moves the release-candidate commit (Preconditions, last item).

## Verification

- `npm test -- tests/guards`, `npm test -- cli/guard-message`, `npm test -- cap02/permissions`
- `npm run replay -- opencode-host`, `npm run replay -- suite`
- `npm test -- cap06/spend-reconciliation`, `npm test -- unit/evals`
- `npm test -- cap06/runner-caps`, `npm test -- cap06/cap-exceptions`, `npm test -- cap06/copilot-runner`, `npm test -- cap06/injection-summary`, `npm test -- cap06/checklist`
- `npm run package`, `npm test`, `npm run check`, `npm run bench`

## Done when

- [ ] `src/hooks/guard-bash.ts` exports `RIPWIRE_MAP_BOUND`, which `ripwire()` and `bashRules()` read; the bash corpus and the guard bench are unchanged; the `Allowed:` summary names `ripwire read verbs or the bounded default map`; C002-TC-505 passes
- [ ] The native `bash` rules of `bashRules()`, the OpenCode table and the three golden tables hold `ripwire *--max-tokens=*` once, after the verb rules and before `ast-grep`, and no `--token-budget` rule. `GLOB_GAPS` holds the default-map gap row, and the characterization check records BG-448, BG-443 and BG-447 as false allows. `npm test -- cap02/permissions` and C002-TC-209 (nine rows) pass. The `sdd-mcp-server` and `copilot-hooks` replay reports show 0 differing decisions
- [ ] Every OpenCode ledger entry that `run.mjs` writes gives `ended_at`. A `partial` paid OpenCode session's entry is booked at the settled key usage delta (bound `U0` + 0.9 × `usage.usd`) before the next session's stop rule, with `U0` settled after a recent session; otherwise it stays `partial` with one `stays partial` line naming one of the three reasons. Its result record keeps `spend` `partial`. C002-TC-921 (eight rows), C002-TC-922, C002-TC-923 (four rows), C002-TC-926 (two rows) and C002-TC-927 (three rows) pass
- [ ] The OpenRouter key occurs in no line and no file that the OpenCode runner or `run.mjs` writes on `--host opencode`, host and model text included, each occurrence written `[REDACTED]`. The paid session's run folder is deleted at its end, and `SDD_EVAL_KEEP_RUN` is refused on the real OpenCode runner. C002-TC-924 (four rows), its request-level supporting tests, the run-folder and `SDD_EVAL_KEEP_RUN` supporting tests, and C002-TC-907 pass
- [ ] A missing key file gives `paid OpenCode session refused: no OpenRouter key in <key file>`. An empty, short or unsafe key gives `paid OpenCode session refused: the OpenRouter key in <key file> is shorter than 20 characters or holds a character that JSON escapes`. Both come before any key usage read and before the host starts, and a 20-character key is accepted. C002-TC-925 (six rows) passes
- [ ] Merge rule 3 reads a record without `end_reason` as acted upon, and a missing-model refusal of Copilot CLI gives no entry and no lock. C002-TC-617, C002-TC-680 (fourteen rows), C002-TC-691 (seven rows), C002-TC-692 (ten rows), C002-TC-693 and C002-TC-920 pass. The task report lists which needed no code change and quotes the internal-error line of §5.2 rule 5
- [ ] No test reads or writes the repository's ledger, `docs/releases/` or P-01's key file, and no request reaches the network; no paid session ran
- [ ] `npm test`, `npm run replay -- suite`, `npm run check` and `npm run bench` green
- [ ] The task report names this task as the follow-up of C002-T-030, C002-T-043, C002-T-056 and C002-T-066, and states that its commit moves the release-candidate commit for C002-T-052 and C002-T-055 if they have not run their release checks yet
- [ ] Progress reported: `sdd task set C002-T-067 --status done --commit <sha>`
