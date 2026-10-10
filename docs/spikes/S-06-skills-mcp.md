---
id: C001-SPIKE-S-06
task: C001-T-007
change: CHG-001
spike: S-06
title: "Preloaded skill cost and MCP tool names"
date: 2026-10-10
verdict: works-with-caveats
risk_refs: []
spec_refs: [C001-NFR-105, C001-IF-09, C001-REQ-1007, C001-REQ-1008, C001-REQ-1108, C001-REQ-1109, C001-REQ-1006]
---

# S-06 — Preloaded skill cost and MCP tool names

## Verdict

**works-with-caveats.** Skill preloading works for plugin agents, with either short or
plugin-qualified skill names. Its cost is linear: **about 308 input tokens per 1,000
characters of `SKILL.md`**, injected into the subagent's first request. All three MCP servers
start from the plugin's `.mcp.json`, and the read-only Serena launch decided after S-02 works
from inside the plugin.

But the tool names and grants of C001-IF-09 do not work as written:

1. **Plugin MCP tools are scoped to the plugin.** Their names are
   `mcp__plugin_architect_<server>__<tool>`, not `mcp__<server>__<tool>`. A subagent granted
   `mcp__serena__find_referencing_symbols` never gets the tool, while the plugin-scoped name
   works. DeepWiki's question tool is `ask_wiki_question`, not `ask_question`.
2. **MCP tools are deferred.** A subagent can use a granted MCP tool only if it is also
   granted `ToolSearch` to load it. No agent in C001-IF-09 has `ToolSearch`.
3. **`SERENA_HOME` needs a pre-seeded configuration.** `${CLAUDE_PLUGIN_DATA}` is available in
   `.mcp.json` and gives a per-plugin, per-user folder, which suits D-S02-3. But Serena moves
   project data out of the repository only if a `serena_config.yml` with
   `project_serena_folder_location` already exists there when Serena first starts.

Spec defects D-S06-1 … 3 are raised, and a C001-NFR-105 budget proposal is made for P-01.

## Method

| Item | Value |
|---|---|
| Machine | REF-WIN: Windows 11 Home 10.0.26200; Node 22.13.0; uv 0.6.9; serena-agent 1.7.0 |
| Claude Code | 2.1.295, the desktop app's bundled binary, with the parent session's `CLAUDE*`/`ANTHROPIC*` variables removed; model `haiku` (`claude-haiku-5-5`) |
| Plugin | a scratch copy of `plugins/architect/` loaded with `--plugin-dir`, plus: six filler skills `s06-a…f` (206 lines and 21,906 characters each, written in ordinary prose), probe agents, a `.mcp.json` and `serena/architect-read-only.yml` (the mode file from S-02). The repository's plugin was not modified |
| Project | scratch git repository with `app.ts` (`createIntent`, `pay`) |
| Measure | `usage` of each subagent's first API request, from its transcript (`input_tokens + cache_creation_input_tokens + cache_read_input_tokens`) |
| Cost | all runs together under $0.05 |
| Cleanup | `~/.claude/plugins/data/architect-inline/` (26 MB, created by the `${CLAUDE_PLUGIN_DATA}` test) was deleted afterwards |

## Part 1: preloaded skill cost

Four probe subagents ran in the foreground, one after another, each with the task
"reply ok":

| Agent | `skills:` | First-request input tokens | Δ vs no skills | Skill text in transcript |
|---|---|---|---|---|
| `architect:probe-s0` | — | 2,225 | — | none |
| `architect:probe-s2` | `[s06-a, s06-b]` | 15,733 | +13,508 | 2 × 200 rule lines |
| `architect:probe-s6` | `[s06-a … s06-f]` | 42,749 | +40,524 | 6 × 200 rule lines |
| `architect:probe-s2q` | `[architect:s06-a, architect:s06-b]` | 15,745 | +13,520 | 2 × 200 rule lines |

