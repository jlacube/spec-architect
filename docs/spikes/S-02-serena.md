---
id: C001-SPIKE-S-02
task: C001-T-003
change: CHG-001
spike: S-02
title: "Serena read-only on Windows"
date: 2026-10-10
verdict: works-with-caveats
risk_refs: [C001-RISK-004]
spec_refs: [C001-REQ-1006, C001-REQ-1007, C001-CON-08, C001-CON-01, C001-IF-09, C001-IF-14]
---

# S-02 — Serena read-only on Windows

## Verdict

**works-with-caveats.** Serena 1.7.0 installs with uv on Windows 11 in 19 s. It starts as
an MCP stdio server and resolves definitions and references correctly in TypeScript and
Python: 10/10 symbols match the S-01 ground truth.

The launch that C001-REQ-1006 specifies (`--context claude-code --mode planning`) contradicts
the spec in three ways:

1. **It is not read-only.** Planning mode leaves 7 tools that change files or memories
   (`replace_in_files`, `rename_symbol`, `safe_delete_symbol`, `write_memory`, `edit_memory`,
   `delete_memory`, `rename_memory`) plus `onboarding`, which writes memories. C001-TS-1007
   checks only six names, so it would pass anyway.
2. **Three granted tools don't exist.** The `claude-code` context removes `find_file`,
   `list_dir` and `search_for_pattern`, which C001-REQ-1007 and C001-IF-09 (A2, A6) grant
   to the cartographer and the architect.
3. **Serena writes into the user's repository.** When it activates a project, it creates
   `<repo>/.serena/` (`project.yml`, `project.local.yml`, `.gitignore`, `cache/`,
   `memories/`). This writes outside `.sdd/` (cf. C001-CON-01).

All three have a working remedy, verified below (config C). Spec defects D-S02-1 … 3 are
raised.

## Method

| Item | Value |
|---|---|
| Machine | REF-WIN: Windows 11 Home 10.0.26200, Git Bash; uv 0.6.9; Node 22.13.0 |
| Serena | `serena-agent` 1.7.0 from PyPI (2026-08-09, MIT), `uv tool install -p 3.13 serena-agent==1.7.0` (19 s); executables `serena`, `serena-agent`, `serena-hooks` in `~/.local/bin`; MCP `serverInfo` reports `Serena 1.28.1` |
| Repositories | local clones (`git clone --local`) of `bolt.diy` @ `41bb909` (TypeScript) and `crawl4ai` @ `dde14eb` (Python) in a scratch folder. The originals were not used because Serena writes into the project (finding 3) |
| Client | minimal MCP stdio client (JSON-RPC: `initialize`, `tools/list`, `tools/call`), standing in for Claude Code |
| Ground truth | the S-01 call sites (`git grep` plus manual reading), `docs/spikes/S-01-ripwire.md` |

## Launch configurations and tools observed

The dashboard flags (`--enable-web-dashboard False --open-web-dashboard False`) were passed in
every configuration. Serena's default is to start the dashboard **and open it in a browser
tab** on every server start.

| Config | Launch arguments (after `serena start-mcp-server`) | Tools exposed |
|---|---|---|
| A (spec, C001-REQ-1006) | `--context claude-code --mode planning --project <repo>` | 17: `delete_memory`, `edit_memory`, `find_declaration`, `find_implementations`, `find_referencing_symbols`, `find_symbol`, `get_diagnostics_for_file`, `get_symbols_overview`, `initial_instructions`, `list_memories`, `onboarding`, `read_memory`, `rename_memory`, `rename_symbol`, `replace_in_files`, `safe_delete_symbol`, `write_memory` |
| B (no mode) | `--context claude-code --project <repo>` | 21: A plus `insert_after_symbol`, `insert_before_symbol`, `replace_content`, `replace_symbol_body` |
| C (remedy) | `--context claude-code --mode planning --mode <plugin>/serena/architect-read-only.yml --project <repo>` with `SERENA_HOME=<dir>` (see below) | 7: `find_declaration`, `find_implementations`, `find_referencing_symbols`, `find_symbol`, `get_diagnostics_for_file`, `get_symbols_overview`, `initial_instructions` |
| D (plugin form) | as C, with `--project-from-cwd` instead of `--project <repo>`, server started in the repository | 7 (same as C); references resolved |

Where these tools come from (Serena 1.7.0 resources):

- `contexts/claude-code.yml` excludes `create_text_file`, `read_file`, `execute_shell_command`,
  `find_file`, `list_dir` and `search_for_pattern`, because Claude Code covers them with
  Read, Bash, Glob and Grep.
