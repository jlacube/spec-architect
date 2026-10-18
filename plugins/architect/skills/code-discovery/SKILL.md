---
name: code-discovery
description: How the cartographer answers code questions with evidence — the layer ladder (ripwire, Serena, LSP, grep/glob, ast-grep for structure), ripwire verbs with their bounding flags, budgets and exit codes, header disclosures, fallback on failure, the evidence entry format, and the files it writes (baseline survey, living-spec inventory stubs, toolchain record, blast radius, regression set). Use for every codebase question of an SDD change.
---

# Code discovery

Every claim about the code is an **evidence entry** from a named layer. Use the first layer, in
ladder order, that is available and supports the question; when a layer fails, retry on the next
one and disclose the failure.

## Layer ladder

| Question type | ripwire (1) | Serena (2) | LSP (3) | grep / glob (4) |
|---|---|---|---|---|
| Who calls / uses X | `--callers=X`, `--uses=X` | find referencing symbols | find references | grep the symbol name |
| What breaks if X changes (reach) | `--impact=X` | references, transitively | references | grep, by hand |
| Which tests reach X | `--test-gate=<file>` | references from test files | — | grep test folders |
| Where is X defined / its shape | `--expand=X`, `--situ` | find symbol, find declaration | go to definition | grep `function X\|class X` |
| Overview, main modules, hotspots | default map, `--pack-signatures`, `--hotspots` | symbols overview per file | — | glob + line counts |
| Code matching a syntactic shape | — | — | — | **ast-grep** when `toolchain.md` records it detected: `ast-grep run --pattern '<p>' --lang <l> <paths>` (search only); otherwise grep |

Availability: ripwire when `ripwire --version` answers; Serena when its tools load (they are
deferred: load them first; while it is "still connecting", wait a few seconds and retry once, then
treat it as unavailable); grep/glob always.

Procedure for each question, in this order — never skip a step because a later layer looks
easier:

1. ripwire available → ask ripwire. Answer → done.
2. Otherwise (absent or failed) → **load the Serena tools** and ask Serena. Answer → done.
3. Otherwise (Serena does not load or fails) → LSP, if it answers for the language.
4. Otherwise → grep / glob, reading the matches to confirm them.

Name the layer you used, and the layers you skipped with the reason (absent, failed), in your
digest.

## ripwire

Every verb takes the repository first: `ripwire <repo> <verb> …`. One bounding flag per verb
family, never more than the budget:

| Verb family | Verbs | Flag | Budget |
|---|---|---|---|
| Task lenses | `--for=`, `--pack-task=` | `--token-budget=N` | ≤ 4000 |
| Ranked map | default map (no verb), `--pack-signatures` | `--max-tokens=N` | ≤ 4000 |
| Graph and list | `--callers=`, `--uses=`, `--impact=`, `--expand=`, `--test-gate`, `--situ`, `--hotspots`, `--quality-panel`, `--quality-delta` | `--limit=N` (page with `--offset=N`) | ≤ 50 |

- Never combine `--token-budget` or `--top-k` with a graph or list verb, and never pass `--top-k`
  at all (ripwire exits 1). Never put `--token-budget` on the ranked map (it withholds the map).
- **Exit codes:** 0 = answer. 4 = **answer** for `--test-gate` (tests to run or an untested blast
  radius): use it, it is not a failure. 3 (withheld over budget), 1, 2 or anything else = failure.
- **Header attributes → disclosures** (copy into every entry derived from that output):

| Header | Disclosure |
|---|---|
| `unindexed="ext:N,…"` | `unindexed: <ext> (<N> files)` per extension |
| `graph_unindexed="N"` | `unindexed: <N> files` |
| `capped="1"` / `has_more="1"` | `truncated: <shown> of <total>` |
| `graph_unresolved="N"`, `counts_floor="1"` | `counts are lower bounds (<N> unresolved edges)` |
| `confidence="low"` | `low retrieval confidence` |

## Failure and fallback

A layer fails on a non-zero exit that is not a documented answer, a timeout of 120 s, or a tool
error. Then ask the same question on the next layer and add to each resulting entry's
disclosures: `ripwire failed: exit <code>` (or `serena failed: <error>`, `ripwire timed out`).

## Evidence entry

```markdown
- **E-<n>** `src/checkout/payments.ts:118` › `createIntent()` — <claim>
  - layer: ripwire | serena | lsp | grep | ast-grep · confidence: high | medium | low
  - commit: <HEAD sha> · pattern: <ast-grep pattern, if any>
  - disclosures: <text or "none">
```

- Lines are 1-based. Serena reports 0-based lines: add 1.
- Symbol `-` for a file-level claim. One claim per entry. Confidence: high for ripwire/Serena/LSP
  resolved references, medium for grep matches checked by reading, low for inference.
- Get the commit with `git rev-parse HEAD`.

## Files you write

- **No source files** outside `.sdd/`: reply "no code evidence applicable" and write no evidence
  file.
- **Baseline survey** (`00-ideation/evidence/baseline-survey.md`, brownfield and mixed changes):
  languages and size; test layout and build commands; affected areas (path, symbol, layer); a
  blast-radius preview of the main symbols (callers, reach); touched hotspots; evidence entries.
- **Living-spec inventory stubs** (`/architect:init` on a repository with code and an empty
  `_living/`): one `_living/CAP-<slug>.md` per detected capability (usually a top-level source
  module), frontmatter `inventory_only: true`, sections Purpose, Entry points, Main modules, Owning
  tests, Evidence (each entry with path, symbol where applicable, and layer). No requirements.
- **Toolchain record** (`_constitution/toolchain.md`, init and doctor): a table with one row per
  node, git, Claude Code, ripwire, Serena, ast-grep, Context7, DeepWiki — detected (yes/no),
  version, path or endpoint, fallback in use (for ripwire absent: `serena → lsp → grep`, or the
  next layer that is available). Probe with `--version`; Context7 and DeepWiki are detected when
  their tools load.
- **Impact** (plan phase, brownfield and mixed): `20-plan/30-impact/blast-radius.md` — per targeted
  symbol: direct callers, transitive reach count, layer; `20-plan/30-impact/regression-set.md` —
  the existing tests that reach the targeted symbols (ripwire `--test-gate` when available), each
  with its layer; `20-plan/30-impact/hotspots.md` when asked.

## Return

Digest of at most **20 lines** (findings, layers used, failures and disclosures worth knowing),
the paths written, and a `questions` block only for what P-01 alone can decide.

## Claude Code wiring

- Serena tools: `mcp__plugin_architect_serena__find_symbol`, `…__get_symbols_overview`,
  `…__find_referencing_symbols`, `…__find_declaration`, `…__find_implementations`; load them with
  `ToolSearch` (`select:<name>`) before the first call. LSP: the `LSP` tool.
- Bash is limited to the allowlist: `ripwire` read verbs, `ast-grep run --pattern` (no rewrite),
  read-only `git`, `sdd`, version probes; one command per call, no `&&`, `;` or redirection.
  Run `git` from the working folder with the read verb first (`git log …`): `git -C <dir>`,
  `--git-dir` and `--work-tree` are denied.
