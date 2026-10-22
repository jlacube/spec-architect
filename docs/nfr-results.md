# NFR results — CHG-001 (C001-T-065)

One row per NFR of `.sdd/001-architect-agent-suite/10-spec/30-nfr/nfr.md`, with the measured result,
the threshold, the date and the machine. This is the comparison the observability plan
(`20-plan/78-observability.md`) points to: a miss here becomes a defect.

**Machine (REF-WIN).** Windows 11 Home 10.0.26200, Intel Core i7-10510U (8 logical cores), 16 GB RAM,
SSD; Node 20.20.2 and Node 22.22.3 (nvm-windows installs), npm 10.8.2 / 10.9.8; PowerShell 7.6.6 and
Git Bash 5.2.26; Claude Code 2.1.299 (desktop-bundled, `CLAUDE_CODE_EXECPATH`); git `core.autocrlf=true`.
**Commit measured:** `5eada4a` (working tree clean apart from untracked `bench/results/`).
**Date:** 2026-10-21. No paid sessions were run for this task.

**Re-measured by C001-T-080 (defects D-014, round 2 for F-6 and F-7) on 2026-10-22:** rows
C001-NFR-301, 401, 403, 404 and 502, and §1, §2, §4, §5 and §7. Same machine; npm 10.9.2 with Node
22.22.3. **Commit measured:** working tree on `b2117c9` (G3 re-approval after revision D-014/D-015),
which holds the first T-080 round as `5cdae42`, plus the uncommitted round-2 changes (F-6 bench rule,
F-7 coverage skip). Commit pending; the T-080 report gives it.

## Summary

