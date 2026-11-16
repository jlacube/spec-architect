---
capability: cli-distribution
inventory_only: false
updated: 2026-11-16
---
# CAP-cli-distribution — Living specification

## Requirements

### C002-REQ-501 — `sdd` executable from npm
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE `architect-sdd` package SHALL install an executable named `sdd` that runs the sdd CLI built from the same source and version as the bundled `scripts/sdd.mjs`.
- **Rationale:** C002-DEC-007; C002-GOAL-04; today `package.json` is private and has no `bin` (current-state E-3); the Claude Code plugin keeps its bundled copy; the files the CLI reads beside its bundle are shipped by C002-REQ-512; both CLIs therefore create the same change files, except the CLI lines of the shipped hand-off templates, which name the bare `sdd` (C002-REQ-518; defect D-008)
- **Stories:** C002-US-501
- **Priority:** Must
- **Acceptance:** C002-AC-501.1

### C002-REQ-502 — npm package written by packaging
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `npm run package` runs, THE build SHALL write an npm package tarball named `architect-sdd`, unscoped, whose version equals the version of the source plugin.
- **Rationale:** Q-cli-02 (spec round 1, `../../questions-log.md`): "architect-sdd, unscoped"; P-01 publishes it (`../../10-context/stakeholders-and-personas.md`, P-01); the version is read from `plugin.json` today (current-state E-1)
- **Stories:** C002-US-501
- **Priority:** Must
- **Acceptance:** C002-AC-502.1
- **Open items:** publishing to the npm registry is P-01's manual step; the name's availability stays C002-AS-05.

