---
id: C002-CAP-05
artifact: spec/requirements
change: CHG-002
phase: 10-spec
status: draft
capability: "CLI distribution, allowlist and doctor"
---
# C002-CAP-05 — Requirements

Brownfield change: every requirement carries a Delta. C002-REQ-503 and C002-REQ-517 are the only
Claude Code behaviours CHG-002 changes (C002-GOAL-05, widened by Q-guards-04); C002-REQ-504 to
C002-REQ-507 make CHG-001's doctor requirements host-dependent and keep today's behaviour on Claude Code. LINT-DELTA-001 findings on the MODIFIED
entries are expected until CHG-001 is archived (C002-CON-05, C002-DEC-008).

### C002-REQ-501 — `sdd` executable from npm
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE `architect-sdd` package SHALL install an executable named `sdd` that runs the sdd CLI built from the same source and version as the bundled `scripts/sdd.mjs`.
- **Rationale:** C002-DEC-007; C002-GOAL-04; today `package.json` is private and has no `bin` (current-state E-3); the Claude Code plugin keeps its bundled copy; the files the CLI reads beside its bundle are shipped by C002-REQ-512
- **Stories:** C002-US-501
- **Priority:** Must
- **Acceptance:** C002-AC-501.1

### C002-REQ-502 — npm package written by packaging
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN `npm run package` runs, THE build SHALL write an npm package tarball named `architect-sdd`, unscoped, whose version equals the version of the source plugin.
- **Rationale:** Q-cli-02 (spec round 1, `../../questions-log.md`): "architect-sdd, unscoped"; P-01 publishes it (`../../10-context/stakeholders-and-personas.md`, P-01); the version is read from `plugin.json` today (current-state E-1)
- **Stories:** C002-US-501
- **Priority:** Must
- **Acceptance:** C002-AC-502.1
- **Open items:** publishing to the npm registry is P-01's manual step; the name's availability stays C002-AS-05.

### C002-REQ-503 — Allowlist with a bare `sdd` command and `node --version`
- **Delta:** MODIFIED C001-REQ-1106
- **Pattern:** event-driven
- **Statement:** WHEN an Architect agent requests a Bash or PowerShell command, THE bash guard SHALL allow it only if it matches an entry of the allowlist in C001-IF-07 §3, in which the sdd CLI entry also accepts a bare `sdd …` command and the tool-versions entry also accepts `node --version`, and deny it otherwise with rule `GUARD-BASH-001`.
- **Rationale:** C002-DEC-007 (Consequences); C002-GOAL-04, C002-GOAL-05; closes D-011 of CHG-001 once implemented. Scope of the D-011 fix (ideation §11, owner spec-writer): `node --version` only, because every other probe already uses `--version`; `node -v` stays. A bare `sdd` runs the `sdd` that PATH resolves, the same trust as the `git` and `ripwire` entries. C001-REQ-1107 applies unchanged, so `sdd status > file` stays denied. The rows "sdd CLI" and "tool versions" of C001-IF-07 §3 and the `ALLOWED` message change with it (current-state §2 item 5)
- **Stories:** C002-US-502
- **Priority:** Must
- **Acceptance:** C002-AC-503.1
- **Evidence:** current-state E-5 — `src/hooks/guard-bash.ts:119` › `sddCli` (accepts only `node <path>/sdd.mjs` or the plugin-root literal; a bare `sdd` is denied with `GUARD-BASH-001`; layer: serena); current-state E-6 — `src/hooks/guard-bash.ts:133` › `VERSION_PROBES` (`node -v` only; layer: grep)

