---
id: C002-CAP-05
artifact: spec/requirements
change: CHG-002
phase: 10-spec
status: draft
capability: "CLI distribution, allowlist and doctor"
---
# C002-CAP-05 — Requirements

Brownfield change: every requirement carries a Delta. C002-REQ-503 is the only Claude Code behaviour
CHG-002 changes (C002-GOAL-05); C002-REQ-504 to C002-REQ-507 make CHG-001's doctor requirements
host-dependent and keep today's behaviour on Claude Code. LINT-DELTA-001 findings on the MODIFIED
entries are expected until CHG-001 is archived (C002-CON-05, C002-DEC-008).

### C002-REQ-501 — `sdd` executable from npm
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE `architect-sdd` package SHALL install an executable named `sdd` that runs the sdd CLI built from the same source and version as the bundled `scripts/sdd.mjs`.
- **Rationale:** C002-DEC-007; C002-GOAL-04; today `package.json` is private and has no `bin` (current-state E-3); the Claude Code plugin keeps its bundled copy
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
- **Statement:** WHEN the doctor command runs, THE conductor SHALL print a table with, for each of node, git, the host it runs on (Claude Code, OpenCode, or VS Code with GitHub Copilot Chat), ripwire, Serena, ast-grep, Context7, DeepWiki and, on a generated target, the sdd CLI, its status (ok, missing, unreachable, error or untested), version, fallback and, for rows other than ok, the install or fix command from the doctor remedies table (C001-IF-10 §3).
- **Rationale:** C002-US-503; on Claude Code the rows are those of today (C002-GOAL-05); status `untested`: C002-REQ-508
- **Stories:** C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-504.1
- **Evidence:** missing — no cartographer entry covers the doctor (`plugins/architect/commands/doctor.md`); to be added to `../../10-context/current-state.md`

### C002-REQ-505 — Doctor failure conditions
- **Delta:** MODIFIED C001-REQ-1111
- **Pattern:** unwanted-behaviour
- **Statement:** IF an optional tool is missing or a remote MCP server is unreachable, THEN THE conductor SHALL report it in the doctor table and complete the doctor run, reporting failure only when node is missing or older than version 20, or when the sdd CLI is not reachable on a generated target.
- **Rationale:** on a generated target no agent works without the sdd CLI (C002-GOAL-04); under sdd MCP server enforcement an unreachable CLI also leaves the conductor without a command tool
- **Stories:** C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-505.1
- **Evidence:** missing — no cartographer entry covers the doctor's outcome line (`plugins/architect/commands/doctor.md`); to be added to `../../10-context/current-state.md`

### C002-REQ-506 — Minimum Claude Code version on Claude Code only
- **Delta:** MODIFIED C001-REQ-1123
- **Pattern:** complex
- **Statement:** WHILE the conductor runs on Claude Code, IF the Claude Code version reported by `claude --version` is lower than 2.1.295, THEN THE conductor SHALL show Claude Code with status `error` and the update command from C001-IF-10 §3 in the doctor table.
- **Rationale:** on a generated target the host row replaces the Claude Code row (C002-REQ-504) and the tested version applies (C002-REQ-508); the minimum version is unchanged
- **Stories:** C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-506.1
- **Evidence:** missing — no cartographer entry covers the doctor's Claude Code check (`plugins/architect/commands/doctor.md`); to be added to `../../10-context/current-state.md`

### C002-REQ-507 — Toolchain record per host
- **Delta:** MODIFIED C001-REQ-115
- **Pattern:** event-driven
- **Statement:** WHEN the baseline survey of the init command or of the doctor command completes, THE cartographer SHALL write `_constitution/toolchain.md` listing for each of node, git, the host it runs on, ripwire, Serena, ast-grep, Context7, DeepWiki and, on a generated target, the sdd CLI: detected (yes/no), version, path or endpoint, and the fallback in use.
- **Rationale:** same rows as the doctor table (C002-REQ-504); unchanged on Claude Code
- **Stories:** C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-507.1
- **Evidence:** missing — no cartographer entry covers the toolchain record (`plugins/architect/commands/doctor.md` step 2, `plugins/architect/commands/init.md`); to be added to `../../10-context/current-state.md`

### C002-REQ-508 — Untested host version
- **Delta:** ADDED
- **Pattern:** complex
- **Statement:** WHILE the conductor runs on a generated target, IF the detected host version differs from the tested version recorded for that target in the doctor remedies table, THEN THE conductor SHALL show the host row with status `untested` and the tested version in its fix column.
- **Rationale:** Q-versions-01 (spec round 1): "Pin spike-tested versions" — the tested version is the host version recorded by the spike that validated the target, shown by the doctor and re-checked before each release (C002-REQ-621); `untested` is a warning, not a failure (C002-REQ-505)
- **Stories:** C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-508.1
- **Open items:** how the doctor reads the OpenCode, VS Code and GitHub Copilot Chat versions without widening the Claude Code allowlist beyond C002-REQ-503 is settled in the architecture step.

### C002-REQ-509 — sdd CLI of another version
- **Delta:** ADDED
- **Pattern:** complex
- **Statement:** WHILE the conductor runs on a generated target, IF the version of the reachable sdd CLI differs from the version of the target package [NEEDS CLARIFICATION: Q-cli-03], THEN THE conductor SHALL show the sdd CLI row with status `error` and the install command for the target package's version.
- **Rationale:** edge case of C002-US-501 (target package and installed `architect-sdd` of different versions); the generated agent bodies and the sdd MCP server tools must match the CLI they call
- **Stories:** C002-US-501, C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-509.1

### C002-REQ-510 — Disabled hooks reported under the hooks fallback
- **Delta:** ADDED
- **Pattern:** complex
- **Statement:** WHERE the Copilot hooks fallback is used, WHEN the doctor command runs in VS Code, THE conductor SHALL show a Copilot hooks row with status `error` when hooks are disabled by `chat.useHooks`, Workspace Trust or an organisation policy, and status `ok` otherwise.
- **Rationale:** C002-DEC-005 (Consequences: the doctor reads the VS Code settings, not a hook, which could not report its own absence)
- **Stories:** C002-US-503, C002-US-303
- **Priority:** Must
- **Acceptance:** C002-AC-510.1
- **Open items:** how the doctor detects each disabling source is open for spike S-08 (ideation §11).