| NFR | Threshold | Result (2026-10-21, REF-WIN) | Verdict | Evidence |
|---|---|---|---|---|
| C001-NFR-101 Full lint time | ≤ 5 s p95 of 10 on fx-large | 1,474 ms (Node 20.20.2); 971 ms (Node 22.22.3) | **pass** | `bench/results/lint-2026-10-21T19-16-41-974Z.json`, `lint-2026-10-21T20-41-03-813Z.json` |
| C001-NFR-102 Quick lint time | ≤ 800 ms p95 of 20 | 356 ms (Node 20); 256 ms (Node 22) | **pass** | `bench/results/lint-quick-2026-10-21T19-16-49-985Z.json`, `lint-quick-2026-10-21T20-41-09-691Z.json` |
| C001-NFR-103 Hook overhead | ≤ 300 ms p95 of 50, Node start-up included | 169 ms (Node 20); 145 ms (Node 22); path and bash guards | **pass** | `bench/results/guards-2026-10-21T19-16-57-937Z.json`, `guards-2026-10-21T20-41-17-076Z.json` |
| C001-NFR-104 Session-start brief | ≤ 1 s p95 of 10 on fx-large | 418 ms (Node 20); 327 ms (Node 22) (`sdd hook session-start`) | **pass** | `bench/results/session-start-2026-10-21T19-17-07-079Z.json`, `session-start-2026-10-21T20-41-24-189Z.json` |
| C001-NFR-105 Preloaded skill budget | ≤ 24,000 chars per skill, ≤ 64,000 per agent | PLG-SIZE-001: 0 findings | **pass** | `npm run check` step "plugin structure checks" (§3) |
| C001-NFR-106 Medium-feature tokens | ≤ 3,000,000 tokens per medium feature | not measured: needs the dogfood changes (C001-T-073, T-074, both todo); gate-log Usage cells of CHG-001 read `unavailable` | **not measured** | `docs/dogfood.md` (no token totals yet) |
| C001-NFR-201 No code modification | 100% denial, ≥ 200 cases | 256 path cases, 0 false allows, 0 false denies (re-run in every check run of §3) | **pass** | `tests/guards/path-corpus.test.ts`; `docs/security-results.md` §1 |
| C001-NFR-202 No network from scripts | 0 connections | 0 recorded calls in each of the 4 check runs (tests and fixture suite) | **pass** | `scripts/test.mjs` line "network calls during the tests: 0" |
| C001-NFR-203 No secrets in artifacts | ≥ 95% detection, ≤ 2% false positives | 69/69 detected (100%), 0/107 false positives (0%) | **pass** | `tests/security/secrets.test.ts` (output of the coverage run, §4) |
| C001-NFR-204 Least-privilege tools | 0 differences from C001-IF-09 | 0 differences | **pass** | `tests/integration/cap02/agents-if09.test.ts` (passes in all 4 runs) |
| C001-NFR-205 Injection resistance | 0 of ≥ 20 cases acted upon | not re-measured (paid evals); last result 0 of 21 at dev tier, milestone tier deferred to release | **not measured here** | `docs/security-results.md` §5, `docs/milestone-log.md` 2026-10-12 |
| C001-NFR-301 Crash-safe state files | 0 corrupted files over 1,000 fault-injected runs | 2026-10-22, Node 20.20.2, all four commands (250 runs each), rule of C001-TC-1126: **0 failing state files** over 1,000 runs (696 killed mid-run, 304 completed); `bench/faults.mjs` exit 0 | **pass** | `bench/results/faults-2026-10-22T19-05-33-841Z.json` |
| C001-NFR-302 Deterministic generation | 0 differing bytes outside `generated_at` | 0 (`trace --write`, `status --write`, two runs on fx-large) | **pass** | `tests/integration/determinism.test.ts` (Node 20 and 22) |
| C001-NFR-303 Lint correctness | 100% detection, 0 findings on clean fixtures | 56 of 56 fixture tests pass; `sdd lint 001` on this spec: 0 findings | **pass** | `npm run check` step "lint fixtures"; `tests/unit/lint/fixtures.test.ts` |
| C001-NFR-304 Graceful degradation | 100% of phases on cfg-full, cfg-no-ripwire, cfg-bare | not measured: dogfood runs on three configurations (C001-T-074, todo) | **not measured** | — |
| C001-NFR-401 Windows 11, both shells | `npm run check` passes on PowerShell 7 and Git Bash (+ TS-1102 install) | 2026-10-22: exit 0 in all four runs (Node 20.20.2 and 22.22.3, each in PowerShell 7 and Git Bash); on Node 20 the coverage step reports skipped with its reason (C001-NFR-502 Environment). TS-1102 (manual install) not run here | **pass** | §2 |
| C001-NFR-402 macOS and Linux readiness | 0 platform-specific constructs outside the marked module | PLG-PORT-002: 0 findings; simulated POSIX path tests pass. Real macOS/Linux runs not measured here | **pass (static)**; OS runs not measured | §3; `.github/workflows/check.yml` (dormant, `workflow_dispatch`) |
| C001-NFR-403 Node 20 and 22 | 100% unit-test pass rate on both | 2026-10-22: 1,602 of 1,602 run tests pass on Node 20.20.2 and on Node 22.22.3, in both shells (1 POSIX-only skip) | **pass** | §2 |
| C001-NFR-404 Artifact encoding | 0 files violating UTF-8 without BOM, LF | 2026-10-22, step "artifact encoding scan" of `npm run check`, all four runs: files written by the CLI 0 of 622 (fx-large) and 0 of 12 (fx-empty); repository `.sdd/` 1 of 335 reported (CRLF in the working tree, not written by the CLI) | **pass** | §5 |
| C001-NFR-501 Single-file runtime | 0 runtime imports of unbundled packages | `sdd.mjs` copied alone to a folder with no `node_modules` above it: `version`, `lint`, `status --write`, `trace --write` run on Node 20 and 22; 8 import specifiers, all Node built-ins | **pass** | §6 |
| C001-NFR-502 CLI test coverage | ≥ 85% lines, ≥ 75% branches | 2026-10-22, step "coverage" of `npm run check` on Node 22.22.3, no exclusions: 88.72% lines (8,818/9,939), 82.06% branches (4,937/6,016) in Git Bash; 89.09% (8,855/9,939) / 82.48% (4,968/6,023) in PowerShell 7. On Node 20.20.2 the step is skipped with its reason (Environment of the NFR; F-7) | **pass** | §4 |
| C001-NFR-503 One rule, one module | 0 catalogue codes without module or fixture | PLG-RULES-001: 0 errors, 12 pending (LINT-RISK-001, LINT-ROLL-001, LINT-HAND-001, LINT-HAND-002: no module and no fixture, owned by C001-T-076, todo) | **open until T-076** | §3 |
| C001-NFR-601 Actionable messages | 0 catalogue entries without code, location, fix | PLG-MSG-001: 0 findings | **pass** | §3 |
| C001-NFR-602 Time to first change | ≤ 15 min on a fresh profile | not measured: manual timed run by P-01 (`tests/manual/TS-1102.md`, C001-T-072) | **not measured** | — |
| C001-NFR-701 Per-phase usage record | 0 gate-log rows without a Usage cell | LINT-GATE-001: 0 findings on CHG-001 (`sdd lint 001`: 0 errors); every row has a cell (`unavailable` so far) | **pass** | `.sdd/001-architect-agent-suite/change.md` Gate log |
| C001-NFR-702 CLI diagnostics | 0 subcommands without `SDD_DEBUG` traces | 0 (test enumerates every command) | **pass** | `tests/integration/cli/frontend.test.ts` "SDD_DEBUG=1 writes timing and decision traces…" (Node 20 and 22) |
| C001-NFR-801 License compliance | 0 files or packages outside the allowlist | build licence check passes; SPDX header scan of the fresh tarball: 0 errors | **pass** | `npm run check` steps "build" and "architect-sdd tarball check" |

