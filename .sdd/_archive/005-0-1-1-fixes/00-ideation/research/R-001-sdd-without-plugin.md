---
id: C005-R-001
artifact: ideation/research
change: CHG-005
phase: 00-ideation
status: draft
---
# R-001 — Running the sdd CLI without the Architect plugin

## Question
Brief (verbatim summary): defect D-035 (C001-REQ-617): the hand-off defines `sdd` as
`node <plugin-root>/scripts/sdd.mjs`, so an implementer agent that does not have the Architect
plugin installed (e.g. Superpowers 7.0.2 in Claude Code, or another coding agent) cannot run
`sdd task set` to report progress. Research (a) running a published npm package with `npx` /
`npm exec` (pinning, Windows behaviour, offline/first-run cost, the install confirmation prompt and
how `--yes` avoids it); (b) whether the `sdd` npm package from CHG-002 is published on the npm
registry and under which name; (c) prior art: how other spec-driven or agent workflow tools
(GitHub Spec Kit, Kiro, Superpowers, Taskmaster) let implementers update task status without the
authoring tool. Serves defect D-035 and C001-REQ-617 in CHG-005. The note does not decide the fix.

## Method
- Repository first: `.sdd/registry.json` (CHG-001 defect D-035, lines 385-393),
  `.sdd/005-0-1-1-fixes/00-ideation/questions-log.md`, `.sdd/_living/CAP-cli-distribution.md`
  (C002-REQ-501, -502, -512, -518), `plugins/architect/templates/lite/20-plan/handoff.md`.
  The text of C001-REQ-617 itself was not opened; its content is taken from the D-035 summary.
- (a) npm: npm CLI v11 documentation pages for `npx`, `npm exec` and `config`, fetched. No named
  third-party library is involved, so no Context7 call was made (npm is the tool, not a
  library under study; its official documentation was fetched directly).
- (b) The npm registry metadata (`registry.npmjs.org`), fetched.
- (c) Web search, then primary pages: Spec Kit `implement.md` command template and repository
  page, Taskmaster README, Superpowers skill files, Kiro documentation. DeepWiki was not used;
  the raw files were read directly, which answered the question.
- Not done: no command was executed (no shell tool in this session), so the `npx` command lines
  below are taken from the documentation and were not run on Windows.

Repository context (local files read 2026-11-17, high confidence; not research findings, so no web
URL): (1) `.sdd/_living/CAP-cli-distribution.md`: the name `architect-sdd` and the executable `sdd`
match C002-REQ-501 and C002-REQ-502 (version equal to the plugin's), templates shipped inside the
package by C002-REQ-512, and the shipped templates already name the bare `sdd` instead of the plugin
path (C002-REQ-518). (2) `plugins/architect/templates/lite/20-plan/handoff.md` lines 20-23 still say
`node <plugin-root>/scripts/sdd.mjs`, the text D-035 targets. (3) The same hand-off already holds a
"Frontmatter fallback" (lines 26-27): when the CLI cannot be run, edit the task file's frontmatter
`status` and fill `report.commit`, `report.completed_at`, `report.notes`. (4) `.sdd/registry.json`
D-035: the Superpowers 7.0.2 implementer could not run `sdd task set` and left the status `todo`;
why the fallback was not used is not recorded.

## Findings

### (b) The package on the registry
- The package `architect-sdd` (unscoped) exists on the npm registry; `latest` is 0.1.0. Versions
  listed: `0.0.0-stage` (placeholder, published 2026-11-15T23:04:56Z) and `0.1.0` (published
  2026-11-15T23:08:05Z). Maintainer `jlacube`. — sources:
  https://registry.npmjs.org/architect-sdd (2026-11-17) — confidence: high (primary registry
  record, read today).
- Version 0.1.0 declares two executables: `"bin": {"sdd": "scripts/sdd.mjs", "sdd-mcp":
  "scripts/sdd-mcp.mjs"}`, `engines: {"node": ">=20"}`, no `dependencies`, no `scripts`
  (no install-time lifecycle scripts), license MIT, 63 files, 1,699,762 bytes unpacked. —
  sources: https://registry.npmjs.org/architect-sdd/0.1.0 (2026-11-17) — confidence: high
  (primary registry record; the fields absent from the answer, e.g. `repository`, were not
  verified as absent in the raw JSON, only as not returned by the fetch summary).