- Each skill adds exactly 6,754 tokens, both with 2 skills and with 6, so the cost is linear.
- That is **32.8 tokens per line** for these lines (106 characters each) and **308 tokens per
  1,000 characters**. Characters are the stable measure, because lines vary in length.
- Short and plugin-qualified skill names both preload.
- The skills of the plugin are listed in the session as `architect:s06-a` …
- The cost is paid on every start of that subagent; within one session it is prompt-cached
  after the first request.

### What the C001-NFR-105 budget means in tokens

C001-NFR-105 sets ≤ 400 lines per skill and ≤ 1,600 lines per agent, counting `SKILL.md`
bodies. Converted at 308 tokens per 1,000 characters:

| Typical line length | ≤ 400 lines (one skill) | ≤ 1,600 lines (one agent) |
|---|---|---|
| 60 characters (average of this repository's `ideation.md`) | ≈ 7,400 tokens | ≈ 29,600 tokens |
| 106 characters (the filler used here) | ≈ 13,100 tokens | ≈ 52,200 tokens |

A line budget does not bound tokens, because one long line costs as much as several short
ones. **Proposal for P-01:** measure PLG-SIZE-001 in characters, with ≤ 24,000 characters per
skill (≈ 7,400 tokens) and ≤ 64,000 characters per agent (≈ 19,700 tokens). Keep the line
counts only as a readability guideline. The conductor (A0) preloads seven skills and the
spec-writer (A4) five, so the per-agent figure is the one that matters.

## Part 2: MCP servers and tool names

`.mcp.json` used (the Serena entry follows the S-02 decision):

```json
{
  "mcpServers": {
    "context7": { "type": "http", "url": "https://mcp.context7.com/mcp" },
    "deepwiki": { "type": "http", "url": "https://mcp.deepwiki.com/mcp" },
    "serena": {
      "command": "serena",
      "args": ["start-mcp-server", "--context", "claude-code", "--mode", "planning",
               "--mode", "${CLAUDE_PLUGIN_ROOT}/serena/architect-read-only.yml",
               "--project-from-cwd", "--enable-web-dashboard", "False", "--open-web-dashboard", "False"],
      "env": { "SERENA_HOME": "${CLAUDE_PLUGIN_DATA}/serena" }
    }
  }
}
```

`claude plugin validate` passed. In the session's init message the servers are named
`plugin:architect:context7`, `plugin:architect:deepwiki` and `plugin:architect:serena`.
Context7 and DeepWiki were `connected` at init, without authentication. Serena was still
`pending` and became available a few seconds later.

### Tool names observed

| Server | Tool names (as agents must grant them) | C001-IF-09 today |
|---|---|---|
| Context7 | `mcp__plugin_architect_context7__resolve-library-id`, `mcp__plugin_architect_context7__query-docs` | `mcp__context7__resolve-library-id`, `mcp__context7__query-docs`: wrong prefix |
| DeepWiki | `mcp__plugin_architect_deepwiki__read_wiki_structure`, `mcp__plugin_architect_deepwiki__read_wiki_contents`, `mcp__plugin_architect_deepwiki__ask_wiki_question` | `…__ask_question`: wrong tool name, plus wrong prefix |
| Serena (read-only launch) | `mcp__plugin_architect_serena__find_symbol`, `…__get_symbols_overview`, `…__find_referencing_symbols`, `…__find_declaration`, `…__find_implementations`, `…__get_diagnostics_for_file`, `…__initial_instructions` | `mcp__serena__…`: wrong prefix; `search_for_pattern`, `list_dir`, `find_file` do not exist (D-S02-2) |

### Grants in a subagent

| Probe grant (`tools:`) | Result |
|---|---|
| `Read, mcp__serena__find_referencing_symbols` | the subagent had only `Read`: "no ToolSearch tool, so I have no way to load Serena's tool" |
| `Read, mcp__plugin_architect_serena__find_referencing_symbols` | the same: only `Read` |
| `Read, ToolSearch, mcp__serena__find_referencing_symbols` | ToolSearch found nothing, even for the exact name, after Serena had connected |
| `Read, ToolSearch, mcp__plugin_architect_serena__find_referencing_symbols` | ToolSearch `select:` loaded the tool, and the call returned the reference from `pay` |

Early in a session, ToolSearch can answer "Some MCP servers are still connecting:
plugin:architect:serena … try searching again". The cartographer must retry, or fall back
under C001-REQ-1010, when Serena is not yet connected.

### `.mcp.json` variables and Serena data location (input to D-S02-3)

| Expression | Result |
|---|---|
| `${CLAUDE_PLUGIN_ROOT}` in `args` | expanded: the mode file was loaded (7 tools instead of 17) |
| `${S06_SERENA_HOME}` in `env` (variable set by the launching shell) | expanded: Serena used that folder |
| `${CLAUDE_PLUGIN_DATA}` in `env` | expanded to `~/.claude/plugins/data/architect-inline` (`<plugin>-<marketplace>`; `inline` for `--plugin-dir`). Serena created its home there |
| `SERENA_HOME=${CLAUDE_PLUGIN_DATA}/serena` with **no** `serena_config.yml` there yet | Serena wrote a default config (`project_serena_folder_location: "$projectDir/.serena"`, `web_dashboard: true`) and created **`<repo>/.serena/`** |
| the same, with a **pre-seeded** `serena_config.yml` setting `project_serena_folder_location: "<plugin data>/serena/projects/$projectFolderName/.serena"` | repository untouched; project data under the plugin data folder |

So D-S02-3 can be met with `SERENA_HOME=${CLAUDE_PLUGIN_DATA}/serena`, **provided the
configuration is written before Serena first starts**. A SessionStart hook is not a
reliable place for this, because MCP servers start alongside session start. `/architect:init`
or `/architect:doctor` has to do it. A side effect to note: repositories with the same
folder name share Serena project data under `$projectFolderName`.

## Spec defects raised

| ID | Ref | Summary |
|---|---|---|
| D-S06-1 | C001-IF-09 (A1, A2, A6), C001-REQ-1007, C001-REQ-1008, C001-REQ-1109, C001-TS-1008, C001-TS-1009, C001-TS-1110, PLG-TOOLS-001 | MCP tools of plugin-declared servers are named `mcp__plugin_architect_<server>__<tool>`. Grants of the form `mcp__serena__…`, `mcp__context7__…` and `mcp__deepwiki__…` never resolve, and the prefix checks in REQ-1008/1109 and their scenarios test the wrong prefix. DeepWiki's tool is `ask_wiki_question` (not `ask_question`). |
| D-S06-2 | C001-IF-09 (A1, A2, A6), C001-NFR-204 | MCP tools are deferred, so an agent needs `ToolSearch` to use a granted MCP tool. Add `ToolSearch` to the agents that hold MCP grants. The tool loads only what the `tools` allowlist permits, so least privilege is preserved. |
| D-S06-3 | C001-NFR-105, PLG-SIZE-001 | The line budget does not bound context cost (308 tokens per 1,000 characters; a 1,600-line agent costs 30k–52k tokens depending on line length). Proposal: a character budget of ≤ 24,000 per skill and ≤ 64,000 per agent; P-01 decides. |

D-S02-3 is refined by this spike: `SERENA_HOME=${CLAUDE_PLUGIN_DATA}/serena`, with
`serena_config.yml` written by init or doctor before Serena's first start.

Recorded in the "Defects (manual)" table of `20-plan/handoff.md`.

## Test cases in `verified_by`

C001-TC-1009 and C001-TC-1110 are integration tests on agent frontmatter, assigned to
C001-T-060. As specified they check the prefixes `mcp__serena` / `mcp__context7` /
`mcp__deepwiki`. After D-S06-1 they must check
`mcp__plugin_architect_serena` / `mcp__plugin_architect_context7` /
`mcp__plugin_architect_deepwiki`.