Verdict counts (2026-10-21; rows of 2026-10-22 as re-measured by C001-T-080): 22 pass (one static
only), 0 fail, 1 open until its owner task (NFR-503), 5 not measured here (NFR-106, 205, 304, 602 and
the real-OS part of NFR-402).

The two test cases of this task: **C001-TC-705** (`tests/integration/cap07/TS-705.test.ts`) and
**C001-TC-1119** (`tests/integration/cap11/TS-1119.test.ts`) pass in all four check runs (Node 20 and 22,
PowerShell 7 and Git Bash). TC-705 runs serially, as `scripts/test.mjs` schedules it; its median of 5
was under 800 ms in every run.

## 1. Benchmarks (NFR-101 … 104, 301)

`npm run bench` with Node 20.20.2 first in `PATH` (Git Bash), full run including the 1,000-run fault
campaign: exit 0, 187 s. Then `node scripts/build.mjs && node bench/run.mjs --skip-faults` with Node
22.22.3. The machine was otherwise idle (no test run in parallel).

| Benchmark | NFR | Runs | p95 Node 20.20.2 | p95 Node 22.22.3 | Threshold |
|---|---|---|---|---|---|
| `bench/lint.mjs` (fx-large, 500 files, 2,000 IDs) | C001-NFR-101 | 10 | 1,474 ms | 971 ms | 5,000 ms |
| `bench/lint-quick.mjs` | C001-NFR-102 | 20 | 356 ms | 256 ms | 800 ms |
| `bench/guards.mjs` (guard-path, guard-bash) | C001-NFR-103 | 50 | 169 ms | 145 ms | 300 ms |
| `bench/session-start.mjs` (`sdd hook session-start`) | C001-NFR-104 | 10 | 418 ms | 327 ms | 1,000 ms |
| `bench/faults.mjs` | C001-NFR-301 | 1,000 | 0 corrupted | — | 0 corrupted |

CHG-002 benchmarks run by the same command (recorded for completeness, thresholds of CHG-002):
`mcp-refusals` p95 1 ms / 1 ms, `mcp-writes` 100 ms / 69 ms, `generate` 1,188 ms / 876 ms (Node 20 /
Node 22), all within their thresholds.

Fault campaign detail (Node 20): 334 × `status --write`, 333 × `task set`, 333 × `gate approve`; 744
processes killed mid-run, 256 completed; 0 corrupted state files; 24 orphan `*.tmp-<pid>-<hex>` files
left next to state files (never in place of one; the cleanup is a known candidate improvement in
`docs/dogfood.md`).

**2026-10-22 (C001-T-080, round 2): the campaign of record.** `npm run bench` with Node 20.20.2 first in
`PATH` (Git Bash; `node --version` → `v20.20.2` in the same shell), full run including the fault
campaign: exit 0, 220 s. Then `node scripts/build.mjs && node bench/run.mjs --skip-faults` with Node
22.22.3 (exit 0, 58 s). Nothing else running.

| Benchmark | p95 Node 20.20.2 | p95 Node 22.22.3 | Threshold |
|---|---|---|---|
| `bench/lint.mjs` | 1,807 ms | 1,290 ms | 5,000 ms |
| `bench/lint-quick.mjs` | 412 ms | 315 ms | 800 ms |
| `bench/guards.mjs` | 224 ms | 203 ms | 300 ms |
| `bench/session-start.mjs` | 573 ms | 427 ms | 1,000 ms |
| `mcp-refusals` / `mcp-writes` / `generate` (CHG-002) | 2 / 105 / 1,129 ms | 1 / 77 / 1,375 ms | 300 / 800 / 5,000 ms |
| `bench/faults.mjs` (C001-NFR-301) | **0 failing files of 1,000 runs** | — | 0 |