### (a) `npx` / `npm exec`
- A package that is not a local dependency is installed into a folder in the npm cache, and that
  folder is put on the `PATH` of the executed command. Version pinning is `npx <pkg>@<version>`
  (a specifier is matched exactly against a local dependency; otherwise the registry is used). —
  sources: https://docs.npmjs.com/cli/v11/commands/npx (2026-11-17) — confidence: high (official
  npm CLI v11 documentation).
- Executable inference: with a single `bin` entry (or aliases of one command) npm runs it; with
  several entries it runs the one matching the unscoped package name; otherwise it exits with an
  error and `--package` must name the package explicitly. `architect-sdd` has two entries, `sdd`
  and `sdd-mcp`, and neither is named `architect-sdd`, so `npx architect-sdd@0.1.0 task set …`
  would fail. The form that works by the documented rules is
  `npx --yes --package architect-sdd@0.1.0 sdd task set …` or
  `npm exec --yes --package=architect-sdd@0.1.0 -- sdd task set …`. — sources:
  https://docs.npmjs.com/cli/v11/commands/npx, https://docs.npmjs.com/cli/v11/commands/npm-exec
  (2026-11-17) — confidence: medium (documented rule applied to the registry's bin map; the command
  line was not run).
- Argument pass-through: with the `npx` binary all npm flags must come before the positional
  arguments; with `npm exec`, `--` stops npm from parsing later switches, so the CLI's own
  options (`--status`, `--commit`, `--note`) reach `sdd`. — sources:
  https://docs.npmjs.com/cli/v11/commands/npx (2026-11-17) — confidence: high (documented, with an
  example).
- Install confirmation prompt: npm prints a prompt before installing a package that is not a local
  dependency; `-y` / `--yes` accepts it, `--no` declines it. The `yes` config is documented as
  "Automatically answer 'yes' to any prompts that npm might print on the command line". The
  `npm exec` page states the prompt is skipped, with `--yes` assumed, when stdin is not a TTY or a
  CI environment is detected. An agent's shell tool normally has no TTY, but this was not tested
  here, so an explicit `--yes` is the safe form. — sources:
  https://docs.npmjs.com/cli/v11/commands/npx, https://docs.npmjs.com/cli/v11/commands/npm-exec,
  https://docs.npmjs.com/cli/v11/using-npm/config (2026-11-17) — confidence: high (official
  documentation of the flag and the non-TTY rule; behaviour inside a given agent's shell was not
  tested and is not claimed).
- Offline and first-run cost: the first run downloads the tarball from the registry into the npm
  cache (here 63 files, about 1.7 MB unpacked, no dependencies, no install scripts); later runs of
  the same pinned version can use the cache. `--offline` fails with an error for a package not in
  the cache; `--prefer-offline` skips staleness checks but still fetches missing data. Defaults:
  `fetch-timeout` 5 minutes, `fetch-retries` 2. So a first run needs registry access, and a
  sandboxed or offline agent environment cannot use this route. Actual first-run duration was not
  measured. — sources: https://docs.npmjs.com/cli/v11/commands/npm-exec,
  https://docs.npmjs.com/cli/v11/using-npm/config, https://registry.npmjs.org/architect-sdd/0.1.0
  (2026-11-17) — confidence: high (official documentation of the cache and offline rules; the
  duration was not measured and is not claimed).
