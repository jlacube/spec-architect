# Hosts

The skill text names actions; each assistant maps them to its own tools.

| Action in the skill | Claude Code | GitHub Copilot (VS Code agent mode) | OpenCode |
|---|---|---|---|
| read / search files | Read, Grep, Glob | `read`, `search` | `read`, `grep`, `glob` |
| edit / write code | Edit, Write | `edit` | `edit`, `write` |
| run a command | Bash / PowerShell | `execute` (terminal) | `bash` |
| ask the owner | AskUserQuestion, or plain chat | chat (or `askQuestions`) | chat |
| progress list | the host's task list | `todo` | `todowrite` |

## Installing the skill

The source of truth is `.claude/skills/sdd-implement/` in this repository.

- **Claude Code** — loads it automatically from `.claude/skills/`. Starts on requests like
  "implement C005-T-011" or by name: `/sdd-implement 005`.
- **GitHub Copilot** — copy the folder to `.github/skills/sdd-implement/` (agent skills), or point
  a prompt file `.github/prompts/sdd-implement.prompt.md` at `SKILL.md`.
- **OpenCode** — copy the folder to `.opencode/skill/sdd-implement/`, or reference `SKILL.md`
  from `AGENTS.md`.
- **Any other assistant** — attach `SKILL.md` and the `references/` files to the conversation, or
  paste them into its project instructions.

Copies drift; re-copy after editing the source.

## Interaction with Architect hooks

When the Architect plugin's guards are installed (Claude Code hooks, Copilot `sdd-mcp-server` or
hooks mode), writes under `.sdd/` outside the CLI are denied. That matches this skill's rules; if
a guard denies a fallback edit, use the CLI instead.

## When sdd-coding ships

This skill is a stop-gap. Once the dedicated **sdd-coding** framework exists, it replaces this
folder; its contract with the architect side is the same (hand-off, task statuses, defects), so
reports made with this skill stay valid.