Fault campaign detail (Node 20.20.2, `bench/results/faults-2026-10-22T19-05-33-841Z.json`): 250 runs each
of `status --write`, `task set`, `gate approve` and `archive` (on a copy of fx-large made archivable:
G3 approved, every task done); 696 killed mid-run, 304 completed; **0 failing state files**; 22
orphan temporary files (next to state files, never in place of one). The pass rule is that of
C001-TC-1126 (finding F-6): per state file and run, the previous version, or a complete version that
the command writes to that path in an uninterrupted run, intermediate versions included. Absence
passes for a file that did not exist before or that the command moves away. The versions come from one
uninterrupted reference run per command under `bench/record-writes.mjs`, which records the state files
after every rename, unlink and write. It found one intermediate version, `archive`'s `change.md` with
`status: archived` before the folder move; the other commands write only their final versions. The
bench exits 1 when any run has a failing file (`tests/unit/bench/faults-rule.test.ts` covers the rule).
The archive left half-done by such a kill, and the doubled living entries of a re-run, are D-015
(C001-T-081).

**2026-10-22 (C001-T-081, D-015): archive share rerun.** After the resumable archive (C001-REQ-924:
already-applied checks, the two-pass write order of CR-11, the folder move with the bounded rename
retry), `npm run bench` with Node 20.20.2 first in `PATH` (Git Bash; `node -v` → `v20.20.2`), full run
including the fault campaign: exit 0, 203 s. Commit measured: working tree on `c44d8dc` plus the
uncommitted T-081 changes (a0c86b3). Fault campaign
(`bench/results/faults-2026-10-22T21-34-59-310Z.json`, rule of C001-TC-1126): 1,000 runs, 250 each of
`status --write`, `task set`, `gate approve` and `archive`; 672 killed mid-run, 328 completed; **0 failing
state files**, 0 of them in the 250 `archive` runs; 22 orphan temporary files (next to state files,
never in place of one). The recorded intermediate versions are unchanged: one, `archive`'s `change.md`
with `status: archived` before the folder move (fx-large has no cross-capability rename, so the
first-pass write of CR-11 does not occur there). Other p95 values of the same run: lint 1,327 ms,
lint-quick 314 ms, guards 174 ms, session-start 392 ms, mcp-refusals 1 ms, mcp-writes 84 ms, generate
1,098 ms, all within their thresholds.

**2026-10-22 (C001-T-080, round 1, superseded):** `node bench/faults.mjs 1000`, Node 22.22.3, nothing else
running, with the earlier rule (previous version or final version only): 250 runs each of `status --write`, `task set`, `gate approve` and `archive` (on a copy of
fx-large made archivable: G3 approved, every task done). 540 killed mid-run, 460 completed, 21 orphan
temporary files, **1 flagged state file**: run 515, `archive`, `.sdd/001-change-001/change.md`. The
file is neither the previous version nor absent (the bench's "new version", since `archive` moves
the folder). `archive` writes the living specs, the glossary and `change.md` (`status: archived`) in
place, then renames the change folder (`src/archive/apply.ts`); the kill fell between the two. A
probe of 400 more killed `archive` runs gave 1 such case. Its `change.md` was the complete
`status: archived` version, in a change folder that had not been moved; no file was torn. See F-6.
The bench printed `faults: FAIL` but exited 0: `bench/faults.mjs` sets no exit code.

## 2. `npm run check` under both shells and both Node versions (NFR-401, 403)

**2026-10-22 (C001-T-080, C001-TC-1127, round 2):** four sequential runs, nothing else running, the
given Node first in `PATH` (`tests/manual/TC-1127.md`); 10 steps, with the `encoding` and `coverage`
steps. On Node 20 the coverage step prints `SKIP  coverage (C001-NFR-502) — Node 20.20.2: Node 20's test
runner crashes while merging coverage from several processes ("reading 'startOffset'"); C001-NFR-502 is
measured on Node 22.22.3` and counts as passed (finding F-7).

| Shell | Node | typecheck | validate | build | tests | fixtures | encoding | structure | targets | tarball | coverage | Tests (pass / fail / skip of 1,603) | Exit | Time |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Git Bash 5.2.26 | 20.20.2 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | SKIP (Node 20) | 1,602 / 0 / 1 | **0** | 439 s |
| Git Bash 5.2.26 | 22.22.3 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS (88.72% / 82.06%) | 1,602 / 0 / 1 | **0** | 1,200 s |
| PowerShell 7.6.6 | 20.20.2 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | SKIP (Node 20) | 1,602 / 0 / 1 | **0** | 432 s |
| PowerShell 7.6.6 | 22.22.3 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS (89.09% / 82.48%) | 1,602 / 0 / 1 | **0** | 1,176 s |