- `modes/planning.yml` excludes `create_text_file`, `replace_symbol_body`,
  `insert_after_symbol`, `insert_before_symbol`, `delete_lines`, `replace_lines`,
  `insert_at_line`, `execute_shell_command` and `replace_content`. It does **not** exclude
  `replace_in_files`, `rename_symbol`, `safe_delete_symbol`, the memory tools or
  `onboarding`.
- `--mode` can be repeated, and it accepts a path to a custom mode YAML. A mode given with
  `--mode` replaces the default modes from the global configuration.
- `read_only: true` exists only in the per-project `.serena/project.yml`, i.e. inside the
  user's repository. It cannot be set from the launch command.

Remedy mode file used in config C (`architect-read-only.yml`):

```yaml
description: Architect read-only mode — every editing, shell, memory and onboarding tool excluded
prompt: |
  You are operating in read-only analysis mode. Do not attempt to modify files or memories.
excluded_tools: [create_text_file, replace_symbol_body, insert_after_symbol, insert_before_symbol,
  delete_lines, replace_lines, insert_at_line, replace_content, replace_in_files, rename_symbol,
  safe_delete_symbol, execute_shell_command, write_memory, edit_memory, delete_memory,
  rename_memory, read_memory, list_memories, onboarding]
```

## Repository writes (finding 3)

| Config | `git status --porcelain --ignored` in the repository after start |
|---|---|
| A, B (default Serena home) | `?? .serena/` and `!! .serena/project.local.yml` (project.yml, project.local.yml, `.gitignore`, `cache/`, `memories/`) |
| C, D (`SERENA_HOME` whose `serena_config.yml` sets `project_serena_folder_location: "<home>/projects/$projectFolderName/.serena"`) | clean: the project folder was created under `<home>/projects/<name>/.serena` |

The location is a **global** setting (`project_serena_folder_location` in
`serena_config.yml`, placeholders `$projectDir` and `$projectFolderName`). It can be
redirected only by giving Serena a home folder (`SERENA_HOME`) whose config sets it. If a
repository already contains `.serena/`, Serena keeps using that folder. Serena also writes
logs and downloaded language servers into its home: 26 MB for the TypeScript server. Pyright
is fetched with `uvx` into uv's cache.

## Reference lookups (config C/D)

Times are per call with a warm server. The first TypeScript call includes the one-time
download of the TypeScript language server. Server start up to `initialize` takes 6.9–7.1 s.

| Repo | Symbol | `find_symbol` | `find_referencing_symbols` (enclosing symbols) | Matches S-01 truth | Time (refs) |
|---|---|---|---|---|---|
| bolt.diy | `streamText` | stream-text.ts:148 | `chatAction` (+ nested `chatAction/options/onFinish`), `enhancerAction`, `llmCallAction`; 3 import refs | yes | 5.7 s (first call, LS download) |
| bolt.diy | `getMessages` | db.ts:79 | `duplicateChat`, `forkChat`, `updateChatDescription`, `useChatHistory/exportChat`, `useChatHistory/useEffect() callback`, `useEditChatDescription/fetchLatestDescription/useCallback() callback` | yes (same 5 top-level functions, nested callbacks named) | 0.5 s |
| bolt.diy | `forkChat` | db.ts:173 | `Messages/React.forwardRef() callback/handleFork` | yes | 0.3 s |
| bolt.diy | `getOpenAILikeModel` | base-provider.ts:122 | `OpenAILikeProvider/getModelInstance`, `TogetherProvider/getModelInstance` | yes | 0.3 s |
| bolt.diy | `simplifyBoltActions` | stream-text.ts:52 | `streamText` | yes | 0.3 s |
| crawl4ai | `parse_srcset` | content_scraping_strategy.py:39 | `WebScrapingStrategy/process_image`, `LXMLWebScrapingStrategy/process_image` | yes | 4.7 s (first call) |
| crawl4ai | `html2text` (control: no callers) | `__init__.py`:1016 | none | yes | 0.7 s |
| crawl4ai | `escape_md` | utils.py:199 | `HTML2Text/handle_tag`, `HTML2Text/handle_tag/link_url`; 1 import ref | yes | 0.5 s |
| crawl4ai | `get_cached_url` | database.py:54 | `WebCrawler/run`; 1 import ref | yes | 0.2 s |
| crawl4ai | `element_style` | utils.py:57 | `HTML2Text/handle_tag`; 1 import ref | yes | 0.5 s |

The JSON's `body_location.start_line` is **0-based** (`parse_srcset` is reported as 38; the
real line is 39). Lines above are converted to 1-based. The cartographer must add 1 when it
writes evidence entries (C001-IF-03 §11 uses 1-based lines).

## Launch command for the plugin `.mcp.json` (input to C001-REQ-1006)

