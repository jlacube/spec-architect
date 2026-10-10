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

Tools of the plugin's MCP servers reach agents as `mcp__plugin_architect_<server>__<tool>` and are
deferred (loaded through `ToolSearch`), as verified in spike S-06.

| Tool | Kind | Used by | Operations used | Not used (forbidden) | License | Source |
|---|---|---|---|---|---|---|
| ripwire (redhat-et) 0.6.x (verified 0.6.5, spike S-01) | CLI | cartographer | `--for`, `--pack-task`, `--callers`, `--uses`, `--impact`, `--expand`, `--test-gate`, `--situ`, `--hotspots`, `--quality-panel`, `--quality-delta`, `--pack-signatures`, `--doctor`, `--help-task`, `--version`; bounding options per §2 (`--token-budget`, `--max-tokens`, `--limit`, `--offset`) | `--mcp`, span-edit verbs, `--merge-scout`, `--pr-context` | Apache-2.0 | github.com/redhat-et/ripwire |
| Serena (oraios) 1.7.x (verified 1.7.0, spike S-02) | MCP (stdio), launched per §4 | cartographer, architect | `find_symbol`, `get_symbols_overview`, `find_referencing_symbols`, `find_declaration`, `find_implementations` | all editing, shell, memory and onboarding tools (excluded by the §4 launch) | MIT | github.com/oraios/serena |
| Archify (tt-a1i) | Skill + Node CLI | none in v1: deferred to a later change (§3) | — | all | MIT (code; bundled brand marks have mixed licenses) | github.com/tt-a1i/archify |
| ast-grep | CLI | cartographer | `ast-grep run --pattern … [--lang] [--json]` | `--rewrite`, `-U`, `--update-all`, interactive mode | MIT | github.com/ast-grep/ast-grep |
| Context7 (Upstash) | MCP (remote HTTP) | researcher | `resolve-library-id`, `query-docs` (verified, spike S-06) | — | MIT (server) | github.com/upstash/context7 |
| DeepWiki (Cognition) | MCP (remote HTTP, no auth) | researcher | `read_wiki_structure`, `read_wiki_contents`, `ask_wiki_question` (public repositories only; verified, spike S-06) | private-repository use | service terms | docs.devin.ai (DeepWiki MCP) |
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

## §3 Archify (deferred)

Archify is not used in this change. Spike S-03 found that Archify 3.0.1 produces no output on
Windows 11 (upstream issue #474), so architecture diagrams are Mermaid only (C001-REQ-507). The IR
rules observed in the spike (`meta.animation` ∈ {`trace`, `none`}, required `meta.output` and
component `pos`, evidence through `meta.repository` plus component `sources` with `--repo-root`,
groups as `boundaries`, no `brand`/`icon`) are recorded in `docs/spikes/S-03-archify.md` for the
later change.

## §4 Serena launch and data location

Verified in spikes S-02 and S-06 (Serena 1.7.0, Claude Code 2.1.295). Plugin `.mcp.json` entry:

```json
"serena": {
  "command": "serena",
  "args": ["start-mcp-server", "--context", "claude-code", "--mode", "planning",
           "--mode", "${CLAUDE_PLUGIN_ROOT}/serena/architect-read-only.yml",
           "--project-from-cwd", "--enable-web-dashboard", "False", "--open-web-dashboard", "False"],
  "env": { "SERENA_HOME": "${CLAUDE_PLUGIN_DATA}/serena" }
}
```

- `serena/architect-read-only.yml` is a Serena mode file shipped in the plugin. Its `excluded_tools`
  list every tool that changes files or memories or runs commands: `create_text_file`,
  `replace_symbol_body`, `insert_after_symbol`, `insert_before_symbol`, `delete_lines`, `replace_lines`,
  `insert_at_line`, `replace_content`, `replace_in_files`, `rename_symbol`, `safe_delete_symbol`,
  `execute_shell_command`, `write_memory`, `edit_memory`, `delete_memory`, `rename_memory`,
  `read_memory`, `list_memories`, `onboarding`.
- Tools exposed with this launch: `find_symbol`, `get_symbols_overview`, `find_referencing_symbols`,
  `find_declaration`, `find_implementations`, `get_diagnostics_for_file`, `initial_instructions`.
- `${CLAUDE_PLUGIN_DATA}` is the plugin's per-user data folder (`~/.claude/plugins/data/<plugin>-<marketplace>`).
  Serena keeps project data inside the repository (`<repo>/.serena/`) unless
  `${CLAUDE_PLUGIN_DATA}/serena/serena_config.yml` already sets `project_serena_folder_location`
  elsewhere when Serena first starts; the doctor writes that file (C001-REQ-1013), pointing it to
  `${CLAUDE_PLUGIN_DATA}/serena/projects/$projectFolderName/.serena`, with `web_dashboard: False`.
- Serena answers with 0-based `start_line`/`end_line`; evidence entries (C001-IF-03 §11) are 1-based.
- Serena connects a few seconds after session start; until then `ToolSearch` reports it as still
  connecting, and C001-REQ-1010 applies.
- Serena fetches language servers on first use: TypeScript through npm (Node on PATH), Pyright
  through `uvx` (uv on PATH).
