---
id: C001-IF-10
artifact: spec/interface
kind: commands
change: CHG-001
phase: 10-spec
status: draft
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
| `/architect:archive` | `<NNN> [--dry-run]` | sdd-conventions | preview, confirmation, `sdd archive` | C001-REQ-913 … 921 |
| `/architect:doctor` | — | code-discovery | tool checks, toolchain.md, remedies table | C001-REQ-115, 1110, 1111 |

## §2 Command body pattern

A command body contains only: the argument handling, the instruction to load its skill(s),
and the command-specific preconditions. Phase procedures live in the phase skills
(C001-REQ-204, C001-REQ-1122).

## §3 Doctor remedies (Windows-first; macOS/Linux variants in the README)

| Tool | Detection | Install / fix command |
|---|---|---|
| node | `node -v` ≥ 20 | `winget install OpenJS.NodeJS.LTS` |
| git | `git --version` | `winget install Git.Git` |
| ripwire | `ripwire --doctor` | download the Windows x64 release from `github.com/redhat-et/ripwire/releases` and add it to PATH (preview build) [VERIFY S-01] |
| Serena | MCP tool listing of server `serena` | `winget install astral-sh.uv` then `uv tool install -p 3.13 serena-agent` [VERIFY S-02] |
| Archify | `node <skills>/archify/bin/archify.mjs doctor` | `npx skills add tt-a1i/archify -g` |
| ast-grep | `ast-grep --version` | `npm install -g @ast-grep/cli` |
| Context7 | MCP `resolve-library-id` probe | check network; endpoint `https://mcp.context7.com/mcp` |
| DeepWiki | MCP `read_wiki_structure` probe on `oraios/serena` | check network; endpoint `https://mcp.deepwiki.com/mcp` |