### C002-REQ-504 — Doctor table per host
- **Delta:** MODIFIED C001-REQ-1110
- **Pattern:** event-driven
- **Statement:** WHEN the doctor command runs, THE conductor SHALL print a table with, for each of node, git, the host it runs on (Claude Code, OpenCode, or VS Code with GitHub Copilot Chat), ripwire, Serena, ast-grep, Context7, DeepWiki and, on a generated target, the sdd CLI, its status (ok, missing, unreachable, error or untested), version (for VS Code with GitHub Copilot Chat: the VS Code version and the GitHub Copilot Chat version), fallback and, for rows other than ok, the install or fix command from the doctor remedies table (C001-IF-10 §3).
- **Rationale:** C002-US-503; on Claude Code the rows are those of today (C002-GOAL-05); status `untested`: C002-REQ-508; both versions are pinned for Copilot VS Code (glossary: tested version), so the host row shows both (C002-IF-006 §2)
- **Stories:** C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-504.1
- **Evidence:** current-state E-14 — `plugins/architect/commands/doctor.md:17` › `Report` (columns Tool, Status, Version, Fallback, Fix; eight tools; no host or sdd CLI row; layer: grep); current-state E-15 — `plugins/architect/commands/doctor.md:29` › `Install / fix command` (remedies table; layer: grep); current-state E-23 — `src/hooks/guard-bash.ts:133` › `VERSION_PROBES` (probes the Claude Code doctor needs; layer: grep)

### C002-REQ-505 — Doctor failure conditions
- **Delta:** MODIFIED C001-REQ-1111
- **Pattern:** unwanted-behaviour
- **Statement:** IF an optional tool is missing or a remote MCP server is unreachable, THEN THE conductor SHALL report it in the doctor table and complete the doctor run, reporting failure only when node is missing or older than version 20, or when the sdd CLI is not reachable on a generated target.
- **Rationale:** on a generated target no agent works without the sdd CLI (C002-GOAL-04); under sdd MCP server enforcement an unreachable CLI also leaves the conductor without a command tool
- **Stories:** C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-505.1
- **Evidence:** current-state E-16 — `plugins/architect/commands/doctor.md:24` › `Outcome` (failure only when node is missing or older than 20; three outcome lines; no sdd CLI condition; layer: grep)

### C002-REQ-506 — Minimum Claude Code version on Claude Code only
- **Delta:** MODIFIED C001-REQ-1123
- **Pattern:** complex
- **Statement:** WHILE the conductor runs on Claude Code, IF the Claude Code version reported by `claude --version` is lower than 2.1.295, THEN THE conductor SHALL show Claude Code with status `error` and the update command from C001-IF-10 §3 in the doctor table.
- **Rationale:** on a generated target the host row replaces the Claude Code row (C002-REQ-504) and the tested version applies (C002-REQ-508); the minimum version is unchanged
- **Stories:** C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-506.1
- **Evidence:** current-state E-17 — `plugins/architect/commands/doctor.md:21` › `Claude Code` (`error` below 2.1.295 from `claude --version`, unconditional today; layer: grep); current-state E-18 — `src/` › - (no code enforces the version, the prompt alone does; layer: grep)

### C002-REQ-507 — Toolchain record per host
- **Delta:** MODIFIED C001-REQ-115
- **Pattern:** event-driven
- **Statement:** WHEN the baseline survey of the init command or of the doctor command completes, THE cartographer SHALL write `_constitution/toolchain.md` listing for each of node, git, the host it runs on, ripwire, Serena, ast-grep, Context7, DeepWiki and, on a generated target, the sdd CLI: detected (yes/no), version, path or endpoint, and the fallback in use.
- **Rationale:** same rows as the doctor table (C002-REQ-504); unchanged on Claude Code
- **Stories:** C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-507.1
- **Evidence:** current-state E-19 — `plugins/architect/commands/doctor.md:11` › `Probe` (cartographer writes `toolchain.md`, eight rows; layer: grep); current-state E-20 — `plugins/architect/commands/init.md:13` › `step 3` (toolchain record always written; layer: grep); current-state E-21 — `plugins/architect/skills/code-discovery/SKILL.md:94` › `Toolchain record` (row set and columns; layer: grep)