```json
"serena": {
  "command": "serena",
  "args": ["start-mcp-server", "--context", "claude-code", "--mode", "planning",
           "--mode", "${CLAUDE_PLUGIN_ROOT}/serena/architect-read-only.yml",
           "--project-from-cwd", "--enable-web-dashboard", "False", "--open-web-dashboard", "False"]
}
```

Open points that this spike cannot settle on its own; they are part of the defects below:

- How the repository write (finding 3) is avoided depends on a decision: accept and document
  `.serena/`, or point `SERENA_HOME` at a dedicated folder via the `.mcp.json` `env` block.
  The second option needs a writable, per-user path expressible in `.mcp.json`; whether
  Claude Code expands variables such as a plugin data folder there belongs to S-05/S-06
  (T-006/T-007).
- The MCP tool names seen by agents (`mcp__serena__…` vs a plugin-prefixed form) are
  checked in S-06 (T-007), not here.

## Spec defects raised

| ID | Ref | Summary |
|---|---|---|
| D-S02-1 | C001-REQ-1006 (also C001-AC-1006.1, C001-TS-1007, C001-CON-08 rationale) | `--context claude-code --mode planning` is not read-only in Serena 1.7.0: `replace_in_files`, `rename_symbol`, `safe_delete_symbol`, `write_memory`, `edit_memory`, `delete_memory`, `rename_memory` and `onboarding` stay exposed. TS-1007 checks only six names and would pass anyway. The launch also needs `--project-from-cwd` (the plugin cannot know the repository path) and the dashboard flags (by default a browser tab opens on every start). Proposed: add a plugin-shipped mode file (`--mode ${CLAUDE_PLUGIN_ROOT}/serena/architect-read-only.yml`); TS-1007 to assert that the tool list is a subset of the read-only set observed in config C. |
| D-S02-2 | C001-REQ-1007 (also C001-AC-1007.1, C001-TS-1008, C001-IF-09 A2/A6, C001-IF-14 Serena row) | `find_file`, `list_dir` and `search_for_pattern` do not exist under the `claude-code` context, so 3 of the 6 granted tools are dead grants. Proposed: grant `find_symbol`, `get_symbols_overview`, `find_referencing_symbols`, plus optionally `find_declaration` and `find_implementations`, and leave file and pattern search to Glob/Grep. The alternative is a custom context that re-enables the three tools. |
| D-S02-3 | C001-REQ-1006 / C001-CON-01 (also C001-IF-14) | Serena creates `<repo>/.serena/` (project.yml, project.local.yml, cache, memories) when it activates the project. That is a write outside `.sdd/` in the user's repository, which no current requirement covers. It can be relocated only through a Serena home folder (`SERENA_HOME`) whose `serena_config.yml` sets `project_serena_folder_location`. Needs a decision: accept and document, relocate via `SERENA_HOME`, or make relocation a documented setup step checked by the doctor. |

Recorded in the "Defects (manual)" table of `20-plan/handoff.md`.

**P-01 decisions (2026-10-10), to be applied in one spec revision after spikes S-03 … S-06:**

- D-S02-1: use the read-only launch of config D (custom mode file shipped in the plugin,
  `--project-from-cwd`, dashboard off). TS-1007 asserts the observed read-only tool set.
- D-S02-2: grant symbol tools only: `find_symbol`, `get_symbols_overview`,
  `find_referencing_symbols`, `find_declaration`, `find_implementations`. File and text
  search stay with Glob/Grep.
- D-S02-3: relocate Serena's project data through `SERENA_HOME`. The plugin's `.mcp.json`
  points it at a dedicated per-user folder whose `serena_config.yml` sets
  `project_serena_folder_location` outside the repository, and the doctor creates and checks
  that config. The exact path expression in `.mcp.json` follows S-05/S-06.

## Install notes for the README and doctor (C001-IF-10 §3, `[VERIFY S-02]`)

- `uv tool install -p 3.13 serena-agent` works as written. Pin to the minor version that
  was verified: `serena-agent==1.7.*`. uv itself installs with `winget install astral-sh.uv`
  (uv 0.6.9 was already present here).
- Detection: `serena --version` prints `Serena 1.7.0` immediately. The MCP probe (tool
  listing) costs a server start of about 7 s.
- The language servers download on first use. TypeScript (about 26 MB) goes into the Serena
  home through npm, so Node must be on PATH. Pyright is run with `uvx pyright` from uv's
  cache, so uv must stay on PATH at run time.

## Test cases in `verified_by`

C001-TC-1007 and C001-TC-1008 are integration tests on the plugin's `.mcp.json` and the agent
frontmatter. The test plan assigns them to C001-T-060, and those files don't exist yet. This
spike supplies their expected values. As currently specified, TC-1007 would pass on a server
that is **not** read-only, and TC-1008 would require grants that resolve to no tool.
Defects D-S02-1 and D-S02-2 cover both.
