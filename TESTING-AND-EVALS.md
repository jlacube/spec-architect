# Testing and evaluation

Architect has two very different halves: a deterministic CLI and probabilistic agents. Each is
verified its own way. Strategy: CHG-001 `20-plan/60-test-plan.md` and ADR-003 (eval tiers),
ADR-006 (test runner), ADR-007 (eval harness).

## 1. Deterministic tests — `npm run check`

- **Runner:** `node:test`, test files in TypeScript transpiled by esbuild (`scripts/test.mjs`),
  identical on Node 20 and 22.
- **Size:** 164 test files, **501 tests**, all passing; typecheck with `tsc` first.
- **Layout:**
  - `tests/unit/` — parser, IDs, graph, atomic IO, paths, ledger, templates, eval-harness helpers.
  - `tests/integration/capNN/TS-*.test.ts` — one file per Gherkin scenario of the spec, named by
    its ID, running the **bundled** CLI as a subprocess against throwaway workspaces.
  - `tests/guards/` — the path-guard corpus (256 cases) and bash-guard corpus (277 cases).
  - `tests/security/` — secret detection (69 + 107 fixtures) and the no-network preload check.
  - determinism, fault injection (`SDD_TEST_FAULT`), smoke and trace tests of this repository's
    own CHG-001.
- **No network:** `tests/no-network.mjs` is preloaded into every Node process of the run; the run
  fails on any attempted connection.

## 2. Corpora and mutation checks

The guard corpora are JSON files of hook inputs with expected decisions, resolved against fixture
repositories that contain real junctions, hard links, file symlinks and 8.3 short names. To make
sure every check matters, each guard branch was disabled in turn ("mutation"): every mutation made
at least one case fail. Two gaps found this way were closed with new cases (a Windows-only `..`
escape through a junction, and the PowerShell no-pipe rule).

## 3. Benchmarks — `npm run bench`

| NFR | What | Threshold | Latest |
|---|---|---|---|
| NFR-103 | guard decision, p95 of 50 | ≤ 300 ms | 132–182 ms |
| NFR-104 | session-start brief on a large workspace, p95 of 10 | ≤ 1 s | 305 ms |
| lint / quick lint | full and single-file lint on `fx-large` | per NFR-10x | recorded in `bench/results/` |

## 4. Agent evaluations — `evals/`

Agents cannot be unit-tested; they are **run**. The harness (`evals/harness/`) uses the Claude
Agent SDK with the desktop app's bundled Claude Code binary:

- A **scenario** (`evals/capNN/TS-*.eval.mjs`) names the main agent, the fixture workspace, the
  prompt, scripted answers to AskUserQuestion, allowed tools, limits and an `assert` function that
  checks **what the agents did** (tool calls, files, lint results) — never free text alone.
- Specialists run as subagents through a small relay agent (`eval-dispatcher`), because only
  subagents get their skills preloaded.
- **Machine configurations** (`cfg-full`, `cfg-no-ripwire`, `cfg-bare`, crashing or old tools…)
  simulate different toolchains through PATH shims.
- Every run writes `evals/results/<label>-<scenario>-<time>.json` with cost, pass/fail and failures;
  transcripts are kept locally (not committed).
- **Tiers:** dev (1 run), milestone (3 runs), release (more), with a per-session budget cap
  ($0.50) and a per-invocation cap (`--max-total-usd`).

85 eval files exist across capabilities CAP-01 … CAP-11 plus the injection suite.

## 5. Cost discipline

Evals run real models and are billed to a prepaid API key. P-01 set budgets along the way (for
example $5 for all of M-5); every task report states its eval spend. Rules learned:

- Run the cheapest scenario first to validate the plumbing before a batch.
- Add an **exposure check** to injection cases: a pass where the agent never saw the planted text
  proves nothing (one such vacuous pass was caught and discarded).
- Fix an eval's own assertion by **regrading** the saved transcript, not by paying for a re-run.
- Milestone-tier repetitions (3 runs) are deferred to release by P-01's decision for M-3, M-4 and
  M-5; dev-tier passes were recorded for each.

Approximate spend on evals: about $27 overall (≈ $12 before the $20 top-up, ≈ $15 since). The
largest single item was the M-5 injection suite ($4.24 for 22 cases).

## 6. Live spot checks

Some behaviours only exist inside Claude Code itself (hook decisions shown to the model, agent
identity, agent memory). Those were checked with very short real sessions on haiku, costing a few
tenths of a cent each — for example the guard denial/allow sequence and the cartographer's memory
save before and after the D-007 fix.
