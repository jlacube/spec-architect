---
id: C001-IF-14
artifact: spec/interface
kind: external
change: CHG-001
phase: 10-spec
status: approved
---

# C001-IF-14 — External tools used by Architect agents

Versions current at 2026-10-10 research; pinned versions are recorded per machine in
`toolchain.md` (C001-REQ-115).

## §1 Tools

| Tool | Kind | Used by | Operations used | Not used (forbidden) | License | Source |
|---|---|---|---|---|---|---|
| ripwire (redhat-et) 0.6.x (verified 0.6.5, spike S-01) | CLI | cartographer | `--for`, `--pack-task`, `--callers`, `--uses`, `--impact`, `--expand`, `--test-gate`, `--situ`, `--hotspots`, `--quality-panel`, `--quality-delta`, `--pack-signatures`, `--doctor`, `--help-task`, `--version`; bounding options per §2 (`--token-budget`, `--max-tokens`, `--limit`, `--offset`) | `--mcp`, span-edit verbs, `--merge-scout`, `--pr-context` | Apache-2.0 | github.com/redhat-et/ripwire |
| Serena (oraios) | MCP (stdio) | cartographer, architect | `find_symbol`, `get_symbols_overview`, `find_referencing_symbols`, `search_for_pattern`, `list_dir`, `find_file` | all editing, shell and memory tools | MIT | github.com/oraios/serena |
| Archify (tt-a1i) | Skill + Node CLI | architect | `doctor`, `guide`, `validate <type> <file>`, `deliver <type> <src> <out>`, `compare architecture <base> <head> <out>` | `preview` (starts a local server; not needed headless) | to be confirmed in S-03 (must be permissive, C001-CON-05) | github.com/tt-a1i/archify |
| ast-grep | CLI | cartographer | `ast-grep run --pattern … [--lang] [--json]` | `--rewrite`, `-U`, `--update-all`, interactive mode | MIT | github.com/ast-grep/ast-grep |
| Context7 (Upstash) | MCP (remote HTTP) | researcher | `resolve-library-id`, documentation query (`query-docs` / `get-library-docs`) | — | MIT (server) | github.com/upstash/context7 |
| DeepWiki (Cognition) | MCP (remote HTTP, no auth) | researcher | `read_wiki_structure`, `read_wiki_contents`, `ask_question` (public repositories only) | private-repository use | service terms | docs.devin.ai (DeepWiki MCP) |
| git | CLI | cartographer, sdd CLI (`HEAD` SHA for evidence) | read-only subcommands (C001-IF-07 §3) | any mutating subcommand | GPL-2.0 (invoked, not linked) | git-scm.com |

## §2 ripwire bounding flags, exit codes and disclosures

Verified on Windows 11 with ripwire 0.6.5 (`docs/spikes/S-01-ripwire.md`). Every verb takes
the repository directory as its first argument (`ripwire <dir> <verb> …`).

| Verb family | Verbs | Bounding flag (C001-REQ-1003) | Over-budget behaviour |
|---|---|---|---|
| Task lenses | `--for`, `--pack-task` | `--token-budget=N` | output trimmed to fit |
| Ranked map | default map (no verb), `--pack-signatures` | `--max-tokens=N` | map shaped to fit; `--pack-signatures` may exceed N (signature block not shaped) |
| Graph and list verbs | `--callers`, `--uses`, `--impact`, `--expand`, `--test-gate`, `--situ`, `--hotspots`, `--quality-panel`, `--quality-delta` | `--limit=N` (page with `--offset=N`) | rows capped; header `capped="1" has_more="1" next_offset=` |

`--token-budget` combined with a graph or list verb, and `--top-k` with any verb above, make
ripwire exit 1 without output. `--token-budget` on the ranked map withholds the whole map
(exit 3) instead of shaping it.

| Exit code | Meaning | Cartographer treatment (C001-REQ-1010) |
|---|---|---|
| 0 | answer | use |
| 4 | `--test-gate` only: answer that names tests to run or an untested blast radius | use (documented answer, not a failure) |
| 3 | output withheld over budget | failure |
| 1, 2, other | flag refused, usage error or crash | failure |

| Header attribute | Disclosure (C001-REQ-1004) |
|---|---|
| `unindexed="ext:N,…"` (map, `--pack-signatures`) | `unindexed: <ext> (<N> files)` per entry |
| `graph_unindexed="N"` (graph verbs) | `unindexed: <N> files` |
| `capped="1"` / `has_more="1"` | `truncated: <shown> of <total>` |
| `graph_unresolved="N"`, `counts_floor="1"` | `counts are lower bounds (<N> unresolved edges)` |
| `confidence="low"` (`--for`) | `low retrieval confidence` |

Availability is probed with `ripwire --version` (immediate). `ripwire <dir> --doctor` takes
about 10 s and fails its `binary-path` check when ripwire is not on PATH.

## §3 Archify conventions

Archify IR conventions for Architect: node IDs = COMP IDs; groups = deployment units or
trust boundaries; `meta.animation = "static"` for reproducible output; evidence nodes pinned
to the `HEAD` commit recorded in `toolchain.md` at generation time.