The only skipped test is the POSIX-only lookup test. The coverage step takes about 13 minutes of each
Node 22 run (15 batches of test files in coverage mode, then the bundle rebuild). The Node 20 failures
of 2026-10-21 (F-1, F-2) do not occur. Free disk space stayed above 20 GB. Before the runs, the test
counts of this repository's CHG-001 plan were brought up to revision D-015 (`tests/integration/cap01/TS-105.test.ts`,
`tests/integration/trace/chg-001.test.ts`, `tests/unit/lint/spec-facts.test.ts`, `tests/unit/model/graph.test.ts`).
The ERR-CLI-014 condition in `src/cli/errors.ts` was also mirrored from the revised C001 `errors.md` (the
catalogue test compares them; the condition text is not printed, so no output changes).

Round 1 (2026-10-22, before F-7 was decided): the same four runs exited 1 on Node 20 in both shells,
coverage step only (Node 20's reporter crash), and 0 on Node 22 (88.05% / 82.50% and 88.51% / 82.41%).

**2026-10-21 (C001-T-065):**

Each run started from the repository root with the given Node first in `PATH`; the scripts are in the
task's scratch folder (Git Bash: `export PATH=<nvm>/vX:$PATH; npm run check`; PowerShell 7:
`$env:PATH = "<nvm>\vX;$env:PATH"; npm run check`). Runs were sequential, nothing else running.

| Shell | Node | typecheck | validate | build | tests | fixtures | structure | targets | tarball | Tests (pass / fail / skip of 1,578) | Exit | Time |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Git Bash 5.2.26 | 22.22.3 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1,577 / 0 / 1 | **0** | 422 s |
| PowerShell 7.6.6 | 22.22.3 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 1,577 / 0 / 1 | **0** | 410 s |
| Git Bash 5.2.26 | 20.20.2 | PASS | PASS | PASS | **FAIL** | PASS | PASS | PASS | PASS | 1,572 / 5 / 1 | **1** | 397 s |
| PowerShell 7.6.6 | 20.20.2 | PASS | PASS | PASS | **FAIL** | PASS | PASS | PASS | PASS | 1,573 / 4 / 1 | **1** | 390 s |

The skipped test is `lookup (POSIX): a regular file with execute permission` (`# SKIP POSIX only`): it
runs only on macOS/Linux. The lint fixture suite (56 tests) and the no-network check pass in all four
runs.

Failing tests on Node 20.20.2 (both shells unless noted):

| Test | File | Cause | Finding |
|---|---|---|---|
| C002-TC-101 (C002-TS-101): one packaging run writes both target packages and the Claude Code outputs as before | `tests/integration/cap01/package-flow.test.ts` | the Claude Code package contains `targets/` | F-1 |
| the staged plugin holds no targets/ entry and is otherwise the source plugin | `tests/integration/packaging/package-staging.test.ts` | same | F-1 |
| the plugin and marketplace zips hold no targets/ entry | `tests/integration/packaging/package-staging.test.ts` | same | F-1 |
| output caps and timeout: each stream cut at 1,048,576 characters; at timeout_ms the process is killed | `tests/integration/mcp/shell.test.ts` | `EPERM` unlinking the stub `git.exe` in cleanup; reproduced 2 of 2 when run alone on Node 20, passes alone on Node 22 | F-2 |
| C002-TS-685 row 1 — PATH BIN, serena-bin exe: one start with SERENA_HOME (Git Bash run only) | `tests/integration/cli/serena-user-data.test.ts` | `EPERM` unlinking `serena.exe` in cleanup; passed when re-run alone on Node 20 (flaky under load) | F-2 |

## 3. Structure checks (NFR-105, 204, 402, 503, 601)

`node scripts/check/run.mjs` (also inside every check run): 16 checks, 0 errors, 33 pending. The
pending findings belong to open owner tasks: 21 × PLG-EVAL-001 (C001-T-063, delegation evals) and
12 × PLG-RULES-001 (C001-T-076, the four plan rules LINT-RISK-001, LINT-ROLL-001, LINT-HAND-001,
LINT-HAND-002 without a module and a fixture). PLG-SIZE-001, PLG-TOOLS-001, PLG-PORT-001,
PLG-PORT-002 and PLG-MSG-001 report nothing.

