---
id: C001-SPIKE-S-01
task: C001-T-002
change: CHG-001
spike: S-01
title: "ripwire on Windows"
date: 2026-10-10
verdict: works-with-caveats
risk_refs: [C001-RISK-003]
spec_refs: [C001-REQ-1001, C001-REQ-1003, C001-REQ-1004, C001-IF-14]
---

# S-01 — ripwire on Windows

## Verdict

**works-with-caveats.** ripwire 0.6.5 runs natively on Windows 11. Every verb the cartographer
needs answers correctly on a TypeScript and a Python repository. Callers were exact for
10/10 checked symbols, with no false positives.

The caveat contradicts the approved spec. On every graph and list verb (`--callers`,
`--impact`, `--test-gate`, `--hotspots`, …), ripwire **refuses** both `--token-budget` and
`--top-k` (exit 1, empty stdout) and requires `--limit=N` instead. On the default map and
`--pack-signatures`, `--token-budget` is a hard gate: it withholds the whole output when the
output is over budget (exit 3). C001-REQ-1003, C001-AC-1003.1 / C001-TS-1004 and the
options column of C001-IF-14 prescribe exactly those two flags for "any ripwire query verb".
Spec defect **D-S01-1** has been raised against C001-REQ-1003 (see below). C001-REQ-1001
(layer ladder) is not affected, because no verb is unusable.

## Method

