# Architect — spec-driven development agents for Claude Code

Architect turns an idea into an approved **ideation brief**, **specification** and **implementation
plan**, phase by phase, with a human approval gate at each phase exit. A conductor agent interviews
you in short option-based rounds and delegates to nine specialists (research, code evidence,
options analysis, requirements, acceptance tests, architecture, planning, critique, audit). A
deterministic CLI (`sdd`) keeps IDs, traceability, lint, approvals and status exact. Everything is
plain Markdown and JSON under `.sdd/` in your repository. Architect never writes production code:
its agents may write only inside `.sdd/` (and the memory folder of the two agents that keep notes).

## Prerequisites

| Requirement | Version | Check |
|---|---|---|
| Windows 11 (x64) | — | macOS and Linux: prepared, untested |
| Claude Code | **2.1.295 or later** (older versions do not tell hooks which agent is calling, so the guards cannot work) | `claude --version` |
| Node.js | 20 or later (LTS recommended) | `node -v` |
| Git | any recent version | `git --version` |

The repository you work in should be a git repository: the code-intelligence server (Serena) uses it
to find the project root.

## Install (Windows 11)

1. Get this repository (clone or download) to a folder of your choice.
2. In Claude Code, add it as a plugin marketplace and install the plugin:

   ```text
   /plugin marketplace add <folder of this repository>
   /plugin install architect@architect-local
   ```

   Restart Claude Code if it asks.
3. Check `/plugin` lists **architect** as installed.
4. In the repository you want to specify, start the conductor:

   ```bash
   claude --agent architect:sdd-conductor
   ```

5. Run `/architect:doctor`. It checks every tool below, prints the fix for anything missing and
   sets up Serena's data folder in the plugin's data directory.

To let the conductor show its phase plan as a task list, add this to your user settings
(`~/.claude/settings.json`); without it the conductor lists the steps in its messages:

```json
{ "env": { "CLAUDE_CODE_ENABLE_TODO_TOOLS": "1" } }
```

macOS and Linux: the same steps are expected to work (the CLI and hooks are platform-neutral) but are
**prepared, untested** in this version.

## Optional tools

Architect works without them; each one improves code evidence for existing codebases. When one is
missing, the cartographer falls back to the next layer and says so in its evidence.

| Tool | What it adds | Install (Windows) | Fallback |
|---|---|---|---|
| **ripwire** 0.6.x | ranked repository map, task lens, callers, impact, hotspots with token budgets | download `ripwire-<version>-windows-x64.zip` from github.com/redhat-et/ripwire/releases, check it against the published `.sha256` file (`certutil -hashfile <zip> SHA256`), extract it, add the extracted folder to your **user** PATH. Use only the executable: do not install the hooks or skills bundled in the archive | Serena → LSP → grep |
| **Serena** 1.7.x | symbol lookup, references, declarations, implementations (started read-only by the plugin) | `winget install astral-sh.uv`, then `uv tool install -p 3.13 "serena-agent==1.7.*"`; keep uv and Node on PATH (Serena installs language servers with npm on first use) | LSP → grep |
| **ast-grep** | structural code search | `npm install -g @ast-grep/cli` | grep |
| **Context7** | current library documentation (remote MCP, no install) | — | WebSearch / WebFetch |
| **DeepWiki** | understanding other public repositories (remote MCP, no install) | — | WebFetch |

Archify is not used in this version: architecture diagrams are Mermaid.

## Quickstart

In your repository, with the conductor running (`claude --agent architect:sdd-conductor`):

1. `/architect:init` — creates `.sdd/`, records the toolchain, surveys existing code, and asks at most
   two rounds of questions to draft your project **constitution** (principles, quality bar, NFR
   defaults, Definition of Done). Approve it with `/architect:gate constitution`.
2. `/architect:new "Coupon codes"` — creates change `001` (add `--profile lite` for a small change,
   `--kind brownfield` when it modifies existing code).
3. `/architect:ideate` — interview, research, options; then `/architect:gate ideation` (gate G1).
4. `/architect:specify` — stories, EARS requirements, acceptance scenarios, NFRs, interfaces,
   architecture; then `/architect:gate spec` (G2).
5. `/architect:plan` — tasks, milestones, test plan, risks, rollout, hand-off; then
   `/architect:gate plan` (G3).
6. Give `.sdd/001-coupon-codes/20-plan/handoff.md` to whoever implements it. Progress is reported with
   `node <plugin>/scripts/sdd.mjs task set <task-ID> --status done --commit <sha>`.
7. When every task is done: `/architect:archive 001` merges the change into the living specs.

At every gate you answer one question: **Approve**, **Approve with waivers**, **Revise** or **Stop**.
Nothing is approved without your answer, and your words are recorded verbatim in the change's Gate log.

## Commands

| Command | What it does |
|---|---|
| `/architect:init` | set up `.sdd/`, Serena config, toolchain record, code survey; constitution interview (G0) |
| `/architect:new "<title>" [--profile lite\|full] [--kind greenfield\|brownfield\|mixed]` | create a change |
| `/architect:ideate [<NNN>]` | run or continue ideation |
| `/architect:specify [<NNN>]` | run or continue specification |
| `/architect:plan [<NNN>]` | run or continue planning |
| `/architect:gate <constitution\|ideation\|spec\|plan> [<NNN>]` | lint, trace, critic, then the gate question |
| `/architect:revise <ideation\|spec\|plan> [<NNN>] --reason "<text>"` | reopen an approved phase |
| `/architect:status` | workspace status |
| `/architect:lint [<NNN>]` | lint with explanations |
| `/architect:research "<question>"` | one research note with sources |
| `/architect:decide "<question>"` | options analysis, one question, decision record |
| `/architect:archive <NNN> [--dry-run]` | preview, confirm, merge into the living specs |
| `/architect:doctor` | check the toolchain and print fixes |