- Prerequisite: Node.js 20 or later (the package's `engines`), plus npm on the `PATH`. The
  implementer's machine needs both; the plugin route needs Node too (`node <plugin-root>/…`). —
  sources: https://registry.npmjs.org/architect-sdd/0.1.0 (2026-11-17) — confidence: high
  (registry `engines` field read today).
- Windows: the npm documentation pages contain no Windows-specific guidance. Secondary sources
  report that in PowerShell the `npx.ps1`/`npm.ps1` launchers can be blocked by the execution
  policy ("running scripts is disabled on this system"), that the `.cmd` launcher is not subject to
  the policy (`npx.cmd`), and that the usual fix is `Set-ExecutionPolicy -Scope CurrentUser
  -ExecutionPolicy RemoteSigned`. Whether an agent's shell tool hits this depends on the shell it
  starts (PowerShell, cmd or Git Bash); not tested. — sources:
  https://learn.microsoft.com/en-us/answers/questions/5870152/how-can-the-error-message-below-be-fixed,
  https://www.mintlify.com/KarChunT/karchunt.com/blog/fix-powershell-npm-execution-policy
  (2026-11-17; both known only from search-result snippets, the pages were not opened) —
  confidence: low (secondary sources, snippets only, no test on this repository).

### (c) Prior art
- GitHub Spec Kit: the `implement` command template tells the agent to mark each completed task
  as `[X]` in `tasks.md` ("IMPORTANT For completed tasks, make sure to mark the task off as [X]
  in the tasks file"); no CLI or script is called for this; the only script in the template is the
  prerequisite check run at the start. The `specify` CLI is used for setup (`uv tool install
  specify-cli`, `specify init`), and the repository page says the skills run in the agent's chat.
  So the pattern is plain file edits by the implementer. — sources:
  https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/implement.md,
  https://github.com/github/spec-kit (2026-11-17) — confidence: medium (primary file, but read
  through a summarising fetch tool, and the absence of any other status path is inferred).
- Superpowers: `executing-plans` keeps progress in a ledger file `<workspace>/progress.md` with
  one completion line per task ("Track progress in a ledger file, not only in todos") and reads the
  plan file only; the plan format from `writing-plans` uses `- [ ]` checkbox steps. The repository
  page lists installs for many agent harnesses and no CLI that implementers must run. So a
  Superpowers implementer follows its own skills (ledger, todos), not the Architect hand-off's
  `sdd` commands, unless the hand-off tells it what to do in tool-neutral terms. — sources:
  https://raw.githubusercontent.com/obra/superpowers/main/skills/executing-plans/SKILL.md,
  https://raw.githubusercontent.com/obra/superpowers/main/skills/writing-plans/SKILL.md,
  https://github.com/obra/superpowers (2026-11-17) — confidence: medium (primary files, read
  through a summarising fetch tool; the file version at `main` today, not 7.0.2).
- Taskmaster (`task-master-ai`): the documented route is a CLI or MCP tool, not file edits. The
  README gives `npm install -g task-master-ai`, a local `npx task-master init`, and an MCP config
  with `"command": "npx", "args": ["-y", "task-master-ai"]`; Claude Code: `claude mcp add
  taskmaster-ai -- npx -y task-master-ai`. Status is updated through the `set_task_status` MCP tool
  or `task-master set-status --id=<id> --status=<status>` (the CLI form comes from community
  mirrors of an older version, 0.17.1 and 0.18.1; the README fetched today does not list it). Its
  pattern is "published npm package, run with `npx -y`, pin optional". — sources:
  https://raw.githubusercontent.com/eyaltoledano/claude-task-master/main/README.md (2026-11-17),
  https://glama.ai/mcp/servers/@eyaltoledano/claude-task-master/tools/set_task_status,
  https://app.unpkg.com/task-master-ai@0.17.1/files/scripts/modules/task-manager/set-task-status.js
  (2026-11-17; the last two from search results only) — confidence: low (the `npx -y` and MCP
  tool points come from the primary README, but the `set-status` CLI syntax comes from mirrors of
  old versions; rated by the weakest part).