| Item | Value |
|---|---|
| Machine | REF-WIN: Windows 11 Home 10.0.26200, Git Bash; Node 22.13.0 |
| ripwire | 0.6.5 (`ripwire-0.6.5-windows-x64.zip`, GitHub release of 2026-09-27; SHA-256 `1492f352…bc389f` matches the published `.sha256`); `--version`: Release, Clang 20.1.8, built_from=3fcd515ff |
| License | Apache-2.0 (LICENSE in the archive), as listed in C001-IF-14 (C001-CON-05 satisfied) |
| Install | Archive extracted to `%USERPROFILE%\.local\ripwire\`; binary invoked by absolute path, not on PATH (see `--doctor` below) |
| TypeScript repo | `bolt.diy` @ `41bb909` — 168 tracked `.ts/.tsx` files, 1,173 commits |
| Python repo | `crawl4ai` @ `dde14eb` — 104 tracked `.py` files, 593 commits |
| Ground truth | `git grep` for call sites, then the enclosing function read by hand |
| Budget | `--token-budget=4000` first (C001-REQ-1003 default), then the flag ripwire accepts for each verb |
| Timing | Wall clock of one process per invocation (`date +%s%N`), index cache warm unless stated |

Neither repository was modified: `git status --porcelain --ignored` was identical before and
after. ripwire keeps its index outside the repository, in `%TEMP%\ripwire\` (6.6 MB after all
runs).

The release archive also ships `hooks/*.sh` and `skills/` for Claude Code/Codex integration.
They were treated as data and **not** installed. C001-CON-07 (CLI only) is unaffected.

## `--doctor`

| Repo | Checks passed | Exit | Time | Note |
|---|---|---|---|---|
| bolt.diy | 8/9 | 1 | 13.5 s (first run) | only `binary-path` fails: "no ripwire resolves from PATH" |
| crawl4ai | 8/9 | 1 | 10.0 s | same |
| crawl4ai, binary dir prepended to PATH | 9/9 | 0 | 10.3 s | all checks pass: 25/25 grammars, git, cache dir, index cache, layout |

`--doctor` takes about 10 s. The availability probe of C001-REQ-1001 should use
`ripwire --version` (instant), not `--doctor`.

## Results per verb and repository

Exit codes: 0 = ok; 1 = flag refused; 3 = output withheld (over `--token-budget`);
4 = `--test-gate` found tests to run or an untested blast radius, which is its documented
gate signal, not an error. Size = stdout bytes; *est* = ripwire's own `est_tokens`.

### With the spec's flags (`--token-budget=4000`, `--top-k=20`)

| Verb | Repo | Exit | Time | Result |
|---|---|---|---|---|
| default map | bolt.diy | 3 | 1.4 s cold / 1.2 s warm | withheld whole: `withheld_est_tokens=7298 > budget=4000` |
| default map | crawl4ai | 3 | 1.3 s / 1.2 s | withheld whole: 9509 > 4000 |
| `--for` | bolt.diy | 0 | 4.0 s | ok, est 3429 ≤ 4000 (trimmed to fit) |
| `--for` | crawl4ai | 0 | 4.2 s | ok, est 3381 ≤ 4000 |
| `--callers` (×5 symbols) | both | 1 | 0.2 s | refused: "--token-budget is honored by the default map, --for, --pack-task, …; narrow it with --limit=N instead" |
| `--callers` + `--top-k=20` | both | 1 | 0.2 s | refused: "--top-k narrows only --graph-query within the --limit/--offset-honoring set" |
| `--impact` | both | 1 | 0.2 s | refused (same message) |
| `--test-gate=<file>` | both | 1 | 0.2 s | refused (same message) |
| `--hotspots` | both | 1 | 0.2 s | refused (same message) |
| `--pack-signatures` | bolt.diy | 3 | 1.2 s | withheld whole: 9475 > 4000 |
| `--pack-signatures` | crawl4ai | 3 | 1.2 s | withheld whole: 12401 > 4000 |

### With the flags ripwire accepts

| Verb | Repo | Flags | Exit | Time | Size | Correctness |
|---|---|---|---|---|---|---|
| default map | bolt.diy | `--max-tokens=4000` | 0 | 1.2 s | 7.5 kB, est 2976 | ranked map; fits budget |
| default map | crawl4ai | `--max-tokens=4000` | 0 | 1.1 s | 7.3 kB, est 2984 | ranked map; fits budget |
| `--for` | bolt.diy | `--token-budget=4000` | 0 | 4.0 s | 8.6 kB | relevant: top hits `useChatHistory`, `ChatHistoryItem`, `HistoryItem`, `navigateChat` for "rename-chat in chat history persistence"; header `confidence="low"` |
| `--for` | crawl4ai | `--token-budget=4000` | 0 | 4.2 s | 8.5 kB | partly relevant: `AsyncDatabaseManager`, `aalter_db_add_column`, `alter_db_add_screenshot`, `aclear_cache`; rank 1 is `RobotsParser` (off-topic); `cache_url`/`get_cached_url` not in top 8; `confidence="low"` |
| `--callers` | bolt.diy | `--limit=50` | 0 | 0.8–0.9 s | ~1 kB | 5/5 exact (table below) |
| `--callers` | crawl4ai | `--limit=50` | 0 | 0.8 s | ~1 kB | 5/5 exact (table below) |
| `--impact=getMessages` | bolt.diy | `--limit=50` | 0 | 0.8 s | 2.9 kB | 16 reached, 3 importers; includes all 5 direct callers |
| `--impact=parse_srcset` | crawl4ai | `--limit=50` | 0 | 0.8 s | 6.1 kB | 230 reached, shown 50, `capped="1" has_more="1"`; includes both direct callers |
| `--test-gate=app/lib/persistence/db.ts` | bolt.diy | `--limit=50` | 4 | 2.0 s | 3.4 kB | 0 tests, 17 untested impacted symbols; consistent with the repo (no tests reach `db.ts`) |
| `--test-gate=crawl4ai/database.py` | crawl4ai | `--limit=50` | 4 | 1.8 s | 8.7 kB | 22 tests, 92 untested (50 shown, capped); next = `python3 tests/test_web_crawler.py` |
| `--hotspots` | bolt.diy | `--limit=20` | 0 | 2.8 s | 3.2 kB | top `workbench.ts`, `BaseChat.tsx`, `DebugTab.tsx`, `stream-text.ts`; 3 of git's top-5 churn files are in ripwire's top 4 |
| `--hotspots` | crawl4ai | `--limit=20` | 0 | 3.0 s | 3.2 kB | top `utils.py`, `async_crawler_strategy.py`, `content_scraping_strategy.py`; matches git's top churn files |
| `--pack-signatures` | bolt.diy | `--max-tokens=4000` | 0 | 1.2 s | 13.0 kB, **est 5535** | signatures ok; **overshoots** 4000 (max-tokens shapes the map, not the signature block) |
| `--pack-signatures` | crawl4ai | `--max-tokens=4000` | 0 | 1.2 s | 14.5 kB | same behaviour |
| `--pack-signatures` | both | none | 0 | 1.1–1.2 s | 24–30 kB | unbudgeted |

### Callers correctness (5 symbols per repository)

Each expected caller is a function that contains a call site found by `git grep`.

| Repo | Symbol | Call sites (grep) | Expected callers | ripwire callers | Match |
|---|---|---|---|---|---|
| bolt.diy | `streamText` | 4 | `chatAction` (×2), `enhancerAction`, `llmCallAction` | same 3 | exact |
| bolt.diy | `getMessages` | 6 | `useChatHistory` (×2), `useEditChatDescription`, `forkChat`, `duplicateChat`, `updateChatDescription` | same 5 | exact |
| bolt.diy | `forkChat` | 1 | `handleFork` | `handleFork` | exact |
| bolt.diy | `getOpenAILikeModel` | 2 | `getModelInstance` in `openai-like.ts`, `together.ts` | same 2 | exact |
| bolt.diy | `simplifyBoltActions` | 1 | `streamText` | `streamText` | exact |
| crawl4ai | `parse_srcset` | 4 | `process_image` ×2 (two classes, lines 268 and 1007) | same 2 | exact |
| crawl4ai | `html2text` (control: no callers) | 0 | none | none (`count="0"`) | exact |
| crawl4ai | `escape_md` | 7 | `link_url`, `handle_tag` | same 2 | exact |
| crawl4ai | `get_cached_url` | 1 | `run` (`web_crawler.py`) | `run`, `tested="1"` | exact |
| crawl4ai | `element_style` | 1 | `handle_tag` | `handle_tag` | exact |

## Header disclosures (input to C001-REQ-1004)

| Disclosure | Where it appears | Form |
|---|---|---|
| Unindexed languages | default map, `--pack-signatures` | `unindexed="svg:38,scss:14,…"` (ext:count, at most 6 extensions): matches the C001-TS-1005 example form |
| Unindexed (graph verbs) | `--callers`, `--impact`, `--test-gate` | `graph_unindexed="55"`: a count only, **no per-language breakdown** |
| Unresolved / ambiguous edges | graph verbs | `graph_unresolved="55" graph_ambiguous="11"`; `counts_floor="1"` (counts are lower bounds) |
| Truncation | list verbs | `capped="1" has_more="1" total= shown= next_offset=` |
| Withheld for budget | map, `--pack-signatures` with `--token-budget` | `withheld="1" withheld_est_tokens= budget=`, exit 3 |
| Retrieval confidence | `--for` | `confidence="low" margin_pct= coverage=` |
| Parse health | not observed in any output on these two repos | — |

The cartographer's disclosure mapping (T-041) must also handle the count-only
`graph_unindexed` form and `capped`/`has_more`. That is compatible with C001-REQ-1004 as
written, so no defect is needed.

## Spec defect raised

| ID | Ref | Summary |
|---|---|---|
| D-S01-1 | C001-REQ-1003 (also C001-AC-1003.1, C001-TS-1004, C001-IF-14 options column) | ripwire 0.6.5 rejects `--token-budget` and `--top-k` (exit 1, no output) on `--callers`, `--callees`, `--uses`, `--impact`, `--test-gate`, `--hotspots`, `--situ` and the rest of its "--limit/--offset-honoring set". These verbs must be bounded with `--limit=N`. On the default map and `--pack-signatures`, `--token-budget` withholds the whole output when it is over budget (exit 3), and `--max-tokens=N` is the flag that shapes the output to fit. Proposed revision: per verb family, `--token-budget=N` for `--for`/`--pack-task`, `--max-tokens=N` for map/`--pack-signatures`, `--limit=N` for graph/list verbs; AC-1003.1 to accept any of the three; add `--limit` and `--max-tokens` to C001-IF-14. |

Recorded in the "Defects (manual)" table of `20-plan/handoff.md` (`sdd defect add` does not
exist yet; it arrives with T-026).

**Resolution (2026-10-10):** fixed by the spec revision re-approved at G2 (commit `baa1a3e`):
C001-REQ-1003 / AC-1003.1 / TS-1004 now name a bounding flag per verb family, C001-IF-14 §2
records the flags, exit codes and disclosure mapping above, C001-REQ-1010 and new
C001-TS-1014 treat `--test-gate` exit 4 as an answer, the C001-IF-07 §3 allowlist accepts
`--max-tokens`/`--limit`/`--offset`, and the doctor detects ripwire with `--version`. The plan
followed at G3 (commit `ccda4b3`).

## Notes for the cartographer (T-041) and the code-discovery skill

1. Treat exit 4 from `--test-gate` as a successful answer, and exit 3 as "over budget; retry
   with a smaller scope". Only exit 1 or 2 are errors.
2. `--pack-signatures --max-tokens=4000` overshoots (est 5535). Pair it with a path scope or
   prefer `--for --signatures-only` when the budget matters.
3. `--for` reports `confidence="low"` on vague task text, and its crawl4ai ranking was mixed.
   Cross-check the top `--for` results with `--callers`/`--uses`, or fall back to Serena or
   grep for precise questions.
4. Each run takes about 0.8–4 s with a warm cache. A cold index of a repository this size
   costs about 0.2 s extra.
5. Probe availability with `ripwire --version`, not `--doctor` (10 s).

## Toolchain recommendation for the README

- ripwire stays **optional** (RISK-003 mitigation unchanged). It is recommended on Windows
  x64: install the `windows-x64.zip` release from github.com/redhat-et/ripwire, verify the
  `.sha256`, and **add the extracted folder to the user PATH**. Without PATH, `--doctor`
  fails its `binary-path` check, and the cartographer's `ripwire` invocations won't resolve.
- Minimum version: 0.6.5. The budget flags documented above are version-specific, so pin
  "0.6.x, verified with 0.6.5".
- Do not install the bundled `hooks/` or `skills/`. The Architect plugin calls the CLI
  directly (C001-CON-07).

## Test cases in `verified_by`

C001-TC-1001 and C001-TC-1004 are **eval** test cases of the cartographer
(`evals/cap10/TS-1001.eval.mjs`, `TS-1004.eval.mjs`). The test plan assigns them to
C001-T-041, and they need the cartographer agent and the eval harness (T-029), which do not
exist yet. This spike supplies their evidence inputs: ripwire answers `--callers=SYM`
correctly, and TC-1004's assertion has to change once D-S01-1 is resolved. As written, it
would fail against ripwire 0.6.5 for every verb except `--for`.