### C002-REQ-508 — Untested host version
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** complex
- **Statement:** WHILE the conductor runs on a generated target, IF a detected host version (the OpenCode version; in VS Code, the VS Code version or the GitHub Copilot Chat version) differs from its tested version recorded for that target in the doctor remedies table, THEN THE conductor SHALL show the host row with status `untested` and the tested versions in its fix column.
- **Rationale:** Q-versions-01 (spec round 1): "Pin spike-tested versions" — the tested version is the host version recorded by the spike that validated the target (on Copilot VS Code since revision D-047: the versions of the checklist build, the S-08 record still naming the spike that validated the mode, `host.validated_by`, and the checklist record confirming it on them; critic CR-152), shown by the doctor and re-checked before each release (C002-REQ-621); for Copilot VS Code both versions are pinned, so a difference in either one is untested, and since the revision for defect D-047 they are the versions of the build on which P-01 runs the manual VS Code checklist, VS Code 1.145.2 with GitHub Copilot Chat 0.73.0 (P-01's instruction of 2026-11-10; `../../10-context/scope.md` §3.1), the S-08 record's Insiders versions staying historical evidence; `untested` is a warning, not a failure (C002-REQ-505); the detected version is that of the executable the PATH-only executable lookup finds, so an `opencode` or `code` placed in the adopter's repository never runs during the doctor (C002-CON-17; Q-exec-lookup-01, P-01: "Fix everywhere now (Recommended)"; C002-IF-007 `host-version`, §Executable lookup)
- **Stories:** C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-508.1
- **Open items:** settled in C002-IF-006 §2: the doctor reads the OpenCode, VS Code and GitHub Copilot Chat versions through the sdd CLI (C002-IF-007, `host-version`), so the allowlist stays as C002-REQ-503 sets it.

### C002-REQ-509 — sdd CLI of another version
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** complex
- **Statement:** WHILE the conductor runs on a generated target, IF the version of the reachable sdd CLI is not equal to the version of the target package in its major, minor and patch numbers, THEN THE conductor SHALL show the sdd CLI row with status `error` and the install command for the target package's version.
- **Rationale:** Q-cli-03 (spec round 2, `../../questions-log.md`): "Exact match"; edge case of C002-US-501 (target package and installed `architect-sdd` of different versions); the generated agent bodies and the sdd MCP server tools must match the CLI they call
- **Stories:** C002-US-501, C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-509.1

### C002-REQ-510 — Disabled hooks reported in both Copilot enforcement modes
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** complex
- **Statement:** WHERE the Copilot target uses sdd MCP server enforcement or the Copilot hooks fallback, WHEN the doctor command runs in VS Code, THE conductor SHALL show a Copilot hooks row whose status is `ok` when it reads that `chat.useHooks` is on and `error` when it reads that hooks are disabled or cannot read the hooks state, and whose text for status `ok` states that Workspace Trust and organisation policy were not read and that the manual VS Code checklist confirms them.
- **Rationale:** P-01 decision on defect D-012 (2026-10-19): "ok + caveat (Recommended)". `sdd host-version vscode` reads `chat.useHooks` only, never Workspace Trust or an organisation policy (defect D-012, found in the doctor implementation), so a row that is `ok` only when all three sources are read could never be `ok`; the row is therefore `ok` on `chat.useHooks` alone, and its text names the two sources it did not read, which the manual VS Code checklist records in both Copilot enforcement modes before each release (C002-REQ-616). C002-DEC-005 (Consequences: the doctor reads the VS Code settings, not a hook, which could not report its own absence); the row applies in both Copilot enforcement modes because the Copilot subagent guard hook is a PreToolUse hook in both (C002-REQ-327; C002-IF-008 §2), so with hooks disabled the write and terminal calls of non-Architect subagents are not denied under sdd MCP server enforcement either (C002-US-307); on VS Code 1.145.2, whose PreToolUse hook input carries no `agent_type`, the hook denies none of them even with hooks enabled (defect D-052; the known limitation of C002-REQ-304), and the row stays: the release check requires hooks enabled during the checklist run (C002-REQ-629), the session-start brief and the SubagentStop trace run as hooks (C002-REQ-313, C002-REQ-315), and a VS Code that sends `agent_type` re-enables the denial; under the hooks fallback the Copilot guard hooks of the Architect agents are off as well (C002-REQ-308); a disabled hooks state (`hooks disabled (<source>)`) and a hooks state the doctor cannot read (`hooks unknown`) stay `error`, never `ok`, so an unread state is not reported as protected (C002-IF-006 §2). Restricted-mode rows of C002-TS-516 (Q-checklist-restricted-01, P-01 2026-10-20: "Blocked chat passes (Recommended)"; critic CR-53): when VS Code itself refuses the chat or the doctor prompt in the untrusted workspace, the checklist step of that row passes, with a note quoting what VS Code showed, because the refusal is VS Code's own restricted-mode behaviour and no tool call of the package runs there; when VS Code runs the prompt, the step passes only with the row `ok` and the text of this requirement; before, a blocked chat made the step `failed`, and the release check refused every Copilot release (C002-REQ-618)
- **Stories:** C002-US-503, C002-US-303, C002-US-307
- **Priority:** Must
- **Acceptance:** C002-AC-510.1
- **Open items:** none — the doctor reads `chat.useHooks` only (defect D-012); Workspace Trust and organisation policy are left to the manual VS Code checklist.

### C002-REQ-511 — Bare version from `sdd --version`
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd --version` runs, THE sdd CLI SHALL print its version as a bare semantic version (`<major>.<minor>.<patch>`) on one line and exit with code 0.
- **Rationale:** the doctor compares the reachable CLI with the target package version (C002-REQ-509, C002-IF-006 §2), the server test tells its own CLI from a PATH `sdd` by this output (C002-TS-409), and the install test compares both executables (C002-TS-501); C002-TS-515 relies on it as well; today only `sdd version` exists and prints `architect-plugin@<semver>`, which stays (`src/cli/commands.ts:508`; C001-IF-01); contract C002-IF-007
- **Stories:** C002-US-501
- **Priority:** Must
- **Acceptance:** C002-AC-511.1

### C002-REQ-512 — Templates and the Serena read-only mode file in `architect-sdd`
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE `architect-sdd` package SHALL contain every template of the source plugin's `templates/` folder and the source plugin's Serena read-only mode file.
- **Rationale:** the CLI reads the templates shipped with it from the `templates/` folder above its bundle, and from the plugin root named by `CLAUDE_PLUGIN_ROOT` only when that folder is absent (lookup order: C002-IF-003 §1; defect D-004; before CHG-002 it read the folder above its bundle only when `CLAUDE_PLUGIN_ROOT` was unset, `src/workspace/templates.ts:33`, current-state E-7), so `sdd change new` (C002-TS-502) and `sdd template show` fail on the generated targets without them, and the npm `sdd` started in a Claude Code session reads its own templates, not the plugin's; `sdd serena-launch` takes the read-only mode file from beside the CLI (C002-IF-007; C002-REQ-114); C002-REQ-412 and C002-REQ-501 cover the executables only
- **Stories:** C002-US-504, C002-US-505
- **Priority:** Must
- **Acceptance:** C002-AC-512.1

### C002-REQ-513 — Template lookup through the CLI
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd template show <profile>/<path>` runs, THE sdd CLI SHALL print the repository's template `.sdd/_templates/<profile>/<path>` if that file exists, and otherwise the template `<profile>/<path>` shipped with the CLI.
- **Rationale:** the generated bodies name templates through this command (C002-REQ-115); the templates shipped with the CLI are found as C002-REQ-512 states; the repository override keeps its precedence, as for `sdd change new` (`src/workspace/templates.ts:58`; C001-COMP-13); `<profile>` is `full`, `lite` or `constitution` (C002-IF-007)
- **Stories:** C002-US-504
- **Priority:** Must
- **Acceptance:** C002-AC-513.1

### C002-REQ-514 — Unknown template refused
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd template show` names a path that resolves outside the profile's template folder after normalising `..` segments and links, or a template that exists neither under `.sdd/_templates/` nor among the templates shipped with the CLI, THEN THE sdd CLI SHALL exit with code 2 and error `ERR-CLI-019` naming the profile and the path.
- **Rationale:** C001-NFR-601 (actionable messages); `../../50-interfaces/errors.md` §5 (the fix lists the templates with `sdd template list <profile>`, C002-REQ-520); C002-IF-007 exit codes; a path such as `full/../../package.json` would otherwise print a file of the installed package (C002-TS-522)
- **Stories:** C002-US-504
- **Priority:** Must
- **Acceptance:** C002-AC-514.1

### C002-REQ-515 — Serena data in the per-user data folder
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd serena-config` or `sdd serena-launch` runs with the option `--user-data`, THE sdd CLI SHALL use the per-user data folder of `architect-sdd` as Serena's data folder.
- **Rationale:** C001-REQ-1013 carried to the generated targets, which cannot rely on `${CLAUDE_PLUGIN_DATA}` (C002-R-001 A-09): Serena's configuration and project data stay outside the repository; the doctor and init commands pass `--user-data` there (C002-REQ-116, C002-IF-006 §4) and so does the Serena launch of the target packages (C002-REQ-114); the folder per operating system is fixed in C002-IF-007; a folder that is relative or inside the current repository is refused (C002-REQ-516); on Claude Code the data-folder argument stays (current-state E-22). Known platform condition, no behaviour of the sdd CLI (defect D-013 item 7): under MSIX AppData redirection (glossary), a per-user data folder that the sdd CLI writes on Windows from a session started by the Claude desktop app lands in that package's `LocalCache`, so OpenCode or VS Code started outside the package does not see it; the sdd CLI resolves the folder the same way in both cases
- **Stories:** C002-US-505
- **Priority:** Must
- **Acceptance:** C002-AC-515.1

### C002-REQ-516 — Per-user data folder not determinable, relative or inside the repository
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the option `--user-data` is given and the per-user data folder cannot be determined, is a relative path, or resolves inside the current repository, THEN THE sdd CLI SHALL exit with code 2 and error `ERR-CLI-020` without writing a Serena configuration or starting Serena.
- **Rationale:** without its configuration Serena writes `<repo>/.serena/` (C001-REQ-1013, spikes S-02 and S-06); a relative `XDG_DATA_HOME` (invalid under the XDG rules) or an environment variable that points into the repository would put Serena's data in the repository, against C002-US-505; C001-NFR-601; `../../50-interfaces/errors.md` §5. A folder moved by MSIX AppData redirection (known platform condition, C002-REQ-515 rationale; defect D-013 item 7) is neither relative nor inside the repository, so this requirement does not refuse it
- **Stories:** C002-US-505
- **Priority:** Must
- **Acceptance:** C002-AC-516.1

### C002-REQ-517 — Serena commands confined to a data folder outside the repository
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF an Architect agent requests `sdd serena-config` or `sdd serena-launch`, as a bare `sdd` command or through `node <path>/sdd.mjs`, with a data-folder argument other than the option `--user-data` or a folder that resolves outside the current repository, THEN THE bash guard SHALL deny the command with rule `GUARD-BASH-001`.
- **Rationale:** Q-guards-04 (spec round 2, `../../questions-log.md`): "Confine on every host" — the guard core allows these two subcommands only with `--user-data` or a folder outside the repository, and C002-GOAL-05 is widened to cover this Claude Code change. The delta is ADDED: the rule narrows the sdd CLI entry of C001-REQ-1106 without restating it, and C002-REQ-503 is the single MODIFIED delta of C001-REQ-1106, which `sdd archive` replaces once (critic CR-24). Today the sdd CLI entry of C001-IF-07 §3 accepts any subcommand, so `sdd serena-config src` passes every guard and writes `src/serena/serena_config.yml`, against C002-DEC-001 ("refuses anything outside `.sdd/`") and the ideation §9 risk "a command that writes files". The same guard core decides for the command tool of the sdd MCP server and for the agent-scoped guard hooks (C002-IF-008 §1); the OpenCode `bash` rules follow the allowlist (C002-REQ-207). Serena keeps its project data inside the data folder (C001-REQ-1013), so the data folder decides where `serena-launch` writes. The folder resolves as a write target does for the path guard (`..` segments, case, drive letters, links; C001-REQ-1104). Corpus cases: C002-REQ-607
- **Stories:** C002-US-502, C002-US-505
- **Priority:** Must
- **Acceptance:** C002-AC-517.1
- **Evidence:** current-state E-5 — `src/hooks/guard-bash.ts:119` › `sddCli` (any subcommand after `node <path>/sdd.mjs` passes the sdd CLI entry; layer: serena); current-state E-22 — `src/cli/commands.ts:420` › `serenaConfig` (writes `serena/serena_config.yml` under its folder argument, resolved against the working directory at `src/cli/commands.ts:421`; `serenaLaunchCmd` does the same at `src/cli/commands.ts:470`; layer: serena + grep)
- **Open items:** none — how the bash guard resolves the argument `"${CLAUDE_PLUGIN_DATA}"` that the Claude Code doctor and init commands pass (current-state E-22), whose Serena step must keep passing (C002-REQ-623), is settled by C002-IF-008 §1.1.

### C002-REQ-518 — CLI named as `sdd` in the templates of `architect-sdd`
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `npm run package` writes the `architect-sdd` package, THE build SHALL replace, in each template that the package ships, every invocation of the CLI through its plugin path (`node <plugin-root>/scripts/sdd.mjs …`) with the bare `sdd` command.
- **Rationale:** the hand-off templates `templates/full/20-plan/handoff.md:20-23` and `templates/lite/20-plan/handoff.md:20-23` of the source plugin tell the implementer to run `node <plugin-root>/scripts/sdd.mjs task set …` and `… defect add …`, a path that does not exist on the generated targets (C002-GOAL-03, C002-GOAL-04); the plugin keeps its templates unchanged for Claude Code (C002-GOAL-05); templates shipped by C002-REQ-512 and read through C002-REQ-513; these rewritten lines are the only difference between a shipped template and its source (rule of C002-IF-003 §2), so a comparison of the files that the npm `sdd` and the bundled CLI create excepts them (defect D-008)
- **Stories:** C002-US-504
- **Priority:** Must
- **Acceptance:** C002-AC-518.1

### C002-REQ-519 — Plugin path of the CLI in a shipped template reported
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a template of the `architect-sdd` package names the CLI through a plugin path (`<plugin-root>/scripts/sdd.mjs` or `${CLAUDE_PLUGIN_ROOT}`), THEN THE build SHALL exit non-zero with a message naming the template, the line and the construct.
- **Rationale:** no check scans the shipped templates today (the target structure checks scan agents, commands or prompt files, skills, configuration and hook files, C002-IF-005 §6); same reason as C002-REQ-602 for the target packages; C001-NFR-601
- **Stories:** C002-US-504
- **Priority:** Must
- **Acceptance:** C002-AC-519.1

### C002-REQ-520 — Template list through the CLI
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd template list <profile>` runs, THE sdd CLI SHALL print, one per line in ascending code-point order and each once, every `<path>` for which `sdd template show <profile>/<path>` prints a template.
- **Rationale:** the fix of ERR-CLI-019 lists the templates with this command (`../../50-interfaces/errors.md` §5; C002-REQ-514); command row in C002-IF-007
- **Stories:** C002-US-504
- **Priority:** Should
- **Acceptance:** C002-AC-520.1

### C002-REQ-521 — `--cwd` of a writing `sdd` subcommand confined to the repository
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF an Architect agent requests a writing `sdd` subcommand, as a bare `sdd` command or through `node <path>/sdd.mjs`, with the option `--cwd` naming a folder that resolves neither to the repository root nor to a folder under it, THEN THE bash guard SHALL deny the command with rule `GUARD-BASH-001`.
- **Rationale:** Q-guards-05 (spec round 4, `../../questions-log.md`): "Restrict on every host" — "writing commands may use --cwd only when the folder resolves inside the repository root of C002-IF-008 §1.1", which widens C002-GOAL-05 again. `--cwd` is a global option of every subcommand (`src/cli/run.ts:133`), so today `sdd change stop 001 --reason x --cwd <other repository>` or `sdd init --cwd <home folder>` passes the sdd CLI entry of C001-IF-07 §3 and writes another folder's `.sdd/`, a write the path guard refuses when made directly (PG-082, `tests/guards/path-corpus.json:706-708`), against C002-DEC-001 and the ideation §9 risk "a command that writes files" (critic CR-25). The writing subcommands are the rows of C002-IF-008 §1.2; the repository root and the resolution of the folder (`..` segments, case, drive letters, links, as for a write target of the path guard, C001-REQ-1104) are those of C002-IF-008 §1.1. Subcommands that write no file keep `--cwd` unrestricted (BG-019, `tests/guards/bash-corpus.json:157-162`). The same guard core decides for the command tool of the sdd MCP server and for the agent-scoped guard hooks (C002-IF-008 §1); the OpenCode `bash` rules follow the allowlist (C002-REQ-207). The delta is ADDED beside C002-REQ-503, the single MODIFIED delta of C001-REQ-1106. Corpus cases: C002-REQ-607
- **Stories:** C002-US-502
- **Priority:** Must
- **Acceptance:** C002-AC-521.1

### C002-REQ-522 — Context7 and DeepWiki rows from the researcher's probe
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the doctor command runs, THE conductor SHALL show each of the Context7 and DeepWiki rows with status `ok` after a probe call that the researcher made with that server's tools and that succeeded, `unreachable` after such a call that failed, and `untested` when the researcher made no call to that server or reported no outcome for it, each status other than `ok` with its fix from C002-IF-006 §2.
- **Rationale:** defect D-057 (P-01, 2026-11-12: Q-t050-doctor-01 "Fix in 0.1.0 (Recommended)", then Q-t050-doctor-02 "Fix shared source (Recommended)", `../../../20-plan/questions-log.md`); critic CR-186: the rule of the two remote rows is a requirement of its own, beside the table of C002-REQ-504. In the C002-T-050 run of 2026-11-12 (run sheet t050e, candidate e89dae8, VS Code 1.145.2, step VSC-12) the doctor showed Context7 and DeepWiki `unreachable` with the fix "check network" while both servers ran, and stated that no tool of either server was offered in its session, so no probe call was made: the probe step gave the two calls to the cartographer, which holds neither server's tools on any target, Claude Code included, whereas the researcher holds both on every target (Evidence). The researcher therefore makes the two probe calls on every host (C002-IF-006 §2.1), and `unreachable` states that a call was made and failed. A server whose tools the researcher is not offered in the session gets no call, and a hand-back without an outcome for a server shows no call either, so such a row is `untested`, never `unreachable` with the network fix (conductor's decision within P-01's "Fix shared source (Recommended)"). The fix texts are those of C002-IF-006 §2; both statuses are warnings (C002-REQ-505). This changes the doctor on Claude Code too, where both rows were `unreachable` in every run (`.sdd/_constitution/toolchain.md:22-23`: "no (this session)"), as C002-GOAL-05 now states; the toolchain record takes the same probe result (C002-REQ-507)
- **Stories:** C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-522.1
- **Evidence:** current-state E-19 — `plugins/architect/commands/doctor.md:11` › `Probe` (the cartographer loads a Context7 and a DeepWiki tool and makes one small call, `unreachable` when it fails; layer: grep); current-state E-15 — `plugins/architect/commands/doctor.md:29` › `Install / fix command` (one Context7 and one DeepWiki fix, "check network; endpoint …", whatever the cause; layer: grep); `plugins/architect/agents/sdd-cartographer.md:8` › `tools` (no Context7 or DeepWiki tool; layer: grep); `dist/copilot/agents/sdd-cartographer.agent.md:5` › `tools` (`sdd-shell/*`, `read`, `search`, `usages`, `sdd-files/*`, `serena/*`; layer: grep); `plugins/architect/agents/sdd-researcher.md:8` › `tools` (`mcp__plugin_architect_context7__*` and `mcp__plugin_architect_deepwiki__*` tools; layer: grep); `dist/copilot/agents/sdd-researcher.agent.md:5` › `tools` (`context7/*`, `deepwiki/*`; layer: grep); C002-IF-005 §4 (OpenCode and Copilot grants: the researcher's MCP servers context7 and deepwiki, the cartographer's serena)

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
