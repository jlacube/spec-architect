---
id: C002-T-067
title: "Fix for revision D-023 item 2, D-024, D-028: OpenCode ripwire map rule and deny summary, partial-spend reconciliation from the OpenRouter key usage, key redaction"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-030, C002-T-043, C002-T-056, C002-T-066]
implements: [C002-REQ-207, C002-REQ-503, C002-REQ-612, C002-REQ-614, C002-REQ-617, C002-REQ-638, C002-REQ-639]
satisfies_ac: [C002-AC-207.1, C002-AC-503.1, C002-AC-612.1, C002-AC-614.1, C002-AC-617.1, C002-AC-638.1, C002-AC-639.1]
verified_by: [C002-TS-209, C002-TS-505, C002-TS-617, C002-TS-680, C002-TS-691, C002-TS-692, C002-TS-695, C002-TS-696, C002-TS-697, C002-TS-698, C002-TC-209, C002-TC-505, C002-TC-617, C002-TC-680, C002-TC-691, C002-TC-692, C002-TC-921, C002-TC-922, C002-TC-923, C002-TC-924]
components: [C002-COMP-001, C002-COMP-002, C002-COMP-009, C002-COMP-011, C002-COMP-012]
risk_refs: [C002-RISK-001, C002-RISK-015, C002-RISK-037]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-067 — Fix for revision D-023 item 2, D-024, D-028: OpenCode ripwire map rule and deny summary, partial-spend reconciliation from the OpenRouter key usage, key redaction

## Intent

