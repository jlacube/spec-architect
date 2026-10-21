# NFR results — CHG-001 (C001-T-065)

One row per NFR of `.sdd/001-architect-agent-suite/10-spec/30-nfr/nfr.md`, with the measured result,
the threshold, the date and the machine. This is the comparison the observability plan
(`20-plan/78-observability.md`) points to: a miss here becomes a defect.

**Machine (REF-WIN).** Windows 11 Home 10.0.26200, Intel Core i7-10510U (8 logical cores), 16 GB RAM,
SSD; Node 20.20.2 and Node 22.22.3 (nvm-windows installs), npm 10.8.2 / 10.9.8; PowerShell 7.6.6 and
Git Bash 5.2.26; Claude Code 2.1.299 (desktop-bundled, `CLAUDE_CODE_EXECPATH`); git `core.autocrlf=true`.
**Commit measured:** `5eada4a` (working tree clean apart from untracked `bench/results/`).
**Date:** 2026-10-21. No paid sessions were run for this task.

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
| C001-NFR-301 Crash-safe state files | 0 corrupted files over 1,000 fault-injected runs | 0 corrupted over 1,000 runs (744 killed mid-run, 256 completed); `archive` not in the campaign | **pass, with a coverage gap** (finding F-4) | `bench/results/faults-2026-10-21T19-19-30-528Z.json` (Node 20) |
| C001-NFR-302 Deterministic generation | 0 differing bytes outside `generated_at` | 0 (`trace --write`, `status --write`, two runs on fx-large) | **pass** | `tests/integration/determinism.test.ts` (Node 20 and 22) |
| C001-NFR-303 Lint correctness | 100% detection, 0 findings on clean fixtures | 56 of 56 fixture tests pass; `sdd lint 001` on this spec: 0 findings | **pass** | `npm run check` step "lint fixtures"; `tests/unit/lint/fixtures.test.ts` |
| C001-NFR-304 Graceful degradation | 100% of phases on cfg-full, cfg-no-ripwire, cfg-bare | not measured: dogfood runs on three configurations (C001-T-074, todo) | **not measured** | — |
| C001-NFR-401 Windows 11, both shells | `npm run check` passes on PowerShell 7 and Git Bash (+ TS-1102 install) | Node 22.22.3: **pass** on both shells. Node 20.20.2: **fail** on both shells (4 failing tests, finding F-1, F-2). TS-1102 (manual install) not run here | **fail on Node 20** | §2 |
| C001-NFR-402 macOS and Linux readiness | 0 platform-specific constructs outside the marked module | PLG-PORT-002: 0 findings; simulated POSIX path tests pass. Real macOS/Linux runs not measured here | **pass (static)**; OS runs not measured | §3; `.github/workflows/check.yml` (dormant, `workflow_dispatch`) |
| C001-NFR-403 Node 20 and 22 | 100% unit-test pass rate on both | Node 22.22.3: 1,577 of 1,577 run tests pass (1 POSIX-only skip). Node 20.20.2: 1,573–1,572 of 1,577 pass (99.7%) | **fail on Node 20** (F-1, F-2) | §2 |
| C001-NFR-404 Artifact encoding | 0 files violating UTF-8 without BOM, LF | files written by the CLI: 0 of 508 (fx-large after `status --write`, `trace --write`); repository `.sdd/`: 1 of 333 (CRLF in the working tree, not written by the CLI). No post-test scan exists in `npm run check` | **pass for CLI output**; method gap (F-5) | §5 |
| C001-NFR-501 Single-file runtime | 0 runtime imports of unbundled packages | `sdd.mjs` copied alone to a folder with no `node_modules` above it: `version`, `lint`, `status --write`, `trace --write` run on Node 20 and 22; 8 import specifiers, all Node built-ins | **pass** | §6 |
| C001-NFR-502 CLI test coverage | ≥ 85% lines, ≥ 75% branches | 79.99% lines (7,930/9,914), 84.36% branches (4,489/5,321) over `src/`, tests and spawned CLI/MCP processes; without `src/mcp/`: 81.42% lines, 84.47% branches | **fail (lines)** (F-3) | §4 |
| C001-NFR-503 One rule, one module | 0 catalogue codes without module or fixture | PLG-RULES-001: 0 errors, 12 pending (LINT-RISK-001, LINT-ROLL-001, LINT-HAND-001, LINT-HAND-002: no module and no fixture, owned by C001-T-076, todo) | **open until T-076** | §3 |
| C001-NFR-601 Actionable messages | 0 catalogue entries without code, location, fix | PLG-MSG-001: 0 findings | **pass** | §3 |
| C001-NFR-602 Time to first change | ≤ 15 min on a fresh profile | not measured: manual timed run by P-01 (`tests/manual/TS-1102.md`, C001-T-072) | **not measured** | — |
| C001-NFR-701 Per-phase usage record | 0 gate-log rows without a Usage cell | LINT-GATE-001: 0 findings on CHG-001 (`sdd lint 001`: 0 errors); every row has a cell (`unavailable` so far) | **pass** | `.sdd/001-architect-agent-suite/change.md` Gate log |
| C001-NFR-702 CLI diagnostics | 0 subcommands without `SDD_DEBUG` traces | 0 (test enumerates every command) | **pass** | `tests/integration/cli/frontend.test.ts` "SDD_DEBUG=1 writes timing and decision traces…" (Node 20 and 22) |
| C001-NFR-801 License compliance | 0 files or packages outside the allowlist | build licence check passes; SPDX header scan of the fresh tarball: 0 errors | **pass** | `npm run check` steps "build" and "architect-sdd tarball check" |

