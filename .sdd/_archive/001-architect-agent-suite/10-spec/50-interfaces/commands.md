---
id: C001-IF-10
artifact: spec/interface
kind: commands
change: CHG-001
phase: 10-spec
status: approved
---

# C001-IF-10 — Commands and doctor remedies

## §1 Commands

| Command | Arguments | Loads skill(s) | Behaviour summary | REQs |
|---|---|---|---|---|
| `/architect:init` | — | sdd-conventions, interview-protocol | `sdd init`; baseline survey (cartographer); constitution interview; toolchain.md; G0 | C001-REQ-101, 114, 115, 121, 127 |
| `/architect:new` | `"<title>"` | sdd-conventions, interview-protocol | profile proposal and confirmation; `sdd change new` | C001-REQ-116 |
| `/architect:ideate` | `[<NNN>]` | phase-ideation | run or resume ideation | C001-REQ-204 |
| `/architect:specify` | `[<NNN>]` | phase-spec | run or resume spec | C001-REQ-204 |
| `/architect:plan` | `[<NNN>]` | phase-plan | run or resume plan | C001-REQ-204 |
| `/architect:revise` | `<phase> [<NNN>] --reason "<t>"` | gate-protocol + phase skill | `sdd change revise`; incremental rework; impact list | C001-REQ-812, 813 |
| `/architect:gate` | `[<NNN>]` | gate-protocol | gate presentation and decision | C001-REQ-802 … 804 |
| `/architect:status` | — | — | `sdd status` output with next actions | C001-REQ-104 |
| `/architect:lint` | `[<NNN>]` | — | `sdd lint` and `sdd trace` without LLM work | C001-REQ-701 |
| `/architect:decide` | `"<question>" [--change NNN]` | options-analysis, interview-protocol | OA + one question + DEC/ADR | C001-REQ-316 |
| `/architect:research` | `"<question>" [--change NNN]` | research-protocol | researcher note | C001-REQ-315 |
| `/architect:archive` | `<NNN> [--dry-run]` | sdd-conventions | preview, confirmation, `sdd archive` | C001-REQ-913 … 921, 924 |
| `/architect:doctor` | — | code-discovery | tool checks, toolchain.md, remedies table, Serena configuration | C001-REQ-115, 1013, 1110, 1111, 1123 |

## §2 Command body pattern

A command body contains only: the argument handling, the instruction to load its skill(s),
and the command-specific preconditions. Phase procedures live in the phase skills
(C001-REQ-204, C001-REQ-1122).

## §3 Doctor remedies (Windows-first; macOS/Linux variants in the README)

| Tool | Detection | Install / fix command |
|---|---|---|
| node | `node -v` ≥ 20 | `winget install OpenJS.NodeJS.LTS` |
| git | `git --version` | `winget install Git.Git` |
| Claude Code | `claude --version` ≥ 2.1.295 (C001-REQ-1123) | `claude update`, or update the Claude desktop app (which bundles its own Claude Code) |
| ripwire | `ripwire --version` (0.6.x) | download `ripwire-<version>-windows-x64.zip` from `github.com/redhat-et/ripwire/releases`, check it against the published `.sha256`, extract it and add the extracted folder to the user PATH; then `ripwire <repo> --doctor` reports 9/9 checks (verified with 0.6.5, spike S-01) |
| Serena | `serena --version` (1.7.x) | `winget install astral-sh.uv` then `uv tool install -p 3.13 "serena-agent==1.7.*"`; keep uv and Node on PATH (language servers); the doctor writes the Serena configuration of C001-REQ-1013 (verified, spike S-02) |
| ast-grep | `ast-grep --version` | `npm install -g @ast-grep/cli` |
| Task tools (conductor phase plan, C001-REQ-219) | `CLAUDE_CODE_ENABLE_TODO_TOOLS` is `1` in the environment or in the `env` of `~/.claude/settings.json` | add `"env": { "CLAUDE_CODE_ENABLE_TODO_TOOLS": "1" }` to `~/.claude/settings.json`; without it the conductor lists the phase steps in its messages |
| Context7 | MCP `resolve-library-id` probe | check network; endpoint `https://mcp.context7.com/mcp` |
| DeepWiki | MCP `read_wiki_structure` probe on `oraios/serena` | check network; endpoint `https://mcp.deepwiki.com/mcp` |