The spec revision for defects D-024, D-028 and D-023 item 2 (P-01 answers to Q-c002-defects-01, "Fix
most, defer D-023(1) (Recommended)", and Q-key-redact-01, "Redact host text too (Recommended)";
`../questions-log.md` round 2026-10-23) changes code of done tasks. Done tasks are not reopened; this
task is the follow-up of C002-T-030 and C002-T-043 (OpenCode native rules and their gap list), of
C002-T-056 step X0 (ledger and stop rule) and of C002-T-066 (injection-summary merge, Copilot CLI model
rule, checklist). It has three parts: **(a)** D-024, the bounded ripwire default map in the OpenCode
native `bash` rules with its gap row, the guard export `RIPWIRE_MAP_BOUND` and the deny summary text
(C002-IF-001 §6.3, C002-IF-008 §1); **(b)** D-023 item 2, the reconciliation of a `partial` OpenCode
spend from the OpenRouter key usage, and the key redaction with the short or unsafe key refusal
(C002-IF-010 §2.3, §4 Key redaction); **(c)** D-028, test rows for behaviour that C002-T-066 already
implemented (C002-IF-009 §4, C002-IF-010 §2 model rule, §5.2). It runs **no paid session**: every new
test uses a stub host or a stubbed host start, and a stubbed key usage read (`deps.keyUsage`), so no
request reaches `openrouter.ai`.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/hooks/guard-bash.ts` › `RIPWIRE_MAP_BOUND` (new export), `ripwire()` | (a) export the map bound `"--max-tokens"` as a third constant beside `RIPWIRE_VALUE_VERBS` and `RIPWIRE_FLAG_VERBS`; `ripwire()` reads it in place of its literal; both verb lists keep their values, `--test-gate` stays out of the value list (C002-IF-001 §6.3 ripwire rules; C002-CON-06). No decision changes |
| modify | `src/hooks/guard-bash.ts` › the `Allowed:` summary text (about line 32) | (a) `ripwire read verbs` becomes `ripwire read verbs or the bounded default map`, the rest of the text byte-equal to C002-IF-008 §1; the same text reaches the Claude Code hook, the sdd MCP server command tool and the Copilot guard hooks through the one core |
| modify | `scripts/generate/emit/opencode-permissions.ts` › `bashRules()` | (a) one rule `ripwire *--max-tokens=*` `allow`, built from `RIPWIRE_MAP_BOUND`, after the flag-verb rules and before the `ast-grep` rule; no rule that names `--token-budget` (C002-IF-001 §6.3 ripwire rules table) |
| modify | `scripts/generate/emit/opencode-permissions.ts` › `GLOB_GAPS` | (a) the ripwire verb-form entry follows the revised gap row (BG-449, BG-451 as examples), and one new entry for the default-map form: glob `ripwire *--max-tokens=*`, effect false allow, examples BG-448, BG-443 and BG-447, with BG-442 and BG-444 still denied (C002-IF-001 §6.3, What a glob cannot express) |
| modify | `plugins/architect/targets/opencode.json` › `permissions.native-permissions.bash` | (a) the same rule at the same place as `bashRules()`, so the table check gives no ERR-GEN-004 (C002-IF-004) |
| modify | `tests/fixtures/targets/opencode-native-permissions.json`, `opencode-sdd-mcp-server.json`, `opencode-gap-no-lsp.json` | (a) the native `bash` list of each golden table gains the rule at the same place; nothing else changes |
| modify | `tests/integration/cap02/permissions.test.ts` | (a) the native rule list holds `ripwire *--max-tokens=*` once, after the verb rules and before `ast-grep`, read from `RIPWIRE_MAP_BOUND`; no rule names `--token-budget`; the decision loop gains `ripwire . --max-tokens=4000` (allow) and `ripwire . --token-budget=4000` (deny); `GLOB_GAPS` holds the default-map entry (needle list) |
| modify | `tests/replay/scenarios/opencode-host.test.ts` | (a) C002-TC-209: the three ripwire rows of C002-TS-209 (ten rows) |
| modify | `tests/integration/cli/guard-message.test.ts` | (a) C002-TC-505: the `Allowed:` summary names `ripwire read verbs or the bounded default map` |
| modify | `evals/harness/run.mjs` › `main` (`deps.keyUsage`), the paid OpenCode session step, `ledgerEntry` and the ledger write | (b) the before-read, the after-reads with the settle rule, the reconciled entry fields, the standard-output line and the two `stays partial` lines of C002-IF-010 §2.3, in the order of §2.3 item 3 (before the stop rule of the next session or the end of the run); the test seam `deps.keyUsage` `{ read, intervalMs, limitMs }`, which with a stub host acts only together with `deps.stopRule` `true`; no option and no variable sets it |
| add | `evals/harness/` › the key usage reader (a module or a function of `run.mjs`) | (b) `GET https://openrouter.ai/api/v1/key` with `Authorization: Bearer <key>` only, 30 s timeout, failure on no response, a status other than 200, or a `data.usage` that is not a finite number of at least 0; keeps `data.usage` only (never `data.label`); a failure carries a reason, never the request, its headers or the response body |
| modify | `evals/harness/runners/opencode.mjs` › the key file read and the paid-session entry | (b) the key check of §4 Key redaction before any use, before the before-read and before the host process starts: a missing or empty file (as today) and a key shorter than 20 characters or holding `"`, `\` or a control character refuse the session with the line `paid OpenCode session refused: the OpenRouter key in <key file> is shorter than 20 characters or holds a character that JSON escapes` (the path, never the key); the checked key, trimmed at both ends, is the one the host process and the reads get |
| modify | `evals/harness/run.mjs` and `evals/harness/runners/opencode.mjs` › every writer of standard output, standard error, result records, result files, transcripts, ledger entries and logs on `--host opencode` | (b) every occurrence of the exact key value replaced with `[REDACTED]` in each complete line or file before it is written, after any JSON encoding, host events, error texts, tool output, model messages and any host file the runner copies or quotes included (C002-IF-010 §4 Key redaction) |
| add | `tests/integration/cap06/spend-reconciliation.test.ts` | (b) C002-TC-921 (six rows), C002-TC-922, C002-TC-923 (four rows) and C002-TC-924 (six rows), on fx-evals-caps with the case file `evals/targets/caps/reconcile.eval.mjs` built by the test, a temporary ledger and a temporary home folder; one `test()` per Examples row whose name starts with its TS ID |
| add | `tests/unit/evals/key-usage.test.ts` | (b) supporting unit cases of the key usage reader with a stubbed fetch, no socket: the request carries the key in the `Authorization` header only; a 200 response gives `data.usage`; no response within 30 s, a status 401, a `data.usage` of `null`, `-1` or `"x"` fail with a reason that holds neither the key nor the body |
| modify | `tests/integration/cap06/checklist.test.ts` | (c) C002-TC-617: the `models_used` instruction in the Record of `VSC-02` and the `note` instruction (D-028 items 1 and 2), in place of the fresh-install-step assertion |
| modify | `docs/checklists/vscode-copilot.md` › the Record of `VSC-02` | (c) only if the C002-TC-617 test shows a missing part of the two instructions of C002-TS-617; no step added, removed or renumbered, so the step index and the release check's step check are unchanged |
| modify | `tests/integration/cap06/copilot-runner.test.ts` | (c) C002-TC-680 row 14, the missing-model refusal after `copilot --version` (D-028 item 6) |
| modify | `tests/integration/cap06/injection-summary.test.ts` | (c) C002-TC-691 row 6, a `turn cap` end with a passing result document (D-028 item 3); C002-TC-692 row 10, a base that fails two checks, and on every row no second `not written` line (D-028 item 4) |

## Preconditions

- C002-T-030, C002-T-043, C002-T-056 and C002-T-066 done (all are).
- G2 re-approved after the D-023 item 2, D-024, D-028 revision, and G3 after this plan revision
  (gate records of `../../change.md`).
- REF-WIN with Node.js 22.22.2 or later; for C002-TC-209 the replay environment E-OC with the pinned
  OpenCode 1.18.31 and the loopback stub model (no network, no spend). The tests write only into
  temporary folders: the repository's ledger `evals/results/spend-chg002.json`, `docs/releases/` and
  P-01's key file are never read or written by a test.
- **No order against the releases.** C002-T-052 and C002-T-055 do not depend on this task
  (`../10-strategy.md` §2, row "Fix task for the D-023 item 2, D-024, D-028 revision"). This task's
  commit changes the bundled CLI (the deny summary) and a generator input (the OpenCode table), so it
  moves the release-candidate commit of C002-T-048. A release task whose release check runs after
  this commit first re-runs the unpaid steps at the new commit, as after C002-T-066 (plan critic
  CR-52): C002-T-048 step 5, then C002-T-049 steps 1 and 2 for OpenCode or C002-T-054 steps 1 and 2
  for Copilot. No paid row reruns: no session of the release evidence changes.

## Step outline (no production code)

1. **Tests first.** Write or adjust every case of `verified_by`, each Examples row its own `test()`
   whose name starts with its TS ID, and watch them fail against today's code: C002-TC-921 … 924, the
   ripwire rows of C002-TC-209, the summary of C002-TC-505 and the new assertions of
   `permissions.test.ts`. The D-028 rows (C002-TC-617, 680 row 14, 691 row 6, 692 row 10) are
   expected to pass at once, since C002-T-066 implemented their behaviour; the task report says which
   passed without a code change and names any that did not.
2. **(a) Guard export and summary.** Add `RIPWIRE_MAP_BOUND` and read it in `ripwire()`; change the
   summary text. Run `npm test -- tests/guards` (the bash corpus unchanged: no decision moves,
   C002-RISK-001), C002-TC-505, the CHG-001 guard tests that read the summary (`cap11/TS-1107`,
   `TS-1108`; regression-set §3), and `npm run bench` (guard p95 ≤ 300 ms).
3. **(a) Native rules and gap rows.** Add the default-map rule to `bashRules()` from the export, the
   gap entries to `GLOB_GAPS`, and the rule to the OpenCode table and the three golden tables. Run
   `npm test -- cap02/permissions` and the table check (`npm run check`, no ERR-GEN-004). Run
   `npm run replay -- opencode-host` for C002-TC-209 on the pinned host: the map under
   `--max-tokens` allowed, under `--token-budget` only denied, and the gap row allowed, as OpenCode
   decides it. Run `npm run replay -- suite`: the `opencode-permissions` development report may now
   list the gap cases of the default-map form as differing, which is the expected gap of C002-IF-001
   §6.3; the `sdd-mcp-server` and `copilot-hooks` reports stay at 0 differing decisions. Run
   `npm run package`: the OpenCode package of the `sdd-mcp-server` mode differs only where the table
   file and the bundled CLI enter it (manifest `source_digest`, the summary text); it gains no
   `bash` rule. The S-07 record stays as it is (`bash_rules_match_shell_corpus: false`, mode
   `sdd-mcp-server`).
4. **(b) Key check and redaction.** Move the key read of the OpenCode runner ahead of every use, add
   the length and character check with its refusal line, and route every write of the runner and of
   `run.mjs` on `--host opencode` through one redaction of the exact key value, applied to the
   complete line or file after JSON encoding. List in the task report each writer that now goes
   through it, and each host file the runner copies or quotes. Run C002-TC-924 rows 4 … 6 and
   C002-TC-907 (missing and empty key file, host environment; unchanged).
5. **(b) Key usage reader.** Add the reader with its failure reasons; run the unit cases of
   `tests/unit/evals/key-usage.test.ts`.
6. **(b) Reconciliation.** In the paid OpenCode session step of `run.mjs`, after the stop rule allows
   the session and the key check passes: the before-read (`U0` and its time; a failure is kept, the
   session still runs). After a session whose result gives `spend` `partial`: write the entry with
   `cost_source` `partial` as today, then, when `U0` exists, read every `intervalMs` until `limitMs`
   from the session's end, passing over a failed read; settle at the first successful read equal to
   the latest earlier successful after-read, never the before-read, when its value is at least `U0`
   plus the result's `usage.usd`, compared with the 1e-9 tolerance that `stopRule` uses, so that
   17.2400 + 0.60 settles at 17.8400 (C002-TS-695 row 4). On a settle, rewrite the entry with
   `cost_usd`, `cost_source` `openrouter key usage delta`, `cost_usd_recorded` and `openrouter_usage`
   (C002-IF-010 §2.3 Reconciled cost) and print the `ledger: <id> reconciled …` line with four
   decimals; otherwise print the `stays partial` line with its reason and leave the entry. The result
   record and the result file are never changed by this step, and the cap records stay as written:
   the done-check of a capped session decides its overshoot bound from the delta (C002-IF-010 §2.2).
   Only then the stop rule of the next session runs. Run C002-TC-921 … 923 and C002-TC-924 rows 1 … 3,
   then `npm test -- cap06/runner-caps`, `npm test -- cap06/cap-exceptions`, `npm test --
   cap06/copilot-runner` and `npm test -- cap06/injection-summary` (C002-TC-614, 677 … 679, 907,
   917 … 919, the Copilot CLI cases and the summary cases unchanged: a stub-host test without
   `deps.keyUsage` reconciles nothing).
7. **(c) D-028 rows.** Run C002-TC-617, C002-TC-680, C002-TC-691 and C002-TC-692. Edit the Record of
   `VSC-02` only if C002-TC-617 fails, and report any other failure as a defect of the C002-T-066 code
   with `sdd defect add --ref <TS-ID>` instead of changing the scenario. D-028 item 5 (the
   internal-error line of §5.2 rule 5) has no scenario: the task report quotes the line as
   `run.mjs` writes it and states whether it equals the contract text.
8. Run `npm test`, `npm run replay -- suite`, `npm run check` and `npm run bench`. Report the commit,
   which moves the release-candidate commit (Preconditions, last item).

## Verification

- `npm test -- tests/guards`, `npm test -- cli/guard-message`, `npm test -- cap02/permissions`
- `npm run replay -- opencode-host`, `npm run replay -- suite`
- `npm test -- cap06/spend-reconciliation`, `npm test -- unit/evals`
- `npm test -- cap06/runner-caps`, `npm test -- cap06/cap-exceptions`, `npm test -- cap06/copilot-runner`, `npm test -- cap06/injection-summary`, `npm test -- cap06/checklist`
- `npm run package`, `npm test`, `npm run check`, `npm run bench`

## Done when

- [ ] `src/hooks/guard-bash.ts` exports `RIPWIRE_MAP_BOUND`, which `ripwire()` and `bashRules()` read; the bash corpus and the guard bench are unchanged; the `Allowed:` summary names `ripwire read verbs or the bounded default map`; C002-TC-505 passes
- [ ] The native `bash` rules of `bashRules()`, the OpenCode table and the three golden tables hold `ripwire *--max-tokens=*` once, after the verb rules and before `ast-grep`, and no `--token-budget` rule; `GLOB_GAPS` holds the default-map gap row; `npm test -- cap02/permissions` and C002-TC-209 (ten rows) pass; the `sdd-mcp-server` and `copilot-hooks` replay reports show 0 differing decisions
- [ ] A `partial` paid OpenCode session's ledger entry is reconciled from the settled key usage delta before the next session's stop rule, or stays `partial` with one `stays partial` line naming its reason, and its result record keeps `spend` `partial`; C002-TC-921 (six rows), C002-TC-922 and C002-TC-923 (four rows) pass
- [ ] The OpenRouter key occurs in no line and no file the OpenCode runner or `run.mjs` writes on `--host opencode`, host and model text included, each occurrence written `[REDACTED]`; an empty key file or a key under 20 characters or with a character that JSON escapes is refused before any key usage read and before the host starts; C002-TC-924 (six rows), the reader unit cases and C002-TC-907 pass
- [ ] C002-TC-617, C002-TC-680 (fourteen rows), C002-TC-691 (six rows) and C002-TC-692 (ten rows) pass; the task report lists which needed no code change and quotes the internal-error line of §5.2 rule 5
- [ ] No test reads or writes the repository's ledger, `docs/releases/` or P-01's key file, and no request reaches the network; no paid session ran
- [ ] `npm test`, `npm run replay -- suite`, `npm run check` and `npm run bench` green
- [ ] The task report names this task as the follow-up of C002-T-030, C002-T-043, C002-T-056 and C002-T-066, and states that its commit moves the release-candidate commit for C002-T-052 and C002-T-055 if they have not run their release checks yet
- [ ] Progress reported: `sdd task set C002-T-067 --status done --commit <sha>`