Verdict counts: 19 pass (one with a coverage gap, one static only), 3 fail or partly fail (NFR-401 and
NFR-403 on Node 20, NFR-502 lines), 1 open until its owner task (NFR-503), 5 not measured here
(NFR-106, 205, 304, 602 and the real-OS part of NFR-402).

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

## 2. `npm run check` under both shells and both Node versions (NFR-401, 403)

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
| F-1 | C001-NFR-403, 401 (also C002-CON-10) | On Node 20.20.2 the Claude Code packages ship `plugins/architect/targets/`. `scripts/package.mjs` excludes it with a `cpSync` filter that compares `relative(src, p)`; Node 20's `fs.cpSync` passes the filter `\\?\`-prefixed long paths on Windows, so the relative path never starts with `targets` and nothing is excluded. Node 22 passes plain paths. Reproduced with a 10-line script: Node 20 copies `targets/x/a.md`, Node 22 does not. | 3 failing tests of §2 |
| F-2 | C001-NFR-403 | On Node 20.20.2 the cleanup of `tests/integration/mcp/shell.test.ts` "output caps and timeout" fails with `EPERM` on the stub `git.exe` (2 of 2 runs alone): the timed-out process tree is apparently still alive when the result returns. No stub process remained afterwards. The Serena row (TC-685 row 1) shows the same `EPERM` once under load. Needs a decision: wait for the tree to exit before answering `timed_out`, or retry the removal in the test. | §2 |
| F-3 | C001-NFR-502 | Line coverage of `src/` is 79.99% (81.42% without `src/mcp/`), below the 85% threshold; branches 84.36% meet 75%. | §4 |
| F-4 | C001-NFR-301 | The fault campaign (`bench/faults.mjs`) and the deterministic fault test (`tests/integration/faults.test.ts`) do not cover `archive`, one of the four commands the NFR's method names; the bench note still says "archive joins with C001-T-053", and T-053 is done. | `bench/faults.mjs` lines 3 and 98 |
| F-5 | C001-NFR-404, 502 | The methods name `npm run check` ("post-test scan in `npm run check`", coverage "`npm run check`"), but `scripts/check.mjs` has neither an encoding scan nor a coverage step. Both were measured here by one-off scripts. | `scripts/check.mjs` STEPS |

Not findings, but open: NFR-503 until C001-T-076; NFR-106, NFR-304 until C001-T-073/T-074; NFR-602
and TS-1102 until C001-T-072; NFR-205 milestone tier before release; macOS/Linux runs of NFR-402 via
the dormant workflow.

Also seen: the workspace lint (`sdd lint`, all changes) reports 9 × LINT-DELTA-001 in CHG-002 (C001
IDs cited before CHG-001 is archived into `_living/`); `sdd lint 001` reports 0 findings.
