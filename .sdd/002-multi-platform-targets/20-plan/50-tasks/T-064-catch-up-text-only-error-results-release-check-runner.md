---
id: C002-T-064
title: "Catch-up for revision D-015 … D-017: text-only MCP error results, generator package version, release-check rows, eval-runner rules"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-019, C002-T-020, C002-T-025, C002-T-038, C002-T-041, C002-T-044, C002-T-046, C002-T-047, C002-T-063]
implements: [C002-REQ-402, C002-REQ-405, C002-REQ-407, C002-REQ-504, C002-REQ-509, C002-REQ-606, C002-REQ-608, C002-REQ-614, C002-REQ-615, C002-REQ-617, C002-REQ-618, C002-REQ-627]
satisfies_ac: [C002-AC-402.1, C002-AC-405.1, C002-AC-407.1, C002-AC-504.1, C002-AC-509.1, C002-AC-606.1, C002-AC-608.1, C002-AC-614.1, C002-AC-615.1, C002-AC-617.1, C002-AC-618.1, C002-AC-627.1]
verified_by: [C002-TS-402, C002-TS-665, C002-TS-423, C002-TS-642, C002-TS-666, C002-TS-662, C002-TS-667, C002-TS-507, C002-TS-515, C002-TS-611, C002-TS-617, C002-TS-618, C002-TS-637, C002-TS-668, C002-TS-669, C002-TS-670, C002-TS-671, C002-TC-402, C002-TC-665, C002-TC-423, C002-TC-642, C002-TC-666, C002-TC-662, C002-TC-667, C002-TC-507, C002-TC-515, C002-TC-906, C002-TC-907, C002-TC-908, C002-TC-617, C002-TC-618, C002-TC-637, C002-TC-668, C002-TC-669, C002-TC-670, C002-TC-671]
components: [C002-COMP-005, C002-COMP-006, C002-COMP-008, C002-COMP-009, C002-COMP-010, C002-COMP-001, C002-COMP-002, C002-COMP-011]
risk_refs: [C002-RISK-020]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-064 — Catch-up for revision D-015 … D-017: text-only MCP error results, generator package version, release-check rows, eval-runner rules

## Intent