### C002-REQ-508 — Untested host version
- **Delta:** ADDED
- **Pattern:** complex
- **Statement:** WHILE the conductor runs on a generated target, IF a detected host version (the OpenCode version; in VS Code, the VS Code version or the GitHub Copilot Chat version) differs from its tested version recorded for that target in the doctor remedies table, THEN THE conductor SHALL show the host row with status `untested` and the tested versions in its fix column.
- **Rationale:** Q-versions-01 (spec round 1): "Pin spike-tested versions" — the tested version is the host version recorded by the spike that validated the target, shown by the doctor and re-checked before each release (C002-REQ-621); for Copilot VS Code both versions are pinned, so a difference in either one is untested; `untested` is a warning, not a failure (C002-REQ-505)
- **Stories:** C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-508.1
- **Open items:** settled in C002-IF-006 §2: the doctor reads the OpenCode, VS Code and GitHub Copilot Chat versions through the sdd CLI (C002-IF-007, `host-version`), so the allowlist stays as C002-REQ-503 sets it.

### C002-REQ-509 — sdd CLI of another version
- **Delta:** ADDED
- **Pattern:** complex
- **Statement:** WHILE the conductor runs on a generated target, IF the version of the reachable sdd CLI is not equal to the version of the target package in its major, minor and patch numbers, THEN THE conductor SHALL show the sdd CLI row with status `error` and the install command for the target package's version.
- **Rationale:** Q-cli-03 (spec round 2, `../../questions-log.md`): "Exact match"; edge case of C002-US-501 (target package and installed `architect-sdd` of different versions); the generated agent bodies and the sdd MCP server tools must match the CLI they call
- **Stories:** C002-US-501, C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-509.1

### C002-REQ-510 — Disabled hooks reported under the hooks fallback
- **Delta:** ADDED
- **Pattern:** complex
- **Statement:** WHERE the Copilot hooks fallback is used, WHEN the doctor command runs in VS Code, THE conductor SHALL show a Copilot hooks row with status `ok` only when it reads that hooks are enabled, and with status `error` when hooks are disabled by `chat.useHooks`, Workspace Trust or an organisation policy or when it cannot read the hooks state.
- **Rationale:** C002-DEC-005 (Consequences: the doctor reads the VS Code settings, not a hook, which could not report its own absence); a hooks state the doctor cannot read is shown as `error`, never as `ok`, so an unread state is not reported as protected (C002-IF-006 §2, `hooks unknown`)
- **Stories:** C002-US-503, C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-510.1
- **Open items:** how the doctor detects each disabling source is open for spike S-08 (ideation §11).

### C002-REQ-511 — Bare version from `sdd --version`
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN `sdd --version` runs, THE sdd CLI SHALL print its version as a bare semantic version (`<major>.<minor>.<patch>`) on one line and exit with code 0.
- **Rationale:** the doctor compares the reachable CLI with the target package version (C002-REQ-509, C002-IF-006 §2), the server test tells its own CLI from a PATH `sdd` by this output (C002-TS-409), and the install test compares both executables (C002-TS-501); C002-TS-515 relies on it as well; today only `sdd version` exists and prints `architect-plugin@<semver>`, which stays (`src/cli/commands.ts:508`; C001-IF-01); contract C002-IF-007
- **Stories:** C002-US-501
- **Priority:** Must
- **Acceptance:** C002-AC-511.1

### C002-REQ-512 — Templates and the Serena read-only mode file in `architect-sdd`
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE `architect-sdd` package SHALL contain every template of the source plugin's `templates/` folder and the source plugin's Serena read-only mode file.
- **Rationale:** without `CLAUDE_PLUGIN_ROOT` the CLI looks up templates in the folder above its bundle (`src/workspace/templates.ts:33`; current-state E-7), so `sdd change new` (C002-TS-502) and `sdd template show` fail on the generated targets without them (C002-IF-003 §1); `sdd serena-launch` takes the read-only mode file from beside the CLI (C002-IF-007; C002-REQ-114); C002-REQ-412 and C002-REQ-501 cover the executables only
- **Stories:** C002-US-504, C002-US-505
- **Priority:** Must
- **Acceptance:** C002-AC-512.1

