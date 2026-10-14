---
id: C002-SPEC-GLOSSARY
artifact: spec/glossary-delta
change: CHG-002
phase: 10-spec
status: draft
---
# C002 — Glossary delta

Terms introduced by CHG-002. `_constitution/glossary.md` does not exist yet; the terms of CHG-001
are in `.sdd/001-architect-agent-suite/10-spec/40-domain/glossary-delta.md` and are not repeated here
(Architect, conductor, specialist, author agent, Architect agent, path guard, bash guard, sdd CLI,
plugin structure check and the others listed there). At archive these terms are merged into `_constitution/glossary.md` (C001-REQ-919).

## 1. Domain terms

| Term | Definition |
|---|---|
| Host | An agent application that runs the Architect agents for P-01: Claude Code, OpenCode, or GitHub Copilot in VS Code |
| Target | A host for which a build ships an Architect package. Claude Code is the source target; OpenCode and Copilot VS Code are the generated targets (C002-DEC-004) |
| Generated target | OpenCode or Copilot VS Code: a target whose package the generator writes from the source plugin |
| Copilot VS Code | GitHub Copilot Chat in Visual Studio Code, using its local agent harness. Copilot CLI and the Copilot cloud agent are not targets (C002-NG-01) |
| Source plugin | `plugins/architect`, the Claude Code plugin; the only source of every target package (C002-DEC-006) |
| Target package | The generated output for one generated target, under `dist/opencode/` or `dist/copilot/` |
| Generator | The build step that reads the source plugin into the neutral model and writes one target package per generated target |
| Neutral model | The target-independent representation of the source plugin's agents, commands, skills, hooks and MCP servers that the generator builds before writing any target package |
| Mapping table | A per-target table the generator uses to translate Claude Code tool names, MCP tool names, model names and variables (`${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`, `$ARGUMENTS`) |
| Wiring variant | A per-target version of a skill's "Claude Code wiring" section, or of the CLI invocation line of `sdd-conventions`, kept in the source plugin and selected by the generator |
| Skill inlining | Copying an agent's preloaded skills into that agent's generated body (C002-DEC-002) |
| Write/shell boundary | The rule that an Architect agent writes only inside `.sdd/` (on Claude Code also its own memory folder) and runs only commands of the allowlist in C001-IF-07 §3 (C001-NFR-201) |
| Enforcement mechanism | What enforces the write/shell boundary on a target: Claude Code hooks, the OpenCode permission engine, the sdd MCP server, or Copilot agent-scoped hooks |
| Guard core | The decision functions behind `sdd guard-path` and `sdd guard-bash`, shared by every enforcement mechanism that runs the `sdd` CLI code |
| Guard corpora | The path corpus and the shell corpus: the recorded allow/deny cases under `tests/guards/` (current-state §2 item 6) |
| Corpus replay | Running every case of the guard corpora against one enforcement mechanism and comparing each decision with the expected one |
| sdd MCP server | A local MCP server shipped in the CLI package; it writes `.sdd/` files and runs allowlisted commands for agents that have no edit or terminal tool (C002-DEC-001) |
| Agent-scoped hooks | Hooks declared in a Copilot custom agent's frontmatter that run only while that agent is active (Preview; C002-R-001 A-01) |
| Copilot hooks fallback | The exception of C002-DEC-005: Copilot agents carry agent-scoped hooks running the guard cores when spike S-08 shows that subagents are not confined to their tool list |
| `architect-sdd` | The npm package that publishes the `sdd` CLI with the executable name `sdd` (C002-DEC-007) |
| Bare `sdd` command | A shell command whose first word is `sdd` (the npm executable), as opposed to `node <path>/sdd.mjs` |
| Question tool | The host tool that shows an interview round or a gate to P-01: AskUserQuestion (Claude Code), `question` (OpenCode), `vscode/askQuestions` (Copilot VS Code) |
| Skipped answer | A question-tool result that carries no choice of P-01, such as VS Code's `{"skipped": true}` (C002-R-001 A-07) |
| Spike S-07, spike S-08 | Plan-phase experiments on OpenCode (S-07) and Copilot VS Code (S-08) that settle the assumptions of `10-context/scope.md` §3 before the targets are built |
| Eval runner | A back end of the eval harness that executes eval cases on one host while keeping the case API of `evals/harness/` |
| Injection eval | An eval case whose input carries planted instructions; it passes when the agent acts on none of them |
| Manual VS Code checklist | The recorded manual verification of Copilot VS Code behaviour that cannot be scripted, run before each release (C002-DEC-003) |
| Toy change | A minimal change used to drive the workflow from creation to gate G1 on a fresh install |
| Release (of a target) | Publishing a target package to adopters; the release check of C002-DEC-005 decides whether a target may be released |

## 2. System names (allowed after `THE` in EARS statements)

System names for the CHG-002 requirements are added with the requirements (spec step 3).

| Name | Component |
|---|---|
