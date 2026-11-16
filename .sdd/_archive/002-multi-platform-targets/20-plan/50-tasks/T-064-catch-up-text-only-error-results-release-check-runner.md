---
id: C002-T-064
title: "Catch-up for revision D-015 … D-017: text-only MCP error results, generator package version, release-check rows, eval-runner rules"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: done
depends_on: [C002-T-019, C002-T-020, C002-T-025, C002-T-038, C002-T-041, C002-T-044, C002-T-046, C002-T-047, C002-T-063]
implements: [C002-REQ-101, C002-REQ-402, C002-REQ-405, C002-REQ-407, C002-REQ-504, C002-REQ-509, C002-REQ-510, C002-REQ-606, C002-REQ-608, C002-REQ-614, C002-REQ-615, C002-REQ-617, C002-REQ-618, C002-REQ-627]
satisfies_ac: [C002-AC-101.2, C002-AC-402.1, C002-AC-405.1, C002-AC-407.1, C002-AC-504.1, C002-AC-509.1, C002-AC-510.1, C002-AC-606.1, C002-AC-608.1, C002-AC-614.1, C002-AC-615.1, C002-AC-617.1, C002-AC-618.1, C002-AC-627.1]
verified_by: [C002-TS-402, C002-TS-665, C002-TS-423, C002-TS-642, C002-TS-666, C002-TS-662, C002-TS-667, C002-TS-507, C002-TS-515, C002-TS-516, C002-TS-611, C002-TS-617, C002-TS-618, C002-TS-637, C002-TS-668, C002-TS-669, C002-TS-670, C002-TS-671, C002-TS-672, C002-TC-402, C002-TC-665, C002-TC-423, C002-TC-642, C002-TC-666, C002-TC-662, C002-TC-667, C002-TC-507, C002-TC-515, C002-TC-516, C002-TC-906, C002-TC-907, C002-TC-908, C002-TC-909, C002-TC-910, C002-TC-911, C002-TC-617, C002-TC-618, C002-TC-637, C002-TC-668, C002-TC-669, C002-TC-670, C002-TC-671, C002-TC-672]
components: [C002-COMP-005, C002-COMP-006, C002-COMP-008, C002-COMP-009, C002-COMP-010, C002-COMP-001, C002-COMP-002, C002-COMP-011]
risk_refs: [C002-RISK-020]
estimate: L
report: { commit: 868f63f, completed_at: 2026-10-20, notes: "npm run check 1353 pass; replay suite 42 + 1 skip; sdd-mcp-server copilot/opencode 665/26/0, copilot-hooks 0 (scratch); TS-666 4 rows pass on pinned OpenCode + stub. No paid session. Follow-up of T-019/T-041/T-044/T-046/T-047. Candidates: TS-667 PG-050 is replace_text not write_file; platforms-limited cases can never be released on that host; restore-run count rule ambiguity." }
---

# C002-T-064 — Catch-up for revision D-015 … D-017: text-only MCP error results, generator package version, release-check rows, eval-runner rules

## Intent

