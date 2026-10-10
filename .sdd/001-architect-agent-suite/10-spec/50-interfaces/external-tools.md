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

| Tool | Kind | Used by | Operations used | Not used (forbidden) | License | Source |
|---|---|---|---|---|---|---|
| ripwire (redhat-et) 0.6.x | CLI | cartographer | `--for`, `--pack-task`, `--callers`, `--uses`, `--impact`, `--expand`, `--test-gate`, `--situ`, `--hotspots`, `--quality-panel`, `--quality-delta`, `--pack-signatures`, `--doctor`, `--help-task`; options `--token-budget`, `--top-k` | `--mcp`, span-edit verbs, `--merge-scout`, `--pr-context` | Apache-2.0 | github.com/redhat-et/ripwire |
| Serena (oraios) | MCP (stdio) | cartographer, architect | `find_symbol`, `get_symbols_overview`, `find_referencing_symbols`, `search_for_pattern`, `list_dir`, `find_file` | all editing, shell and memory tools | MIT | github.com/oraios/serena |
| Archify (tt-a1i) | Skill + Node CLI | architect | `doctor`, `guide`, `validate <type> <file>`, `deliver <type> <src> <out>`, `compare architecture <base> <head> <out>` | `preview` (starts a local server; not needed headless) | to be confirmed in S-03 (must be permissive, C001-CON-05) | github.com/tt-a1i/archify |
| ast-grep | CLI | cartographer | `ast-grep run --pattern … [--lang] [--json]` | `--rewrite`, `-U`, `--update-all`, interactive mode | MIT | github.com/ast-grep/ast-grep |
| Context7 (Upstash) | MCP (remote HTTP) | researcher | `resolve-library-id`, documentation query (`query-docs` / `get-library-docs`) | — | MIT (server) | github.com/upstash/context7 |
| DeepWiki (Cognition) | MCP (remote HTTP, no auth) | researcher | `read_wiki_structure`, `read_wiki_contents`, `ask_question` (public repositories only) | private-repository use | service terms | docs.devin.ai (DeepWiki MCP) |
| git | CLI | cartographer, sdd CLI (`HEAD` SHA for evidence) | read-only subcommands (C001-IF-07 §3) | any mutating subcommand | GPL-2.0 (invoked, not linked) | git-scm.com |

Archify IR conventions for Architect: node IDs = COMP IDs; groups = deployment units or
trust boundaries; `meta.animation = "static"` for reproducible output; evidence nodes pinned
to the `HEAD` commit recorded in `toolchain.md` at generation time.