Commands run in the conductor session; started elsewhere they tell you to start
`claude --agent architect:sdd-conductor`.

## Agents

| Agent | Model | Role |
|---|---|---|
| `sdd-conductor` | opus | the only agent that talks to you: phases, interviews, delegation, gates |
| `sdd-researcher` | sonnet | prior art, library docs (Context7), other repositories (DeepWiki), web |
| `sdd-cartographer` | sonnet | code evidence: entry points, callers, blast radius, hotspots, toolchain |
| `sdd-options-analyst` | opus | weighted options analyses with a recommendation |
| `sdd-spec-writer` | opus | user stories, EARS requirements, NFRs, domain model |
| `sdd-test-designer` | opus | acceptance criteria, Gherkin scenarios, Definition of Done, test plan |
| `sdd-architect` | opus | components, interfaces, diagrams, architecture decisions |
| `sdd-planner` | opus | tasks, milestones, risks, rollout, hand-off |
| `sdd-critic` | opus | rubric-based review: blocker, major and minor findings |
| `sdd-auditor` | haiku | lint, trace, status |

Each agent has only the tools its job needs. The plugin's hooks enforce the rest: Architect agents
can write only inside `.sdd/` (plus their own memory folder) and run only read-only commands (the
`sdd` CLI, ripwire read verbs, `ast-grep run`, read-only git, version checks). Your own session and
other plugins' agents are never restricted.

## Workspace layout

```text
.sdd/
├── SDD.md                     workspace description with a generated status table
├── registry.json              generated index of changes, phases, tasks, defects
├── _constitution/             constitution.md, toolchain.md, glossary.md
├── _decisions/                project-wide decision records
├── _living/                   CAP-<capability>.md: current truth after archives
├── _archive/                  archived changes
└── 001-coupon-codes/          one folder per change
    ├── change.md              phases, statuses, defects, waivers, Gate log
    ├── ids.json               ID ledger (allocated and retired IDs)
    ├── approvals.json         approved phase hashes
    ├── trace.json             traceability graph
    ├── 00-ideation/           ideation.md, research/, options and decisions, questions-log.md
    ├── 10-spec/               stories, requirements, acceptance, NFRs, domain, interfaces, architecture, DoD
    └── 20-plan/               strategy, decisions, tasks/, test plan, risks, rollout, observability, handoff.md
```

IDs look like `C001-REQ-012` (change 001, requirement 12) and are never reused.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Doctor: node missing or below 20 | Node.js not installed or too old | `winget install OpenJS.NodeJS.LTS`, then open a new terminal |
| Doctor: git missing | Git not installed | `winget install Git.Git` |
| Doctor: Claude Code below 2.1.295 | the guards need agent identity in hook input | `claude update`, or update the Claude desktop app (it bundles its own Claude Code) |
| Doctor: ripwire missing | optional tool not on PATH | download `ripwire-<version>-windows-x64.zip` from github.com/redhat-et/ripwire/releases, check its `.sha256`, extract it and add the folder to your user PATH (see Optional tools); the cartographer uses Serena → LSP → grep meanwhile |
| Doctor: Serena missing | optional tool not installed | `winget install astral-sh.uv`, then `uv tool install -p 3.13 "serena-agent==1.7.*"`; keep uv and Node on PATH |
| Doctor: ast-grep missing | optional tool not installed | `npm install -g @ast-grep/cli` |
| Doctor: task tools off | `CLAUDE_CODE_ENABLE_TODO_TOOLS` not set | add `"env": { "CLAUDE_CODE_ENABLE_TODO_TOOLS": "1" }` to `~/.claude/settings.json` |
| Doctor: Context7 unreachable | network or service down | check your network; endpoint `https://mcp.context7.com/mcp`; the researcher uses web search meanwhile |
| Doctor: DeepWiki unreachable | network or service down | check your network; endpoint `https://mcp.deepwiki.com/mcp`; the researcher reads repositories over the web meanwhile |
| An agent reports `GUARD-PATH-001` | an Architect agent tried to write outside `.sdd/` | expected: Architect never edits code. If the write was legitimate `.sdd/` content, check the path is inside this repository's `.sdd/` |
| An agent reports `GUARD-BASH-001` or `002` | a command outside the read-only allowlist, or chaining/redirection | expected; the agent should use the `sdd` CLI or a read-only command instead |
| Commands say to start the conductor | the command ran in another session | `claude --agent architect:sdd-conductor`, then run the command again |
| No "SDD workspace" line at session start | the folder has no `.sdd/` (by design the plugin stays silent there) | `/architect:init` |
| Serena lists editing tools or finds no symbols | the folder is not a git repository, so Serena activates no project | run `git init` in the repository (the agents can call only Serena's read tools in any case) |
| A gate is refused | lint errors, open `[NEEDS CLARIFICATION]` markers, critic blockers, or the previous phase is not approved | fix what `sdd gate show` lists, or approve with explicit waivers |
| A phase shows `stale` | an approved file changed after approval | `/architect:gate <phase>` to re-approve, or `/architect:revise` |
| Hooks fire twice / API error "tool_use ids must be unique" | an old Claude Code on PATH (2.0.x) | update Claude Code to 2.1.295 or later |

## License

MIT — see `LICENSE`. Bundled third-party code and the external tools Architect works with are listed
in `THIRD_PARTY_NOTICES.md`.