macOS and Linux are **not measured here**: the dormant workflow `.github/workflows/check.yml` runs
`npm run check` on windows-latest, macos-latest and ubuntu-latest with Node 20 and 22 when started by
hand (`workflow_dispatch`). Until then NFR-402 rests on PLG-PORT-002 and the simulated POSIX path
tests (`tests/unit/io/paths.test.ts`).

## 4. Coverage (NFR-502)

**2026-10-22 (C001-T-080): the `coverage` step of `npm run check`, measured on Node 22.22.3; on Node 20
the step is skipped with its reason (F-7, C001-NFR-502 Environment).** `SDD_TEST_COVERAGE=1 node
scripts/test.mjs` follows the method below. In addition, the parallel test files run in batches of 16
(`SDD_TEST_COVERAGE_BATCH`), each a `node --test --experimental-test-coverage` run with its own lcov file,
joined into `coverage/lcov.info`. The bundles' inline source maps keep only the segments of `src/`
sources. Then `scripts/check/coverage.mjs` computes lines and branches over every `.ts` file under
`src/`, with no exclusions. A file that no test loads counts as fully uncovered. Records of one file
from several batches are merged; branches are matched by line and rank. Below 85% lines or 75%
branches the step fails. TC-705 still runs alone, without coverage.

Why the batches and the reduced map: node keeps one raw V8 coverage file per spawned process until its
run ends. With the whole map inlined, each file is 0.6–0.8 MB, and one whole-suite run filled the last
~460 MB of the disk (ENOSPC, coverage files lost). With batches the run stays above 10 GB free. A whole
map also undercounts on Node 22: an interim run with it gave 86.72% / 81.18%. It reported the
post-write hook (`src/hooks/post-write.ts`) as 29.7% covered, and even its module-level constants as
uncovered, although tests run that hook through the bundle and check its output. With the reduced map
the same file is 83.8% covered. The reduction was checked against the whole map: 43,054 sampled
positions in `src/` map to the same source and line, 0 differ, and 0 positions in dropped code map to
`src/`.

| Run (Node 22.22.3) | Lines | Branches |
|---|---|---|
| check round 2, Git Bash | **88.72%** (8,818 / 9,939) | **82.06%** (4,937 / 6,016) |
| check round 2, PowerShell 7 | **89.09%** (8,855 / 9,939) | **82.48%** (4,968 / 6,023) |
| earlier runs, same method | 88.05%, 88.51%, 88.58%, 89.86% | 82.50%, 82.41%, 82.49%, 82.43% |

The figure varies by about 1.8 points between runs. Coverage from processes that tests kill, or that
time out, is not recorded, and which ones that is varies with the load. 117 of 118 files are loaded.
`src/mcp/handlers.ts` (25 lines) has no lcov record although the MCP server imports it, so it counts
as uncovered. Lowest files: `lint/types.ts` 15.3%, `mcp/results.ts` 39.1%, `gate/revise.ts` 39.5%,
`gate/stale.ts` 43.8%, `cli/template-cmd.ts` 46.2%.

Type-only lines count. `src/lint/types.ts` has one runtime statement; 116 of its 137 lines are
uncovered: 78 lines of type and interface declarations and 38 comment lines. Without that file the
line figure would be 89.29%. Over all of `src/`, the uncovered lines are 973 code, 158 comment and 32
blank (node counts every line of a loaded file). No exclusion was added.

Node 20.20.2 gives no figure. Its test runner fails to merge the coverage of several processes: when
every range of a function is uncovered and none contains another, `mergeCoverageRanges` leaves the
function with an empty range list. The next comparison then reads `ranges[0].startOffset` from
undefined. This happens with the whole map too. Node 22's reporter does not have this fault (F-7).

The earlier figure of 79.99% (2026-10-21, below) is lower mainly because files whose code runs in
spawned CLI processes were counted almost uncovered. On 2026-10-21 it was `workspace/init.ts` 32%,
`hooks/post-write.ts` 30% and `cli.ts` 29%; with the method above, 85.7%, 83.8% and 76.5%. That run had
the whole maps inlined and the disk nearly full; lost coverage files are the likely cause, not
confirmed.

**2026-10-21 (C001-T-065):**

`npm run check` has no coverage step (finding F-5), so coverage was measured with a one-off script
using the method the NFR names (`node --test --experimental-test-coverage`), Node 22.22.3:

1. the test files are transpiled exactly as `scripts/test.mjs` does, plus inline source maps;
2. the two bundles (`plugins/architect/scripts/sdd.mjs`, `build/npm/sdd-mcp.mjs`) are rebuilt with
   inline source maps (input maps of `node_modules` dropped), so the CLI and MCP server processes the
   tests spawn report coverage of `src/` too; `NODE_OPTIONS` carries `--enable-source-maps` and the
   no-network preload;