- Kiro: the official documentation says `tasks.md` has a task-execution interface showing
  real-time status ("Tasks are updated as in-progress or completed") on IDE, CLI and Web, and does
  not say whether the agent edits the file or a tool does. Community skills built on Kiro's format
  (cc-sdd, Microck's kiro-skill) say the agent changes `- [ ]` to `- [x]` in `tasks.md`; this is
  not from Kiro's own documentation. No separate CLI for implementers was found. — sources: https://kiro.dev/docs/specs/
  (2026-11-17); community claim from search result
  https://tessl.io/registry/skills/github/gotalab/cc-sdd/kiro-impl (2026-11-17, snippet only) —
  confidence: low (official page silent on the mechanism; community source only).
- Across the four: none of them requires the authoring tool to be installed in the implementer's
  environment for the status update. Three keep status in a plain file the agent edits (Spec Kit
  checkboxes, Kiro checkboxes, Superpowers ledger/checkboxes); one (Taskmaster) ships a published
  npm tool run with `npx -y`. — sources:
  https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/implement.md,
  https://raw.githubusercontent.com/obra/superpowers/main/skills/executing-plans/SKILL.md,
  https://raw.githubusercontent.com/eyaltoledano/claude-task-master/main/README.md,
  https://kiro.dev/docs/specs/ (2026-11-17) — confidence: low (an inference across sources of
  differing strength; the Kiro part rests on a community claim).

## Confidence
Overall: high on (b), because the registry record was read today; high on the npm documentation
points (prompt, `--yes`, cache, offline, `--package` rule); medium on the exact command line
(derived from documentation, not run); low on Windows behaviour in an agent shell and on Kiro's
mechanism. What would raise it: run `npx --yes --package architect-sdd@0.1.0 sdd --version` and a
`sdd task set` in a clean Windows directory from cmd, PowerShell and Git Bash (also with no
network after the first run), and read the Kiro task-runner pages and the Spec Kit tasks template.

## Implications
- The published package makes an `npx`-style reporting route possible without the plugin; the
  `--package` form is required because `architect-sdd` has two bins and none is named like the
  package (a bare `npx architect-sdd` would fail). This is the main trap for the hand-off text.
- A route needs three things at the implementer's machine: Node 20 or later, registry access on
  the first run (and again for each new pinned version), and a version that exists on the
  registry. The version must follow the plugin version (C002-REQ-502 equal versions; C002-REQ-509
  exact match on the generated targets), so the hand-off wording needs the version of the plugin
  that generated it, and each release of Architect needs a publish to the registry before its
  hand-offs are usable (P-01 publishes, C002-REQ-502). 0.1.0 is published; 0.1.1 is not yet.
- The route differs by target: shipped templates in `architect-sdd` already say bare `sdd`
  (C002-REQ-518), which presumes a global install; the plugin's templates say the plugin path.
  A single hand-off wording that works for both is a design question for the plan, not settled here.
- The frontmatter fallback already exists in the hand-off and matches the prior-art pattern of
  Spec Kit and Kiro (agent edits the file). Whether a plain edit is equivalent to `sdd task set`
  (registry counts, report timestamps, lint) was not checked; if the fallback is promoted to a
  first-class path, that equivalence needs a check against the CLI source and `sdd lint`.
- Options this opens for the conductor's options analysis (not decided here): pinned `npx` /
  `npm exec` line in the hand-off; keep the plugin path and make the frontmatter fallback
  first-class; both with a rule for choosing; a vendored script in the repository. None of these
  was evaluated for cost here. IDs affected: D-035, C001-REQ-617, C001-IF-01 hand-off wording,
  C002-REQ-518 (shipped templates), C002-REQ-502/509 (version match).

## Conflicting evidence
- Kiro: the official page is silent on who updates status, while community skills say the agent
  edits checkboxes. Weighed in favour of the official page for what is documented (a product
  feature updates the status) and treated the community claim as low confidence.
- Taskmaster `set-status` CLI: the old-version mirrors list it, today's README does not. Treated as
  possibly renamed or moved to the docs site (the docs URL `docs.task-master.dev/docs/command-reference`
  returned 404 today).
- Otherwise none found.

## Follow-up questions
- Does `npx --yes --package architect-sdd@<v> sdd task set …` work as written from Git Bash,
  PowerShell and cmd on Windows 11, with no TTY, and how long does the first run take? (Needs a
  shell; not available to this researcher.)
- Is a frontmatter edit of a task file equivalent to `sdd task set` for `sdd status`, `sdd lint`,
  the registry task counts and the plan-phase approval hash? (Cartographer or CLI source.)
- What does the Superpowers 7.0.2 implementer do with a hand-off that names a command it cannot
  run (C001-T-074 dogfood record)? Read that record for the exact failure.