### C002-REQ-513 — Template lookup through the CLI
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN `sdd template show <profile>/<path>` runs, THE sdd CLI SHALL print the repository's template `.sdd/_templates/<profile>/<path>` if that file exists, and otherwise the template `<profile>/<path>` shipped with the CLI.
- **Rationale:** the generated bodies name templates through this command (C002-REQ-115); the repository override keeps its precedence, as for `sdd change new` (`src/workspace/templates.ts:58`; C001-COMP-13); `<profile>` is `full`, `lite` or `constitution` (C002-IF-007)
- **Stories:** C002-US-504
- **Priority:** Must
- **Acceptance:** C002-AC-513.1

### C002-REQ-514 — Unknown template refused
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd template show` names a path that resolves outside the profile's template folder after normalising `..` segments and links, or a template that exists neither under `.sdd/_templates/` nor among the templates shipped with the CLI, THEN THE sdd CLI SHALL exit with code 2 and error `ERR-CLI-019` naming the profile and the path.
- **Rationale:** C001-NFR-601 (actionable messages); `../../50-interfaces/errors.md` §5 (the fix lists the templates with `sdd template list <profile>`, C002-REQ-520); C002-IF-007 exit codes; a path such as `full/../../package.json` would otherwise print a file of the installed package (C002-TS-522)
- **Stories:** C002-US-504
- **Priority:** Must
- **Acceptance:** C002-AC-514.1

### C002-REQ-515 — Serena data in the per-user data folder
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN `sdd serena-config` or `sdd serena-launch` runs with the option `--user-data`, THE sdd CLI SHALL use the per-user data folder of `architect-sdd` as Serena's data folder.
- **Rationale:** C001-REQ-1013 carried to the generated targets, which cannot rely on `${CLAUDE_PLUGIN_DATA}` (C002-R-001 A-09): Serena's configuration and project data stay outside the repository; the doctor and init commands pass `--user-data` there (C002-REQ-116, C002-IF-006 §4) and so does the Serena launch of the target packages (C002-REQ-114); the folder per operating system is fixed in C002-IF-007; a folder that is relative or inside the current repository is refused (C002-REQ-516); on Claude Code the data-folder argument stays (current-state E-22)
- **Stories:** C002-US-505
- **Priority:** Must
- **Acceptance:** C002-AC-515.1

### C002-REQ-516 — Per-user data folder not determinable, relative or inside the repository
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF the option `--user-data` is given and the per-user data folder cannot be determined, is a relative path, or resolves inside the current repository, THEN THE sdd CLI SHALL exit with code 2 and error `ERR-CLI-020` without writing a Serena configuration or starting Serena.
- **Rationale:** without its configuration Serena writes `<repo>/.serena/` (C001-REQ-1013, spikes S-02 and S-06); a relative `XDG_DATA_HOME` (invalid under the XDG rules) or an environment variable that points into the repository would put Serena's data in the repository, against C002-US-505; C001-NFR-601; `../../50-interfaces/errors.md` §5
- **Stories:** C002-US-505
- **Priority:** Must
- **Acceptance:** C002-AC-516.1

### C002-REQ-517 — Serena commands confined to a data folder outside the repository
- **Delta:** MODIFIED C001-REQ-1106
- **Pattern:** unwanted-behaviour
- **Statement:** IF an Architect agent requests `sdd serena-config` or `sdd serena-launch`, as a bare `sdd` command or through `node <path>/sdd.mjs`, with a data-folder argument other than the option `--user-data` or a folder that resolves outside the current repository, THEN THE bash guard SHALL deny the command with rule `GUARD-BASH-001`.
- **Rationale:** Q-guards-04 (spec round 2, `../../questions-log.md`): "Confine on every host" — the guard core allows these two subcommands only with `--user-data` or a folder outside the repository, and C002-GOAL-05 is widened to cover this Claude Code change. Today the sdd CLI entry of C001-IF-07 §3 accepts any subcommand, so `sdd serena-config src` passes every guard and writes `src/serena/serena_config.yml`, against C002-DEC-001 ("refuses anything outside `.sdd/`") and the ideation §9 risk "a command that writes files". The same guard core decides for the command tool of the sdd MCP server and for the agent-scoped guard hooks (C002-IF-008 §1); the OpenCode `bash` rules follow the allowlist (C002-REQ-207). Serena keeps its project data inside the data folder (C001-REQ-1013), so the data folder decides where `serena-launch` writes. The folder resolves as a write target does for the path guard (`..` segments, case, drive letters, links; C001-REQ-1104). Corpus cases: C002-REQ-607
- **Stories:** C002-US-502, C002-US-505
- **Priority:** Must
- **Acceptance:** `C002-AC-517.1`
- **Evidence:** current-state E-5 — `src/hooks/guard-bash.ts:119` › `sddCli` (any subcommand after `node <path>/sdd.mjs` passes the sdd CLI entry; layer: serena); current-state E-22 — `src/cli/commands.ts:420` › `serenaConfig` (writes `serena/serena_config.yml` under its folder argument, resolved against the working directory at `src/cli/commands.ts:421`; `serenaLaunchCmd` does the same at `src/cli/commands.ts:470`; layer: serena + grep)
- **Open items:** none — how the bash guard resolves the argument `"${CLAUDE_PLUGIN_DATA}"` that the Claude Code doctor and init commands pass (current-state E-22), whose Serena step must keep passing (C002-REQ-623), is settled by C002-IF-008 §1.1.

### C002-REQ-518 — CLI named as `sdd` in the templates of `architect-sdd`
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN `npm run package` writes the `architect-sdd` package, THE build SHALL replace, in each template that the package ships, every invocation of the CLI through its plugin path (`node <plugin-root>/scripts/sdd.mjs …`) with the bare `sdd` command.
- **Rationale:** the hand-off templates `templates/full/20-plan/handoff.md:20-23` and `templates/lite/20-plan/handoff.md:20-23` of the source plugin tell the implementer to run `node <plugin-root>/scripts/sdd.mjs task set …` and `… defect add …`, a path that does not exist on the generated targets (C002-GOAL-03, C002-GOAL-04); the plugin keeps its templates unchanged for Claude Code (C002-GOAL-05); templates shipped by C002-REQ-512 and read through C002-REQ-513
- **Stories:** C002-US-504
- **Priority:** Must
- **Acceptance:** `C002-AC-518.1`

### C002-REQ-519 — Plugin path of the CLI in a shipped template reported
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF a template of the `architect-sdd` package names the CLI through a plugin path (`<plugin-root>/scripts/sdd.mjs` or `${CLAUDE_PLUGIN_ROOT}`), THEN THE build SHALL exit non-zero with a message naming the template, the line and the construct.
- **Rationale:** no check scans the shipped templates today (the target structure checks scan agents, commands or prompt files, skills, configuration and hook files, C002-IF-005 §6); same reason as C002-REQ-602 for the target packages; C001-NFR-601
- **Stories:** C002-US-504
- **Priority:** Must
- **Acceptance:** `C002-AC-519.1`

### C002-REQ-520 — Template list through the CLI
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN `sdd template list <profile>` runs, THE sdd CLI SHALL print, one per line in ascending code-point order and each once, every `<path>` for which `sdd template show <profile>/<path>` prints a template.
- **Rationale:** the fix of ERR-CLI-019 lists the templates with this command (`../../50-interfaces/errors.md` §5; C002-REQ-514); command row in C002-IF-007
- **Stories:** C002-US-504
- **Priority:** Should
- **Acceptance:** `C002-AC-520.1`