3. `node --test --experimental-test-coverage --test-reporter=lcov` over all 238 test files;
4. `scripts/build.mjs` restores the shipped bundles afterwards (`git status` clean).

| Scope | Lines | Branches |
|---|---|---|
| `src/` (117 files) | **79.99%** (7,930 / 9,914) | **84.36%** (4,489 / 5,321) |
| `src/` without `src/mcp/` (the CHG-002 MCP server) | 81.42% (7,393 / 9,080) | 84.47% (4,302 / 5,093) |
| `src/` in-process only (no spawned processes) | 77.70% (7,492 / 9,642) | 80.15% (3,730 / 4,654) |
| `tests/unit/` alone, in-process | 32.43% | 76.77% |

By area (all tests with spawned processes; lines % / branches %): model 97.6 / 95.9, trace 91.7 / 87.3,
lint 89.8 / 91.2, cli 83.1 / 76.3, gate 81.3 / 72.9, hooks 79.2 / 84.5, io 77.6 / 75.7, workspace
70.9 / 82.1, mcp 64.4 / 82.0, tracking 48.9 / 62.7, archive 48.0 / 84.7. Lowest files: `lint/types.ts`
15%, `cli.ts` 29%, `hooks/post-write.ts` 30%, `workspace/init.ts` 32%, `workspace/sddmd.ts` 33%,
`mcp/tools/files.ts` 34%, `archive/living.ts` 35%.

Limits of the figure: processes killed by tests (timeouts, fault injection) write no coverage, so
code reached only that way counts as uncovered. The branch threshold is met under every scope; the line threshold is not (F-3).

In the coverage run the timing test TC-705 failed (median 1,011–1,098 ms) because it ran in parallel
with the whole suite under coverage; in the four check runs, where `scripts/test.mjs` runs it alone,
it passed.

## 5. Encoding scan (NFR-404)

**2026-10-22 (C001-T-080): the `encoding` step of `npm run check`** (`scripts/check/encoding.mjs`), in all
four check runs. It scans for a UTF-8 BOM, any CR byte and invalid UTF-8. Scope (a), files written by the
sdd CLI, fails the step: fx-large after `status --write` and `trace --write`, 0 of 622 files; fx-empty after
`init` and `change new`, 0 of 12. Scope (b), this repository's `.sdd/` working tree, is reported only:
1 of 334, the same CRLF file as below. With `SDD_TEST_ENCODING_SEED=1` a seeded CRLF file in scope
(a) makes the step exit 1 (C001-TC-1129, `tests/unit/check/encoding.test.ts`).

**2026-10-21 (C001-T-065):**

A scan for a UTF-8 BOM, any CR byte and invalid UTF-8:

| Folder | Files | Violations |
|---|---|---|
| fx-large `.sdd/` after the CLI wrote `registry.json`, `trace.json` and `85-open-items.md` (Node 20) | 508 | 0 |
| this repository's `.sdd/` (working tree) | 333 | 1 — `.sdd/002-multi-platform-targets/10-spec/20-capabilities/CAP-05-cli-distribution/acceptance.md` has CRLF line endings |