The spec revision for defects D-015, D-016 and D-017 (P-01 answers Q-mcp-errors-01 "No structured
error (Recommended)" and Q-openrouter-02 in `../../10-spec/questions-log.md`, round 2026-10-20)
changed contracts that done tasks already implemented: C002-T-019 (server results), C002-T-041
(replay adapter), C002-T-044 (OpenCode runner), C002-T-047 (release check) and, through C002-T-025,
the generator's manifest. Done tasks are not reopened. This task brings their code, case files and
tests to the revised contracts and is recorded as the follow-up of C002-T-019, C002-T-041,
C002-T-044 and C002-T-047. It unblocks the rest of C002-T-056: the OpenCode doctor rows that run
`run_command` probes fail with `-32602` until the server's error results carry no
`structuredContent` (D-017). The release-check catalogue mirror of ERR-REL-004, 009, 011 and 012 is
already done (commit e0ade13); this task does not touch `scripts/release/errors.ts`.

The work has three parts: **(a)** D-017, error results text-only (C002-IF-002 §4, §6.1;
C002-IF-009 §2.3; C002-IF-006 §2); **(b)** D-016, the generator's `package_version` and the
release-check rows (C002-IF-004 §Output; C002-IF-009 §4, §5); **(c)** D-015, the eval-runner rules
and the checklist rows (C002-IF-010 §1, §2, §2.1, §4; C002-IF-009 §4).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/mcp/results.ts` › `errorResult` | (a) an error result is `isError: true` with one text item and **no** `structuredContent` (C002-IF-002 §4). The text is exactly `<code>: <message>` for an `ERR-MCP-*` code (the print form of `errors.md` §2 without a fix) and the guard core's deny message as the core returns it for a `GUARD-*` code (it already starts with its code, so the code is never written twice; C002-IF-002 §6.1). The header comment names §6.1 instead of `$defs/errorResult` |
| modify | `src/mcp/handlers.ts`, `src/mcp/tools/files.ts`, `src/mcp/tools/shell.ts` (call sites of `errorResult`) | (a) only as far as the narrowed result needs: the arguments that fed the former structured fields (`status`, `tool`, `path`, `occurrences`) leave the result; the message keeps every value the former fields carried where §6.1 says the message names it (path, count) |
| modify | `src/mcp/server.ts` › `tools/call` handler (about line 201) | (a) the `debug("tools/call-done", …)` code is read from the result's text (the characters before the first `: `) instead of `structuredContent.code` |
| modify | `src/mcp/tools.schema.json` | (a) byte copy of `../../10-spec/50-interfaces/sdd-mcp-tools.schema.json` (no `$defs/errorResult`); the schema-copy equality test of C002-T-006 passes |
| modify | `src/mcp/served-schemas.json` | (a) rewritten by `node scripts/mcp-schemas.mjs` from the new contract copy; `tests/integration/contracts/mcp-served-schemas.test.ts` passes. The served `outputSchema` of each tool describes its success output only |
| modify | `tests/integration/mcp/faults.test.ts` | (a) C002-TC-402: each row asserts the text that starts with `<code>: ` and no `structuredContent` key |
| add | `tests/integration/mcp/error-results.test.ts` | (a) C002-TC-665: one test per Examples row, on the server of the packed tarball |
| modify | `tests/integration/mcp/files.test.ts`, `tests/integration/mcp/shell.test.ts`, `tests/integration/mcp/quick-lint.test.ts` | (a) every refusal or failure assertion reads the text (code before the first `: `, the message after it) and asserts no `structuredContent` key; the output-schema validation runs on successes only. In `shell.test.ts`: the revised C002-TC-423 and C002-TC-642 |
| modify | `tests/replay/adapters/sdd-mcp-server.ts` › `readServerDecision` | (a) C002-IF-009 §2.3: an error result is told by `isError: true`; its code is the text before the first `: `; a text that starts with no code of `errors.md` §2 or §6 reads `error`; a success is read from `structuredContent.status`; `detail` holds the result's text. `DENY` and `ALLOWED_REFUSAL` keep their codes |
| modify | `tests/unit/replay/adapters.test.ts` | (a) C002-TC-667: one test per Examples row, against an in-process stub server |
| modify | `tests/replay/scenarios/suite.test.ts` | (a) C002-TC-662 asserts the text-only ERR-MCP-003 result and the report row |
| modify | `tests/replay/scenarios/opencode-host.test.ts` | (a) C002-TC-666: the pinned OpenCode 1.18.31 with the stub model, the package generated with `--mode opencode=sdd-mcp-server`, one test per Examples row (no spend, no credential) |
| modify | `docs/releases/opencode/0.0.1/replay-sdd-mcp-server.json`, `docs/releases/copilot/0.0.1/replay-sdd-mcp-server.json` | (a) regenerated by `npm run replay -- --mechanism sdd-mcp-server` (both targets): `detail` holds the result texts; 0 differing decisions; each validates against `docs/releases/release-record.schema.json` |
| modify | `plugins/architect/targets/opencode/wiring/doctor-report.md`, `plugins/architect/targets/copilot/wiring/doctor-report.md`, both `code-discovery-toolchain.md` | (a) only if a text names a structured field: the doctor reads the probe's refusal from the result text, `ERR-MCP-006: could not start "<executable>": only a .cmd or .bat shim was found` → `error`, `… not found on PATH` → `missing` (C002-IF-006 §2) |
| modify | `evals/targets/doctor/TS-507.eval.mjs` | (a) C002-TC-507: the ripwire row `missing` with its fallback and install command, and no part or reply naming the MCP error `-32602` |
| modify | `scripts/generate/main.ts` › the `publish(…)` call (about line 214), `scripts/generate/writer.ts` › `packageFiles` (about line 80), `scripts/generate/translate/wiring.ts` › `packageVersion` | (b) `architect-target.json` `package_version` is the `version` of `<source>/.claude-plugin/plugin.json` of the run, from the same function that fills the `{{package_version}}` token (`packageVersion(source)`, exported or moved to a module both import); the built-in `VERSION` is no longer passed as the package version (C002-IF-004 §Output, revised for D-016 item 6) |
| modify | `tests/integration/cap01/generator-frame.test.ts` | (b) supporting test (supports C002-TC-670, C002-TC-671 and C002-TC-515): a fixture source plugin of version `0.3.0` generates both targets with `package_version` `0.3.0` and the token value `0.3.0`; the repository's plugin still gives its own version |
| modify | `tests/integration/cap06/release-check.test.ts`, `tests/integration/cap06/fx-release.ts` | (b) C002-TC-637 (the three `PG-900` rows; the fx-release corpora gain a case `PG-900` limited by `platforms` to `linux`), C002-TC-668, C002-TC-669, C002-TC-670 and C002-TC-671, one test per Examples row |
| modify | `scripts/release-check.mjs`, `scripts/release/*.ts` (not `errors.ts`) | (b) only for a row of C002-TC-637 or C002-TC-668 … 671 that fails; the expected behaviour is C002-IF-009 §4 and §5 as revised (step rules of the package's mode, evidence kinds, reports per mode, `--dry-run`, `--root`, exit codes 0 … 3). C002-TC-671's exit-3 row needs a test-only injection point for an invalid release record; add one if C002-T-047 left none |
| modify | `tests/integration/cap06/checklist.test.ts` | (c) C002-TC-617: the boundary step's mode `sdd-mcp-server`, the delegated-edit step's mode `both`; C002-TS-358, now a Scenario Outline over both modes without a mode tag, maps to a step of each mode; the C002-TS-516 note on a restricted-mode row recorded `failed` |
| modify | `docs/checklists/records/TEMPLATE.md`, `docs/checklists/vscode-copilot.md` | (c) only if C002-TC-617 or the C002-TC-618 review items fail: the record lists each step of the package's mode once at its last run, with a `note` naming earlier runs and their results (C002-IF-009 §4 example `VSC-10`) |
| modify | `evals/targets/doctor/doctor-cases.mjs` › `doctorCase` | (c) the Claude Code rows carry `host: "claude-code"` like every other row (C002-IF-010 §1, D-015 item 7), so `--host opencode` no longer runs them |
| modify | `evals/harness/runners/opencode.mjs` › `generatedPackage` | (c) `targetPackage.version` is written into the `.claude-plugin/plugin.json` of the source copy before generation, so that the manifest's `package_version` and the `{{package_version}}` token both carry it (C002-IF-010 §2.1; C002-TS-515); the after-the-fact rewrite of `architect-target.json` goes |
| modify | `tests/integration/cap06/runner-caps.test.ts` | (c) C002-TC-906 (rows by `host`), C002-TC-907 (key file refusal, `OPENROUTER_API_KEY` only, isolated folders, key never written) and C002-TC-908 (direct relay), each on the stub host or a stubbed host start, no paid session; and the runner's version stamp of (c) on the stub host |

## Preconditions

- C002-T-019, C002-T-020, C002-T-025, C002-T-038, C002-T-041, C002-T-044, C002-T-046, C002-T-047 and
  C002-T-063 done. C002-T-056 is in progress and paused on D-017; it waits for this task.
- G2 re-approved after the D-015 … D-017 revision (gate record 2026-10-20 of `../../change.md`).
- REF-WIN with the pinned OpenCode 1.18.31 binary and Node.js 22.22.2 or later for C002-TC-666
  (E-OC of test plan §3). This task runs **no paid session**: C002-TC-666 uses the stub model, and the
  paid rows of C002-TC-507, 509, 515 and 639 run in C002-T-056.

## Step outline (no production code)

1. Write or adjust the test cases first, each Examples row its own `test()` whose name starts with
   its TS ID (test plan §1; C002-TC-906 … 908 start with their TC ID). Watch C002-TC-665, 667, 666
   and the error assertions of `faults`, `files`, `shell` and `quick-lint` fail against today's
   `structuredContent` error results.
2. **(a) Server.** Narrow `errorResult` to the text-only form of C002-IF-002 §6.1 and adapt its call
   sites; read the debug code from the text in `server.ts`. Copy the contract schema byte for byte to
   `src/mcp/tools.schema.json` and regenerate `served-schemas.json` with `node scripts/mcp-schemas.mjs`.
   Check every `ERR-MCP-*` text against the Message cell of `errors.md` §2 (placeholders filled, no
   fix) and every `GUARD-*` text against the core's deny message for the same call. Rebuild and repack
   (`npm run build`, then the tarball of C002-T-022) so the integration tests run the changed server.
3. **(a) Replay adapter.** Change `readServerDecision` to read the code from the text (§2.3) and run
   C002-TC-667. Run `npm run replay -- --mechanism sdd-mcp-server` for both targets and write the two
   reports; 0 differing decisions must hold. A case that now differs is a product defect or a spec
   defect, never a new expectation: name it in the task report. Run C002-TC-662.
4. **(a) OpenCode acceptance.** Add C002-TC-666 to `opencode-host.test.ts` with the stub model: the
   first step calls the row's host tool, the second answers `done`. Assert the part text, the absence
   of `-32602` and of `structured content does not match the output schema` in every part, message and
   session error, and the row's state. The success row (`sdd status`) checks that the success output
   still validates in OpenCode.
5. **(a) Doctor.** Read the two `doctor-report.md` and `code-discovery-toolchain.md` variants; change a
   text only where it names a structured field. Add the `-32602` assertion to `TS-507.eval.mjs`. No
   paid run here: C002-TC-507 runs in C002-T-056.
6. **(b) Generator version.** Pass the source plugin's version to the writer through the same function
   as the token. If the source manifest gives no string `version`, keep today's behaviour and name it
   in the task report as a candidate spec defect (C002-IF-004 names no error for it). Run the
   supporting test, `npm run package` and `npm test -- cap01`, then `npm run check`: the repository's
   packages keep their version and `source_digest`.
7. **(b) Release-check rows.** Add the `PG-900` case to the fx-release corpora and write C002-TC-637's
   three rows and C002-TC-668 … 671. Change `scripts/release-check.mjs` or `scripts/release/*.ts` only
   for a row that fails, to the behaviour of C002-IF-009 §4, §5 as revised. Run
   `node scripts/release-check.mjs --target opencode --dry-run` on the repository evidence and record
   its outcome line in the report (refusals are expected until C002-T-049).
8. **(c) Checklist rows.** Run C002-TC-617; check the record template against C002-TC-618 (each step of
   the mode once at its last run, the rerun `note`). Change the checklist or the template only for an
   item that fails.
9. **(c) Eval runner.** Give the Claude Code doctor rows `host: "claude-code"`; write
   `targetPackage.version` into the source copy's `plugin.json` before generation; write C002-TC-906,
   907 and 908. C002-TC-906 also reads the real doctor case files and shows that `--host opencode`
   selects no Claude Code row; no session starts.
10. Run `npm test`, `npm run check` and `npm run bench` (server benchmarks of C002-NFR-101 and
    C002-NFR-102 unchanged within their thresholds).

## Verification

- `npm test -- mcp/faults`, `npm test -- mcp/error-results`, `npm test -- mcp/files`,
  `npm test -- mcp/shell`, `npm test -- mcp/quick-lint`, `npm test -- contracts`
- `npm test -- unit/replay`, `npm run replay -- suite`, `npm run replay -- opencode-host`
- `npm run replay -- --mechanism sdd-mcp-server` (both targets; 0 differing decisions)
- `npm test -- cap01/generator-frame`, `npm test -- cap05/doctor-variants`
- `npm test -- cap06/release-check`, `npm test -- cap06/checklist`, `npm test -- cap06/runner-caps`
- `node scripts/release-check.mjs --target opencode --dry-run`
- `npm test`, `npm run check`, `npm run bench`

## Done when

- [ ] No error result of the server carries `structuredContent`; C002-TC-402, 423, 642, 665 pass on the server of the packed tarball; `src/mcp/tools.schema.json` equals the contract copy and `served-schemas.json` is up to date
- [ ] C002-TC-666 passes on the pinned OpenCode 1.18.31 with the stub model: no `-32602` in any row, the success row validates
- [ ] C002-TC-662 and 667 pass; both `replay-sdd-mcp-server.json` reports are regenerated, validate against the schema copy and show 0 differing decisions, or the report names each remaining case as a defect
- [ ] `architect-target.json` `package_version` comes from the source `plugin.json`; the supporting generator test passes; `npm run check` is green
- [ ] C002-TC-637 (all rows, the three `PG-900` rows included), 668, 669, 670 and 671 pass
- [ ] C002-TC-617 passes and the record template meets the C002-TC-618 review items
- [ ] The Claude Code doctor rows carry `host: "claude-code"`; the runner writes `targetPackage.version` into the source copy's `plugin.json`; C002-TC-906, 907 and 908 pass; `TS-507.eval.mjs` asserts no `-32602` (carried: the paid rows of C002-TC-507, 509, 515 and 639 to C002-T-056)
- [ ] The task report lists the items that needed no code change (doctor wiring, release-check code, checklist and template) and names this task as the follow-up of C002-T-019, C002-T-041, C002-T-044 and C002-T-047
- [ ] Progress reported: `sdd task set C002-T-064 --status done --commit <sha>`