The spec revision for defects D-015, D-016 and D-017 (P-01 answers Q-mcp-errors-01 "No structured
error (Recommended)" and Q-openrouter-02 in `../../10-spec/questions-log.md`, round 2026-10-20) and
the critic fixes that followed it (spec CR-51 … CR-59 and plan CR-35 … CR-37; P-01 answers
Q-checklist-rerun-01 "Failures stay binding (Recommended)" and Q-checklist-restricted-01 "Blocked
chat passes (Recommended)") changed contracts that done tasks already implemented: C002-T-019
(server results), C002-T-041 (replay adapter), C002-T-044 (OpenCode runner), C002-T-046 (checklist
and record template), C002-T-047 (release check) and, through C002-T-025, the generator's manifest.
Done tasks are not reopened. This task brings their code, documents, case files and tests to the
revised contracts and is recorded as the follow-up of C002-T-019, C002-T-041, C002-T-044, C002-T-046
and C002-T-047. It unblocks the rest of C002-T-056: the OpenCode doctor rows that run `run_command`
probes fail with `-32602` until the server's error results carry no `structuredContent` (D-017). The
release-check catalogue `scripts/release/errors.ts` already mirrors the revised ERR-REL-004, 009,
011 and 012 rows (commits e0ade13 and c03942a); this task does not touch it.

The work has three parts: **(a)** D-017, error results text-only and the total server decision
mapping (C002-IF-002 §4, §6.1; C002-IF-009 §2.3; C002-IF-006 §2); **(b)** D-016, the generator's
`package_version` with the refusal of a source without a version (C002-IF-004 Output, `errors.md`
ERR-GEN-007) and the release-check rows: step index, step check, earlier runs, evidence kinds, the
printed outcome (C002-IF-009 §4, §5); **(c)** D-015, the eval-runner rules (C002-IF-010 §1 … §4)
and the checklist and record template (C002-IF-009 §4 Run order, Earlier runs).

**Follow-up (revision D-018 … D-020), not a reopening.** The candidates of this task's report became
defect D-018: C002-TS-667 names the `replace_text` call of `PG-050` (item 1), a case of the platform
rule is listed under `not_applicable` with the rule `platforms` and accepted at release instead of
refusing every handling (item 2, which replaces this task's three `PG-900` rows of C002-TC-637), and
every earlier run of the restore step counts (item 3, as this task's code already does). The tests and
code for them, in `tests/unit/replay/adapters.test.ts`, `tests/replay/expect.ts`, the replay suite
writer, `scripts/release/replay.ts` and `tests/integration/cap06/fx-release.ts`, are done by
C002-T-065.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/mcp/tools.schema.json` | (a), **first step**: byte copy of `../../10-spec/50-interfaces/sdd-mcp-tools.schema.json` (no `$defs/errorResult`). Today the copy still holds the old error shape, so `tests/integration/contracts/schema-copies.test.ts` is red until this lands |
| modify | `src/mcp/served-schemas.json` | (a) rewritten by `node scripts/mcp-schemas.mjs` from the new contract copy; `tests/integration/contracts/mcp-served-schemas.test.ts` passes. The served `outputSchema` of each tool describes its success output only |
| modify | `src/mcp/results.ts` › `errorResult` | (a) an error result is `isError: true` with one text item and **no** `structuredContent` (C002-IF-002 §4). The text is exactly `<code>: <message>` for an `ERR-MCP-*` code (the print form of `errors.md` §2 without a fix) and the guard core's deny message as the core returns it for a `GUARD-*` code (it already starts with its code, so the code is never written twice; C002-IF-002 §6.1). The header comment names §6.1 instead of `$defs/errorResult` |
| modify | `src/mcp/handlers.ts`, `src/mcp/tools/files.ts`, `src/mcp/tools/shell.ts` (call sites of `errorResult`) | (a) only as far as the narrowed result needs: the arguments that fed the former structured fields (`status`, `tool`, `path`, `occurrences`) leave the result; the message keeps every value the former fields carried where §6.1 says the message names it (path, count) |
| modify | `src/mcp/server.ts` › `tools/call` handler (about line 201) | (a) the `debug("tools/call-done", …)` code is read from the result's text (the characters before the first `: `) instead of `structuredContent.code` |
| modify | `tests/integration/mcp/faults.test.ts` | (a) C002-TC-402: each row asserts the text that starts with `<code>: ` and no `structuredContent` key |
| add | `tests/integration/mcp/error-results.test.ts` | (a) C002-TC-665: one test per Examples row, on the server of the packed tarball |
| modify | `tests/integration/mcp/files.test.ts`, `tests/integration/mcp/shell.test.ts`, `tests/integration/mcp/quick-lint.test.ts` | (a) every refusal or failure assertion reads the text (code before the first `: `, the message after it) and asserts no `structuredContent` key; the output-schema validation runs on successes only. In `shell.test.ts`: the revised C002-TC-423 and C002-TC-642 |
| modify | `tests/replay/adapters/sdd-mcp-server.ts` › `readServerDecision` | (a) C002-IF-009 §2.3, total mapping (critic CR-58): an error result is told by `isError: true` and its code is the text before the first `: `; `deny` for the codes of `DENY`, `allow` for the codes of `ALLOWED_REFUSAL`; `allow` for a success only, a result without `isError: true` whose `structuredContent` gives the `status` `written`, `completed` or `timed_out`; every other result reads `error` (any other code, ERR-MCP-007 and GUARD-HOOK-* included; a text that starts with no code of `errors.md` §2 or §6; a result without `isError` and without `structuredContent`, or with another or no `status`; a JSON-RPC error; no response). `detail` holds the result's text. Today every result without `isError` reads `allow`; that branch goes |
| modify | `tests/unit/replay/adapters.test.ts` | (a) C002-TC-667: one test per Examples row (eleven, five of them added for CR-58), against an in-process stub server |
| modify | `tests/replay/scenarios/suite.test.ts` | (a) C002-TC-662 asserts the text-only ERR-MCP-003 result and the report row |
| modify | `tests/replay/scenarios/opencode-host.test.ts` | (a) C002-TC-666: the pinned OpenCode 1.18.31 with the stub model, the package generated with `--mode opencode=sdd-mcp-server`, one test per Examples row, in the replay suite without the `tests/no-network.mjs` preload (C002-DOD-005; no spend, no credential) |
| modify | `docs/releases/opencode/0.0.1/replay-sdd-mcp-server.json`, `docs/releases/copilot/0.0.1/replay-sdd-mcp-server.json` | (a) regenerated by `npm run replay -- --mechanism sdd-mcp-server` (both targets): `detail` holds the result texts; 0 differing decisions; each validates against `docs/releases/release-record.schema.json` |
| modify | `plugins/architect/targets/opencode/wiring/doctor-report.md`, `plugins/architect/targets/copilot/wiring/doctor-report.md`, both `code-discovery-toolchain.md` | (a) only if a text names a structured field: the doctor reads the probe's refusal from the result text, `ERR-MCP-006: could not start "<executable>": only a .cmd or .bat shim was found` → `error`, `… not found on PATH` → `missing` (C002-IF-006 §2) |
| modify | `evals/targets/doctor/TS-507.eval.mjs` | (a) C002-TC-507: the ripwire row `missing` with its fallback and install command, and no part or reply naming the MCP error `-32602` |
| modify | `scripts/generate/translate/wiring.ts` › `packageVersion`; `scripts/generate/main.ts` › the `publish(…)` call (about line 214); `scripts/generate/writer.ts` › `packageFiles` (about line 80) | (b) `architect-target.json` `package_version` is the `version` of `<source>/.claude-plugin/plugin.json` of the run, from the same function that fills the `{{package_version}}` token (`packageVersion(source)`, exported or moved to a module both import); the built-in `VERSION` is passed neither as the package version nor as the token's fallback: the `return VERSION` fallback of `packageVersion` goes (C002-IF-004 Output, revised for D-016 item 6 and critic CR-36) |
| modify | `scripts/generate/reader.ts` (or step 2 of `scripts/generate/main.ts`, wherever the run-level source checks sit) | (b) C002-IF-004 Output "Source without a version": a missing `.claude-plugin/plugin.json`, or one that parses without a non-empty string `version`, gives one ERR-GEN-007 diagnostic for the run, `.claude-plugin/plugin.json: version missing or not a non-empty string`, with `file` `.claude-plugin/plugin.json` and no `target`; no target package is written; exit 1. A manifest that does not parse keeps the reader's one ERR-GEN-007 with its parse error and gets no second diagnostic (`errors.md` ERR-GEN-007) |
| modify | `tests/integration/cap01/generator-frame.test.ts` | (b) C002-TC-672, one test per Examples row; and the supporting test (supports C002-TC-670, C002-TC-671 and C002-TC-515): a fixture source plugin of version `0.3.0` generates both targets with `package_version` `0.3.0` and the token value `0.3.0`; the repository's plugin still gives its own version |
| modify | `scripts/release/evidence.ts` › `readChecklistSteps`, `ChecklistStep` | (b) C002-IF-009 §4 Step index (critic CR-54): read only the table under the heading `## Step index`, whose header row starts with `Step`, `Group`, `Mode`, `Kind`; each further row is a step with its group; return null for every unreadable condition of §4 (no heading, no step row, another header, a repeated step ID, a Group, Mode or Kind outside the listed values, an injection step without a case ID or with a repeated one, not exactly one `restore` step). Today the reader takes every `\| VSC-nn \|` row of the file and accepts any Mode, so an unknown Mode fails open |
| modify | `scripts/release/evidence.ts` › `recordSteps`, `RecordStep` | (b) each entry carries its `earlier_results` as read (C002-IF-009 §4 Earlier runs); `recordSteps` still returns null only when `steps` is not a list of mappings with an `id` (ERR-REL-009 `checklist record`); a malformed `earlier_results` is a step-check line, not an unreadable record |
| modify | `scripts/release/check.ts` › the checklist-record part (about lines 217–262) | (b) the step check of C002-IF-009 §5 (critic CR-52, CR-55): per listed step ID, in record order, one ERR-REL-004 line for the first of rules 1–6, with the `<result>` texts of `errors.md` ERR-REL-004; then `not recorded` for each step of the package's mode that the record does not list, in index order; injection steps exempt from rules 4 and 5. With an unreadable step index: ERR-REL-009 `checklist` at `docs/checklists/vscode-copilot.md`, and only rules 1, 3 and 6 apply, rule 6 excusing no earlier `failed` run |
| modify | `scripts/release/main.ts`, `scripts/release-check.mjs` | (b) only for a row of C002-TC-637 or C002-TC-668 … 672 that fails; the expected behaviour is C002-IF-009 §5 as revised (reports per mode, evidence kinds, `--dry-run`, `--root`, exit codes 0 … 3). The printed `<outcome>` is the release record's `outcome` as the record holds it, `released` or `refused`, also with `--dry-run` (critic CR-51; the code already writes `released`). C002-TC-671's exit-3 row needs a test-only injection point for an invalid release record; add one if C002-T-047 left none |
| modify | `tests/integration/cap06/release-check.test.ts`, `tests/integration/cap06/fx-release.ts` | (b) C002-TC-637 (the three `PG-900` rows; the fx-release corpora gain a case `PG-900` limited by `platforms` to `linux`), C002-TC-668 (the step index of the revised C002-TS-668, the S-08 record and the clean Copilot CLI injection evals), C002-TC-669 (the revised ERR-REL-009 text and the two unreadable-index checklists), C002-TC-670 and C002-TC-671, one test per Examples row; a supporting test: the repository's `docs/checklists/vscode-copilot.md` reads as a readable step index with one `restore` step (VSC-07) |
| modify | `docs/checklists/vscode-copilot.md` | (c) unconditional (C002-IF-009 §4 Run order, Earlier runs; Q-checklist-rerun-01, Q-checklist-restricted-01): "How to run and record" and the **Rerun rule** paragraph name the third trigger (the hooks-state step reads a source off and P-01 puts it right) and record earlier runs in `earlier_results` with their `cause`, never in a `note`; the **Do** text of VSC-04 and VSC-06: when VS Code itself refuses the chat or the doctor prompt in restricted mode and no tool call of the package runs, record the step `passed` with `note: "VS Code refused: <text as VS Code showed it>"`; when VS Code runs the prompt, `passed` only with the row `ok`, the caveat Version text and an empty Fix, else `failed` with the row as shown in `note`; the **Record** of VSC-07 and VSC-10: on a rerun, the earlier run goes into `earlier_results` with `cause` `hooks-source-changed` or `ran-before-hooks-state`, and a VSC-10 that reads a source off is recorded as an earlier `failed` run of VSC-10 before the new restore step |
| modify | `docs/checklists/records/TEMPLATE.md` | (c) unconditional: the comment lines and one example entry show `earlier_results` (list of `{ result, cause, note }`, `cause` one of `hooks-source-changed`, `ran-before-hooks-state`, `repeated`) and the `VS Code refused: ` note of VSC-04 and VSC-06; no free-text rerun `note` remains (C002-IF-009 §4 example) |
| modify | `tests/integration/cap06/checklist.test.ts` | (c) C002-TC-617: the boundary step's mode `sdd-mcp-server`, the delegated-edit step's mode `both`; C002-TS-358, a Scenario Outline over both modes without a mode tag, maps to a step of each mode. Supporting assertions for C002-TC-516 and C002-TC-618: VSC-04 and VSC-06 state the `VS Code refused: ` pass rule; the rerun rule names `earlier_results` and the three causes; the template has an `earlier_results` example with `cause` |
| modify | `evals/targets/doctor/doctor-cases.mjs` › `doctorCase` | (c) the Claude Code rows carry `host: "claude-code"` like every other row (C002-IF-010 §1, D-015 item 7), so `--host opencode` no longer runs them |
| modify | `evals/harness/runners/opencode.mjs` › `generatedPackage` | (c) `targetPackage.version` is written into the `.claude-plugin/plugin.json` of the source copy before generation, so that the manifest's `package_version` and the `{{package_version}}` token both carry it (C002-IF-010 §2.1; C002-TS-515); the after-the-fact rewrite of `architect-target.json` goes |
| modify | `evals/harness/runners/opencode.mjs`, `evals/harness/run.mjs` | (c) only for a row of C002-TC-906 … 911 that fails; `api_key_source` in each result record and the result file as C002-IF-010 §3 gives it for OpenCode (`openrouter-key-file` on the pinned host, `null` on the stub host) |
| modify | `tests/integration/cap06/runner-caps.test.ts` | (c) C002-TC-906 (rows by `host`), C002-TC-907 (key file refusal, `OPENROUTER_API_KEY` only, isolated folders, `api_key_source`, key never written), C002-TC-908 (direct relay), C002-TC-909 (names per host row, `host_tool`), C002-TC-910 (`answer` default and `{ reject: true }`) and C002-TC-911 (`allowTools` answers permission requests only), each on the stub host or a stubbed host start, no paid session; C002-TC-909 … 911 extend the existing C002-T-044 tests that the test plan names; and the runner's version stamp of (c) on the stub host |

## Preconditions

- C002-T-019, C002-T-020, C002-T-025, C002-T-038, C002-T-041, C002-T-044, C002-T-046, C002-T-047 and
  C002-T-063 done. C002-T-056 is in progress and paused on D-017; it waits for this task.
- G2 re-approved after the D-015 … D-017 revision and its critic fixes (gate records of
  `../../change.md`).
- REF-WIN with the pinned OpenCode 1.18.31 binary and Node.js 22.22.2 or later for C002-TC-666
  (E-OC of test plan §3). This task runs **no paid session**: C002-TC-666 uses the stub model, and the
  paid rows of C002-TC-507, 509, 515 and 639 run in C002-T-056.

## Step outline (no production code)

1. **(a) Schema copy first.** Copy the contract schema byte for byte to `src/mcp/tools.schema.json`
   and regenerate `served-schemas.json` with `node scripts/mcp-schemas.mjs`; run
   `npm test -- contracts` and see it green again before any other change, so that every later test
   run starts from a green contract check.
2. Write or adjust the test cases, each Examples row its own `test()` whose name starts with its TS
   ID (test plan §1; C002-TC-906 … 911 start with their TC ID). Watch C002-TC-665, 667, 666, 668,
   669 and 672 and the error assertions of `faults`, `files`, `shell` and `quick-lint` fail against
   today's code.
3. **(a) Server.** Narrow `errorResult` to the text-only form of C002-IF-002 §6.1 and adapt its call
   sites; read the debug code from the text in `server.ts`. Check every `ERR-MCP-*` text against the
   Message cell of `errors.md` §2 (placeholders filled, no fix) and every `GUARD-*` text against the
   core's deny message for the same call. Rebuild and repack (`npm run build`, then the tarball of
   C002-T-022) so the integration tests run the changed server.
4. **(a) Replay adapter.** Change `readServerDecision` to the total mapping of §2.3 and run
   C002-TC-667. Run `npm run replay -- --mechanism sdd-mcp-server` for both targets and write the two
   reports; 0 differing decisions must hold. A case that now differs is a product defect or a spec
   defect, never a new expectation: name it in the task report. Run C002-TC-662.
5. **(a) OpenCode acceptance.** Add C002-TC-666 to `opencode-host.test.ts` with the stub model: the
   first step calls the row's host tool, the second answers `done`. Assert the part text, the absence
   of `-32602` and of `structured content does not match the output schema` in every part, message and
   session error, and the row's state. The success row (`sdd status`) checks that the success output
   still validates in OpenCode.
6. **(a) Doctor.** Read the two `doctor-report.md` and `code-discovery-toolchain.md` variants; change a
   text only where it names a structured field. Add the `-32602` assertion to `TS-507.eval.mjs`. No
   paid run here: C002-TC-507 runs in C002-T-056.
7. **(b) Generator version.** Pass the source plugin's version to the writer through the same function
   as the token, without the built-in fallback. Add the run-level ERR-GEN-007 for a manifest that is
   missing or gives no non-empty string `version`, once per run and for no target, and check that an
   unparsable manifest is reported once. Run C002-TC-672 and the supporting test, `npm run package`
   and `npm test -- cap01`, then `npm run check`: the repository's packages keep their version and
   `source_digest`.
8. **(b) Release check.** Make `readChecklistSteps` read the `## Step index` table only, with the
   groups and every unreadable condition of §4; carry `earlier_results` through `recordSteps`; apply
   the step check rules 1–6 and the `not recorded` lines in `check.ts`, and the reduced rule set with
   an unreadable index. Add the `PG-900` case to the fx-release corpora, the step index of C002-TC-668
   and the two unreadable checklists of C002-TC-669, and write C002-TC-637's three rows and
   C002-TC-668 … 671. Change `main.ts` or `release-check.mjs` only for a row that fails. Run
   `node scripts/release-check.mjs --target opencode --dry-run` on the repository evidence and record
   its outcome line in the report (refusals are expected until C002-T-049).
9. **(c) Checklist and template.** Change `docs/checklists/vscode-copilot.md` (How to run and
   record, Rerun rule, VSC-04 and VSC-06 Do, VSC-07 and VSC-10 Record) and
   `docs/checklists/records/TEMPLATE.md` as the Targets say. Keep the step index table unchanged
   unless the strict reader of step 8 refuses it. Run C002-TC-617 with the supporting assertions;
   check the template against the C002-TC-618 review items (each step of the mode once at its last
   run, `earlier_results` with `cause`, the `VS Code refused: ` note).
10. **(c) Eval runner.** Give the Claude Code doctor rows `host: "claude-code"`; write
    `targetPackage.version` into the source copy's `plugin.json` before generation; write
    C002-TC-906 … 911. C002-TC-906 also reads the real doctor case files and shows that
    `--host opencode` selects no Claude Code row; no session starts. Change the runner only for a row
    that fails.
11. Run `npm test`, `npm run check` and `npm run bench` (server benchmarks of C002-NFR-101 and
    C002-NFR-102 unchanged within their thresholds).

## Verification

- `npm test -- contracts` (first, after step 1)
- `npm test -- mcp/faults`, `npm test -- mcp/error-results`, `npm test -- mcp/files`,
  `npm test -- mcp/shell`, `npm test -- mcp/quick-lint`
- `npm test -- unit/replay`, `npm run replay -- suite`, `npm run replay -- opencode-host`
- `npm run replay -- --mechanism sdd-mcp-server` (both targets; 0 differing decisions)
- `npm test -- cap01/generator-frame`, `npm test -- cap05/doctor-variants`
- `npm test -- cap06/release-check`, `npm test -- cap06/checklist`, `npm test -- cap06/runner-caps`
- `node scripts/release-check.mjs --target opencode --dry-run`
- `npm test`, `npm run check`, `npm run bench`

## Done when

- [ ] `src/mcp/tools.schema.json` equals the contract copy and `served-schemas.json` is up to date (`npm test -- contracts` green, step 1); no error result of the server carries `structuredContent`; C002-TC-402, 423, 642, 665 pass on the server of the packed tarball
- [ ] C002-TC-666 passes on the pinned OpenCode 1.18.31 with the stub model: no `-32602` in any row, the success row validates
- [ ] C002-TC-662 and the eleven rows of C002-TC-667 pass; both `replay-sdd-mcp-server.json` reports are regenerated, validate against the schema copy and show 0 differing decisions, or the report names each remaining case as a defect
- [ ] `architect-target.json` `package_version` and the `{{package_version}}` token come from the source `plugin.json`, with no built-in fallback; C002-TC-672 (five rows) and the supporting generator test pass; `npm run check` is green
- [ ] `readChecklistSteps` returns null for every unreadable condition of C002-IF-009 §4 Step index and reads the repository checklist; C002-TC-637 (all rows, the three `PG-900` rows included), 668 (21 rows), 669 (the two unreadable-index rows included), 670 and 671 pass, and the outcome word that C002-TC-670 and 671 assert is `released` (or `refused`), the release record's `outcome`, never `allowed`
- [ ] The checklist and the record template carry the rerun rule with `earlier_results` and `cause`, and the `VS Code refused: ` rule of VSC-04 and VSC-06; C002-TC-617 passes with its supporting assertions and the template meets the C002-TC-618 review items
- [ ] The Claude Code doctor rows carry `host: "claude-code"`; the runner writes `targetPackage.version` into the source copy's `plugin.json`; C002-TC-906 … 911 pass; `TS-507.eval.mjs` asserts no `-32602` (carried: the paid rows of C002-TC-507, 509, 515 and 639 to C002-T-056; C002-TC-516 and 618 to the checklist run of C002-T-050)
- [ ] The task report lists the items that needed no code change (doctor wiring, `main.ts`, `release-check.mjs`, runner) and names this task as the follow-up of C002-T-019, C002-T-041, C002-T-044, C002-T-046 and C002-T-047
- [ ] Progress reported: `sdd task set C002-T-064 --status done --commit <sha>`
