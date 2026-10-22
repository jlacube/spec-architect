---
id: C001-T-080
title: "NFR catch-up (D-014): Node 20 package filter and test cleanup, archive faults, check encoding and coverage steps, coverage to 85%"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: todo
depends_on: [C001-T-065, C001-T-053]
implements: [C001-REQ-1117, C001-REQ-126]
satisfies_ac: [C001-AC-1117.1, C001-AC-126.1]
verified_by: [C001-TS-1118, C001-TS-132, C001-TC-1118, C001-TC-132, C001-TC-1126, C001-TC-1127, C001-TC-1128, C001-TC-1129, C001-TC-1130]
components: [C001-COMP-12, C001-COMP-06]
risk_refs: [C001-RISK-014]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-080 — NFR catch-up (D-014): Node 20 package filter and test cleanup, archive faults, check encoding and coverage steps, coverage to 85%

## Intent

Close defect D-014: the five findings F-1 … F-5 of `docs/nfr-results.md` §7, found by C001-T-065.
After this task `npm run check` itself measures C001-NFR-404 and C001-NFR-502. It is green on
Node 20.20.2 and 22.22.3 in PowerShell 7 and Git Bash (C001-NFR-401, 403). The fault campaign
covers all four commands that C001-NFR-301 names. Line coverage reaches 85% (P-01, Q-coverage-01
"Write tests to 85% (Recommended)"). This task follows C001-T-061 and C001-T-065, which stay `done`.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `scripts/package.mjs › pluginFilter` | F-1: before `relative()`, remove the Windows long-path prefix from both the source root and the filter argument (`\\?\` → nothing, `\\?\UNC\` → `\\`). Then `targets/` matches `CLAUDE_EXCLUDES` on Node 20 too. The docstring names the Node 20 behaviour |
| add | `tests/unit/packaging/plugin-filter.test.ts` | F-1: calls the exported `pluginFilter` with plain and `\\?\`-prefixed paths (root and argument, each with or without the prefix). `targets` and `targets\x\a.md` are excluded, other folders are kept. The test runs on both Node versions, because it does not depend on what `cpSync` passes |
| modify | `tests/integration/mcp/shell.test.ts › "output caps and timeout…"` | F-2: after the `timed_out` answer, wait until the stub process tree has ended, then remove the stub folder. The `log` stub script writes its `process.pid` to a file in the fixture. The test then polls that PID with the `alive(pid)` helper that the C002-TS-687 test of the same file already uses, under a bounded deadline (for example 10 s). The test fails if the deadline passes, and never retries the removal blindly |
| modify (only if the EPERM recurs in the runs of step 9) | `tests/integration/cli/serena-user-data.test.ts › C002-TS-685 row 1` | the same wait-before-cleanup for the `serena.exe` stub (`docs/nfr-results.md` §2, flaky under load) |
| modify | `bench/faults.mjs › COMMANDS`, header comment, `note` | F-4: add `archive` (C001-REQ-913 preconditions met by the fixture). Split the 1,000 runs evenly over `status --write`, `task set`, `gate approve` and `archive` (250 each). The state-file list gains the files `archive` writes: `_living/` specs, `_archive/` change folder, `registry.json`, `SDD.md`. Remove the "joins with C001-T-053" notes |
| modify | `tests/integration/faults.test.ts › COMMANDS` | F-4: an `archive` entry with a `prepare` that puts the fixture change into an archivable state. The state check covers the files `archive` writes |
| add | `scripts/check/encoding.mjs` | F-5, C001-NFR-404: scan for a UTF-8 BOM, any CR byte and invalid UTF-8. Scope (a), which fails the step: a fresh fx-large workspace (`tests/fixtures/gen-large.mjs`) after the bundled CLI runs `status --write` and `trace --write`, plus a workspace that the CLI created from fx-empty (`init`, `change new`). Scope (b), reported only: this repository's `.sdd/` working tree, printed as a count with paths, because those files are not written by the CLI and git normalises them at commit (`.gitattributes` `.sdd/** text eol=lf`). Output: one line per violating file and a total |
| add | `tests/unit/check/encoding.test.ts` | the scanner flags a seeded BOM file, a CRLF file and an invalid-UTF-8 file, and passes a clean LF file |
| modify | `scripts/test.mjs` | a coverage mode (option or environment variable) that follows the method of `docs/nfr-results.md` §4. Test files are transpiled with inline source maps. Both bundles (`plugins/architect/scripts/sdd.mjs`, `build/npm/sdd-mcp.mjs`) are rebuilt with inline source maps, so spawned CLI and MCP processes report `src/` coverage. `NODE_OPTIONS` carries `--enable-source-maps` and the no-network preload. `--experimental-test-coverage` writes lcov to `coverage/`. The scheduling stays as it is, so C001-TC-705 still runs alone |
| add | `scripts/check/coverage.mjs` | reads `coverage/lcov.info` and computes lines and branches over every file under `src/` (117 files at T-065), with no exclusions (Q-coverage-01 rejected excluding `src/mcp/`). Prints both figures and the 10 lowest files. Exits non-zero below 85.00% lines or 75.00% branches (C001-NFR-502) |
| modify | `scripts/check.mjs › STEPS` | F-5: two new steps. `encoding` ("artifact encoding scan (C001-NFR-404)") comes after `fixtures`. `coverage` ("coverage (C001-NFR-502)") comes last: it runs `scripts/test.mjs` in coverage mode, then `scripts/check/coverage.mjs`, and always restores the shipped bundles with `scripts/build.mjs`, also when it fails. Both steps can be chosen with `--steps` |
| add | tests under `tests/unit/` and `tests/integration/` (files named after the module they cover) | F-3: tests until lines ≥ 85% over `src/`. Areas that T-065 found lowest: tracking 48.9%, archive 48.0%, mcp 64.4%, workspace 70.9%, io 77.6%, hooks 79.2%. Files: `cli.ts`, `hooks/post-write.ts`, `workspace/init.ts`, `workspace/sddmd.ts`, `mcp/tools/files.ts`, `archive/living.ts`, `lint/types.ts`. Each test asserts behaviour that the spec or C001-IF states (exit code, output, file content), not only that the code ran |
| add | `tests/manual/TC-1127.md` | checklist of C001-TC-1127: the four `npm run check` runs (shell, Node version, how to put that Node first in `PATH`), what to record, and the pass rule |
| modify | `docs/nfr-results.md` | rows C001-NFR-301, 401, 403, 404, 502 of the summary, §1 (archive in the campaign), §2 (the four new check runs), §4 (coverage from the check step), §5 (encoding step), §7 (each finding marked resolved, with the commit). Date and commit of the new measurement |
| modify | `plugins/architect/scripts/sdd.mjs` | rebuilt bundle (`node scripts/build.mjs`), only if a `src/` file changed |

## Preconditions

- C001-T-065 done: `docs/nfr-results.md` exists, and its §4 method and §7 findings are the input.
- C001-T-053 done: `archive` exists for the fault campaign.
- C001-T-061 done (through T-065): `scripts/check.mjs` and its steps exist.
- Node 20.20.2 and 22.22.3 installed through nvm-windows; PowerShell 7 and Git Bash available (REF-WIN).
- `scripts/package.mjs`, `tests/integration/mcp/shell.test.ts` and `tests/integration/cli/serena-user-data.test.ts` come from CHG-002. Change them only as the Targets say, and keep the CHG-002 test case IDs and test names.
- No production behaviour changes, except the `pluginFilter` fix. Suppose a new test shows that `src/` contradicts the spec, for example `archive` leaving a corrupted state file. Then raise a defect (`sdd defect add --ref <REQ>`) instead of changing the test to pass.

## Step outline (no production code)

1. F-1, test first. Write the `pluginFilter` unit test and watch the prefixed-path cases fail.
   Then add the prefix removal. On Node 20, the three failing packaging tests of
   `docs/nfr-results.md` §2 must pass.
2. F-2. Make the `log` stub script write its PID. Change the timeout test to wait for that PID to end
   before the cleanup. Run the file alone on Node 20 three times; all three runs must pass.
3. F-4. Add `archive` to `tests/integration/faults.test.ts` (it must fail at every write point of
   `archive` and leave each state file old or new). Then add it to `bench/faults.mjs`.
   Suppose an interrupted `archive` leaves a file that is neither old nor new. That is a defect
   against C001-REQ-126 / C001-NFR-301: report it and stop that part.
4. F-5 encoding. Write the scanner test first, then `scripts/check/encoding.mjs` with scopes (a)
   and (b) as the Targets give them, then the `encoding` step.
5. F-5 coverage. Add the coverage mode of `scripts/test.mjs`, `scripts/check/coverage.mjs` and
   the `coverage` step. Confirm that `git status` shows no tracked change after the step, so
   the shipped bundles are restored. Confirm that an injected failure (threshold set above the
   measured value through a test-only environment variable) makes `npm run check` exit
   non-zero, as C001-REQ-1117 requires.
6. F-3. Run the coverage step and read the per-file report. Add tests in order of uncovered
   lines, largest first, until lines ≥ 85%. Do not lower thresholds. Do not exclude files from
   `src/`. Do not add `c8 ignore`-style comments.
7. Run `npm run bench` on Node 20 (full campaign including faults). Then run the
   `--skip-faults` benchmarks on Node 22, as T-065 did.
8. Rebuild (`node scripts/build.mjs`) and run `node plugins/architect/scripts/sdd.mjs lint`.
9. Four sequential `npm run check` runs from the repository root, each with the given Node first
   in `PATH`: Git Bash with Node 20.20.2, Git Bash with Node 22.22.3, PowerShell 7 with Node
   20.20.2, PowerShell 7 with Node 22.22.3 (C001-TC-1127). Nothing else runs in parallel.
   Record the step table, the test counts, the exit code and the duration of each run.
10. Update `docs/nfr-results.md` as the Targets say and report the task.

## Verification

- `npm test -- unit/packaging/plugin-filter integration/packaging/package-staging cap01/package-flow mcp/shell faults unit/check/encoding` on Node 20.20.2 and on Node 22.22.3
- `node scripts/check.mjs --steps encoding,coverage` (prints the scan total and the coverage figures; exit 0)
- `npm run bench` on Node 20.20.2 (fault campaign: 0 corrupted files over 1,000 runs, `archive` included)
- `npm run check` four times: Node 20.20.2 and 22.22.3, each in PowerShell 7 and in Git Bash (exit 0 in all four)
- `node plugins/architect/scripts/sdd.mjs lint`

## Done when

- [ ] F-1: on Node 20 no Claude Code package or staged plugin holds `targets/`; the `pluginFilter` test passes on Node 20 and 22.
- [ ] F-2: the shell timeout test passes on Node 20 in 3 of 3 runs alone and in every check run.
- [ ] F-4: `archive` is in `tests/integration/faults.test.ts` and `bench/faults.mjs`; 0 corrupted state files over 1,000 runs (C001-TC-1126).
- [ ] F-5: `npm run check` has the `encoding` and `coverage` steps; a seeded violation or an unmet threshold makes it exit non-zero (C001-TC-1129, C001-TC-1130, C001-TC-1118).
- [ ] F-3: the coverage step reports ≥ 85% lines and ≥ 75% branches over `src/`, counting the spawned CLI and MCP processes.
- [ ] `npm run check` exits 0 in all four runs (Node 20.20.2 and 22.22.3, PowerShell 7 and Git Bash), and 100% of the run tests pass on both Node versions (C001-TC-1127, C001-TC-1128).
- [ ] `docs/nfr-results.md` rows C001-NFR-301, 401, 403, 404 and 502 show the new results with date and commit; findings F-1 … F-5 are marked resolved.
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003.
- [ ] Progress reported: `sdd task set C001-T-080 --status done --commit <sha>`. That commit is the resolution evidence for closing D-014.