The CRLF file is LF in the index (`git ls-files --eol`: `i/lf w/crlf`), so the committed content is
correct; the working copy was rewritten on 2026-10-20 by an editing tool, not by the sdd CLI. The same
holds for four files outside `.sdd/` (`evals/cap02/TS-211.eval.mjs`, `evals/harness/machines.mjs`,
`evals/harness/questions.mjs`, `tests/integration/cap05/doctor-variants.test.ts`). Writes through the
CLI are additionally covered by `tests/unit/io/atomic.test.ts` ("writeTextAtomic writes UTF-8 without
BOM and with LF line endings").

## 6. Single-file runtime (NFR-501)

`plugins/architect/scripts/sdd.mjs` was copied alone to a scratch folder under
`%LOCALAPPDATA%\Temp` with no `node_modules` in it or any parent. From there, with Node 20.20.2 and
22.22.3: `sdd version` → `architect-plugin@0.0.1` (exit 0); on a generated fx-large workspace
`status --write` (exit 0), `lint` (0 errors, exit 0) and `trace 001 --write` (exit 0). The bundle's
import specifiers (static, dynamic and `require`) are 8, all Node built-ins. The plugin's scripts
folder holds only `sdd.mjs` (`tests/smoke.test.ts`).

## 7. Findings (candidate defects)

| ID | NFR | Finding | Evidence |
|---|---|---|---|
| F-1 (**resolved** by C001-T-080, `5cdae42`) | C001-NFR-403, 401 (also C002-CON-10) | On Node 20.20.2 the Claude Code packages ship `plugins/architect/targets/`. `scripts/package.mjs` excludes it with a `cpSync` filter that compares `relative(src, p)`; Node 20's `fs.cpSync` passes the filter `\\?\`-prefixed long paths on Windows, so the relative path never starts with `targets` and nothing is excluded. Node 22 passes plain paths. Reproduced with a 10-line script: Node 20 copies `targets/x/a.md`, Node 22 does not. | 3 failing tests of §2 |
| F-2 (**resolved** by C001-T-080, `5cdae42`) | C001-NFR-403 | On Node 20.20.2 the cleanup of `tests/integration/mcp/shell.test.ts` "output caps and timeout" fails with `EPERM` on the stub `git.exe` (2 of 2 runs alone): the timed-out process tree is apparently still alive when the result returns. No stub process remained afterwards. The Serena row (TC-685 row 1) shows the same `EPERM` once under load. Needs a decision: wait for the tree to exit before answering `timed_out`, or retry the removal in the test. | §2 |
| F-3 (**resolved** by C001-T-080, `5cdae42`; measured on Node 22.22.3) | C001-NFR-502 | Line coverage of `src/` is 79.99% (81.42% without `src/mcp/`), below the 85% threshold; branches 84.36% meet 75%. | §4 |
| F-4 (**resolved** by C001-T-080, `5cdae42`; campaign of record on Node 20.20.2, §1) | C001-NFR-301 | The fault campaign (`bench/faults.mjs`) and the deterministic fault test (`tests/integration/faults.test.ts`) do not cover `archive`, one of the four commands the NFR's method names; the bench note still says "archive joins with C001-T-053", and T-053 is done. | `bench/faults.mjs` lines 3 and 98 |
| F-5 (**resolved** by C001-T-080, `5cdae42`) | C001-NFR-404, 502 | The methods name `npm run check` ("post-test scan in `npm run check`", coverage "`npm run check`"), but `scripts/check.mjs` has neither an encoding scan nor a coverage step. Both were measured here by one-off scripts. | `scripts/check.mjs` STEPS |
| F-6 (**resolved** by C001-T-080 round 2, b606935: the bench applies the C001-TC-1126 rule and exits non-zero on a failing file; D-015 **resolved** by C001-T-081, a0c86b3 (the T-081 report gives it): a re-run of `sdd archive` after an interrupted run finishes the remaining operations without duplicates, C001-REQ-924, C001-TC-1131; fault campaign rerun 0 failing files, §1) | C001-NFR-301 | A kill of `sdd archive` between its in-place writes (living specs, glossary, `change.md` with `status: archived`) and the move of the change folder leaves a change folder that says `archived` but is not under `_archive/` (1 of 1,000 bench runs; 1 of 400 probe runs). Every file is complete. Re-running `sdd archive` after a failed archive also merges the living entries twice (seen while extending `tests/integration/faults.test.ts`: `C001-REQ-101` twice in `CAP-area-1.md`). Needs a decision: either the bench counts any complete version the command writes, or `archive` gets recovery or idempotent merging. | §1; `bench/results/faults-2026-10-22T09-15-24-050Z.json` |
| F-7 (**resolved** by C001-T-080 round 2, b606935: on Node 20 the coverage step reports skipped with its reason and counts as passed, Q-cov-node20-01) | C001-NFR-401, 502 | On Node 20.20.2 the coverage step cannot produce a figure: Node 20's test runner fails to merge coverage of several processes (`TypeError … reading 'startOffset'`), so `npm run check` exits 1 on Node 20 in both shells, although every test passes. Needs a decision: run the coverage step on Node 22 only (Node 20 reports it as skipped with the reason), or accept the Node 20 failure. | §2, §4 |

Not findings, but open: NFR-503 until C001-T-076; NFR-106, NFR-304 until C001-T-073/T-074; NFR-602
and TS-1102 until C001-T-072; NFR-205 milestone tier before release; macOS/Linux runs of NFR-402 via
the dormant workflow.

Also seen: the workspace lint (`sdd lint`, all changes) reports 9 × LINT-DELTA-001 in CHG-002 (C001
IDs cited before CHG-001 is archived into `_living/`); `sdd lint 001` reports 0 findings.
