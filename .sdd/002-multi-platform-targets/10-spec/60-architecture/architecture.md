---
id: C002-SPEC-ARCH
artifact: spec/architecture
change: CHG-002
phase: 10-spec
status: draft
kind: brownfield
---

# C002 — Architecture

Brownfield delta on the CHG-001 architecture (`.sdd/001-architect-agent-suite/10-spec/60-architecture/architecture.md`).
CHG-001 components that CHG-002 changes appear here under a new C002 ID with Status `modified`, the
CHG-001 component they modify and the cartographer's evidence (`../10-context/current-state.md`,
"current-state E-n"; `../../00-ideation/evidence/baseline-survey.md`, "baseline E-n"). Components
of CHG-001 that CHG-002 does not change (workspace, parser/lint/trace, gate, tracking and archive,
templates, specialist agents) keep their C001 IDs and are not repeated. Decisions are those of
C002-DEC-001 … C002-DEC-009; this step adds no ADR (§6.2 lists the design choices it fixes).
Revised for defect D-003: the Copilot target follows the signed-off spike S-08 record
(`docs/spikes/S-08-copilot-vscode.md`, facts F-1 … F-7 of §5); after the critic's D-003 review, the
Copilot subagent guard hook of both modes and its workspace-level placement (CR-37, CR-38;
Q-safety-06, Q-safety-07). Revised for defects D-004 … D-009: the template lookup order of the
shipped CLI, one print form for every code, PLG-VER-001, no variable expansion in the server's
command tool, the further fail-closed denies of the Copilot hook, and the facts of the signed-off
spike S-07 on OpenCode 1.18.31 (`docs/spikes/S-07-opencode.md §9`, F-1 … F-10). Revised for defects
D-010 … D-014 (implementation findings of C002-T-026 … C002-T-058;
`../../20-plan/revision-D010-D014-digest.md`): the doctor's Copilot hooks row `ok` on `chat.useHooks`
with a caveat and the hooks state in the checklist in both Copilot modes (P-01 on D-012), the
wiring anchors and frontmatter constructs as the tables hold them, the install command's refusal of
a package without its CLI copy, the server's guard call without variable expansion, and the
per-mechanism replay expectations that a correct `sdd-mcp-server` and `copilot-hooks` meet with 0
differing (§6.2).

## 1. Context and scope

Architect stays a set of files and a Node.js CLI that runs inside the host's own process tree; it
has no server of its own. CHG-002 adds two hosts. One repository build (`npm run package`) produces
the Claude Code plugin as today, an OpenCode package, a Copilot VS Code package and the npm package
`architect-sdd` (C002-DEC-004, C002-DEC-006, C002-DEC-007).

**System boundary:** the source plugin (`plugins/architect/`, now including `targets/`), the
generator and the checks of the repository, the generated packages under `dist/`, the `architect-sdd`
package (sdd CLI and sdd MCP server) and the verification records under `docs/`.

| Actor / system | Interaction | Trust |
|---|---|---|
| P-01 spec owner | Runs packaging, checks, the manual VS Code checklist and the release check; publishes `architect-sdd`; answers interviews and gates on any host | trusted (sole approver) |
| P-03 adopter | Installs a package and `architect-sdd`, runs `sdd install copilot` in each repository for VS Code, runs the conductor on Claude Code, OpenCode or VS Code | trusted user; its own agents, MCP servers and settings are outside Architect |
| Claude Code | Source target, unchanged except the allowlist rows (C002-REQ-503), the Serena-command confinement (C002-REQ-517) and the `--cwd` confinement of the writing `sdd` subcommands (C002-REQ-521) of the bash guard | platform |
| OpenCode (tested version 1.18.31, spike S-07) | Loads the OpenCode package; enforces `permission` rules under native permission enforcement; starts the sdd MCP server under sdd MCP server enforcement, the provisional mode of the S-07 record | platform; permission engine verified by corpus replay (C002-AS-01, C002-AS-02, partly refuted by the S-07 hand sample, `../10-context/scope.md` §3) |
| VS Code with GitHub Copilot Chat (tested versions; Local session type, local agent host) | Loads the Copilot package's plugin part (prompt files, skills, hooks) once the install has written its manifest; runs the workspace agents of `.github/agents/` as subagents and starts the workspace MCP servers of `.vscode/mcp.json` after a session's first message, both written by the install command; confines agents to their tool lists (C002-AS-03), but offers its host built-in agents beside a parent's `agents` list (S-08 §3); runs plugin-level hooks, and the workspace hook file written by the install command, for every agent's calls, with `agent_type` on subagent calls | platform; verified by spike S-08 §3 (plugin agents and plugin MCP servers are not used, facts F-1, F-2); workspace hook file: assumption of C002-IF-005 §3 |
| Copilot CLI | Eval runner host only (C002-NG-01); loads the package with `--plugin-dir`, names its agents `architect:<agent>` | tool; verified by spike S-08 §2 |
| npm registry | Receives `architect-sdd` from P-01; serves it to P-03 | service |
| Repository source, web, MCP results | Read by agents | **untrusted content** (C002-NFR-203) |

**Trust boundaries:** (1) agent ↔ content (data, never instructions); (2) agent ↔ file system and
shell — enforced per target by the enforcement mechanism of its mode, never by instructions alone
(C002-CON-03); (3) agent ↔ gate — only P-01's choice through the host question tool approves
(C002-INV-09); (4) Architect ↔ the adopter's own agents and files — the OpenCode package sets no
permission for other agents (C002-REQ-208); the Copilot package's one PreToolUse hook passes every
call of the session agent (C002-REQ-320, C002-REQ-330) and, outside repositories with `.sdd/`, every
call of the adopter's subagents (C002-REQ-329); in a repository with `.sdd/` it lets a subagent that
is not an Architect agent, host built-in agents included, call read-only tools only (C002-REQ-327,
C002-REQ-328; the cost P-01 accepted in Q-safety-06 and Q-safety-07); the install command replaces no
agent file, hook file or MCP server entry it did not write (C002-REQ-324) and is never run by an
Architect agent (C002-REQ-325).

## 2. Component catalogue

### C002-COMP-001 — Target generator
- **Name:** Target generator (`scripts/generate.mjs` and `scripts/generate/`: source reader, translator, OpenCode emitter, Copilot emitter, writer)
- **Status:** new
- **Responsibility:** read the source plugin once into the neutral model, translate it with each target's mapping table and variants, write every selected target package with its generation manifest, or none on any error
- **Realizes:** C002-REQ-101, C002-REQ-102, C002-REQ-103, C002-REQ-104, C002-REQ-105, C002-REQ-106, C002-REQ-107, C002-REQ-108, C002-REQ-109, C002-REQ-111, C002-REQ-112, C002-REQ-114, C002-REQ-115, C002-REQ-116, C002-REQ-117, C002-REQ-118, C002-REQ-216, C002-REQ-317, C002-REQ-321, C002-REQ-326; C002-NFR-103, C002-NFR-301
- **Interfaces:** provides C002-IF-004; reads C002-IF-001; writes C002-IF-005
- **Depends on:** C002-COMP-002, C002-COMP-017
- **Owned data:** generation run, diagnostics, generation manifests, staging folders under `dist/`

### C002-COMP-002 — Mapping tables and wiring variants
- **Name:** `plugins/architect/targets/` (`opencode.json`, `copilot.json`, `<target>/wiring/*.md`, `<target>/install.md`)
- **Status:** new
- **Responsibility:** hold, per generated target, the enforcement mode, tested versions, model tiers, tool grants, MCP servers, construct detectors (frontmatter constructs included), wiring variants (the anchors of C002-IF-001 §2.1) and the install-notes source that the generator, the target structure checks and the release check read
- **Realizes:** C002-REQ-103, C002-REQ-105, C002-REQ-111, C002-REQ-113, C002-REQ-114, C002-REQ-116, C002-REQ-117, C002-REQ-118, C002-REQ-508
- **Interfaces:** C002-IF-001
- **Depends on:** spike records S-07 and S-08 (C002-IF-009 §3)
- **Owned data:** mapping tables, wiring variants, install-notes sources

### C002-COMP-003 — OpenCode target package
- **Name:** `dist/opencode/` (`.opencode/agents`, `.opencode/commands`, `.opencode/skills`, `opencode.json`, optional quick-lint plugin, `INSTALL.md`, manifest)
- **Status:** new
- **Responsibility:** run the Architect agents in OpenCode with the boundary of its enforcement mode: per-agent `permission` rules (native) or the sdd MCP server (server), each Architect agent with a closed tool set (catch-all off, derived tools on); commands named `architect-<name>`; Serena read-only with per-user data (context `ide`); interviews and gates through `question`, which the conductor alone is allowed (OpenCode denies it by default in SDK and server sessions, S-07 fact F-6)
- **Realizes:** C002-REQ-114, C002-REQ-201, C002-REQ-202, C002-REQ-203, C002-REQ-204, C002-REQ-206, C002-REQ-207, C002-REQ-208, C002-REQ-209, C002-REQ-210, C002-REQ-215, C002-REQ-216, C002-REQ-217
- **Interfaces:** C002-IF-005 §2; declares C002-IF-002
- **Depends on:** C002-COMP-006 (`sdd`, `sdd-mcp` on PATH), C002-COMP-005 (server mode)
- **Owned data:** generated files only

### C002-COMP-004 — Copilot target package
- **Name:** `dist/copilot/`: plugin part (`agents/*.agent.md`, `prompts/*.prompt.md`, `skills/`, `hooks/tool-classes.json`, `scripts/sdd.mjs` copy; `plugin.json` and `hooks.json` written at install) and install sources (`install/plugin.json`, `install/mcp.json`, `install/hooks.template.json`), `INSTALL.md`, manifest
- **Status:** new
- **Responsibility:** run the Architect agents in VS Code as workspace agents, installed by `sdd install copilot`, with no generic edit or terminal tool and the sdd MCP servers as workspace MCP servers (server mode), or with generic tools decided by the Copilot guard hook keyed by `agent_type` and a conductor without generic tools (hooks fallback); in both modes declare one PreToolUse entry, the Copilot subagent guard hook, which the install writes into the package's `hooks.json` and into the workspace hook file beside the agents, and the tool classes file it reads; become a loadable plugin only when the install has written its manifest and hooks file; carry the plugin agents that Copilot CLI loads for the eval runner; prompt files named `<name>.prompt.md`; Serena read-only with per-user data; session-start brief and trace refresh hooks whose commands reach the CLI copy by an absolute path written at install; interviews and gates through `ask_user`
- **Realizes:** C002-REQ-114, C002-REQ-301, C002-REQ-302, C002-REQ-303, C002-REQ-304, C002-REQ-306, C002-REQ-307, C002-REQ-308, C002-REQ-313, C002-REQ-314, C002-REQ-315, C002-REQ-316, C002-REQ-317, C002-REQ-318, C002-REQ-321, C002-REQ-326, C002-REQ-327
- **Interfaces:** C002-IF-005 §3; declares C002-IF-002 (workspace MCP configuration); hook commands of C002-IF-008 §2–§4; installed by `install copilot` of C002-IF-007
- **Depends on:** C002-COMP-006, C002-COMP-005 (server profiles), C002-COMP-012 (through the CLI copy), C002-COMP-018 (install command)
- **Owned data:** generated files only; `plugin.json` and `hooks.json` written into the package folder at install

### C002-COMP-005 — sdd MCP server
- **Name:** `src/mcp/` bundled to `scripts/sdd-mcp.mjs` of `architect-sdd`; profiles `files` and `shell`
- **Status:** new
- **Responsibility:** write and edit files under `.sdd/` (profile `files`) and run allowlisted commands (profile `shell`) for agents without generic tools, without a shell and so without variable expansion (`sdd` as its own package's CLI; the guard call does not expand `${CLAUDE_PLUGIN_DATA}` either, C002-IF-002 §5.2), listing only the tools of its profile, deciding every call with the guard cores, failing closed, and returning quick-lint findings with each write
- **Realizes:** C002-REQ-401, C002-REQ-402, C002-REQ-403, C002-REQ-404, C002-REQ-405, C002-REQ-406, C002-REQ-407, C002-REQ-408, C002-REQ-409, C002-REQ-410, C002-REQ-411, C002-REQ-415; C002-NFR-101, C002-NFR-102, C002-NFR-204, C002-NFR-205
- **Interfaces:** C002-IF-002
- **Depends on:** C002-COMP-012 (guard cores, tokeniser), C002-COMP-018 (its own `sdd` entry), C001-COMP-04 (quick lint), C001-COMP-03 (workspace lookup)
- **Owned data:** none persistent; the session's repository root

### C002-COMP-006 — `architect-sdd` npm package
- **Name:** staging folder `dist/npm/architect-sdd/` and tarball `dist/architect-sdd-<version>.tgz`
- **Status:** new
- **Responsibility:** carry the `sdd` and `sdd-mcp` executables, the templates (CLI lines written as `sdd`) and the Serena read-only mode file to the generated targets, with license and notices, without runtime dependencies
- **Realizes:** C002-REQ-412, C002-REQ-414, C002-REQ-501, C002-REQ-502, C002-REQ-512; C002-NFR-401, C002-NFR-402, C002-NFR-801
- **Interfaces:** C002-IF-003
- **Depends on:** C002-COMP-013 (build and staging), C002-COMP-005, C002-COMP-018
- **Owned data:** manifest, bundled entries, copies of templates and notices

### C002-COMP-007 — Target structure checks
- **Name:** `scripts/check/targets/*.mjs`, a new step of `scripts/check.mjs`
- **Status:** new
- **Responsibility:** generate the packages into a temporary folder and check them against the target package contracts (TGT-* codes, including the Serena declaration and the tool classes file), check the tarball, and check the agent, command and skill files of the source plugin for variant leaks (PLG-VAR-001)
- **Realizes:** C002-REQ-110, C002-REQ-113, C002-REQ-114, C002-REQ-318, C002-REQ-601, C002-REQ-602, C002-REQ-603, C002-REQ-604, C002-REQ-605; C002-NFR-104
- **Interfaces:** C002-IF-005 §6
- **Depends on:** C002-COMP-001, C002-COMP-002
- **Owned data:** none (findings printed)

### C002-COMP-008 — Corpus replay suite
- **Name:** `tests/replay/` with one adapter per mechanism (OpenCode permission rules, sdd MCP server, Copilot guard hooks)
- **Status:** new
- **Responsibility:** feed every applicable case of the path and shell corpora to each enforcement mechanism in use, as the input C002-IF-009 §2.2 maps it to (a case with a `cwd` other than the repository root through its own `cwd`), with the expectation of that mechanism (cases without a `cwd` or a tool name fed as malformed calls and `deny`; unknown `architect:sdd-*` callers `allow` on OpenCode; memory cases `deny`; write-tool cases of the shell corpus `deny`; on the server, Serena commands with the literal `${CLAUDE_PLUGIN_DATA}` and cases whose `cwd` reaches the repository through a link `deny`; identity cases on OpenCode only), read ERR-MCP-003 as the server's `allow`, feed Copilot hook input under the hook names of the classes file, replay a case that requires a host capability with its own input on a fixture built with that capability (`error` on a replay host that lacks it), report the decisions that differ, record the replay host with its capabilities, and list the cases not replayed; on OpenCode, start the pinned host binary of the tested version with a database of its own and no network at start, and give every Edit case a fixture file whose text the call names (C002-IF-009 §2.2, C002-IF-010 §4)
- **Realizes:** C002-REQ-606, C002-REQ-625, C002-REQ-626, C002-REQ-627, C002-REQ-630, C002-REQ-632, C002-REQ-633; C002-NFR-201, C002-NFR-202
- **Interfaces:** C002-IF-009 §2 (replay report)
- **Depends on:** C002-COMP-013 (corpora), C002-COMP-005, C002-COMP-012, C002-COMP-003, C002-COMP-004, C002-COMP-006
- **Owned data:** replay reports

### C002-COMP-009 — Eval runners for the generated targets
- **Name:** `evals/harness/runners/opencode.mjs`, `evals/harness/runners/copilot-cli.mjs`, stub runner; host selection in `runSession`
- **Status:** new
- **Responsibility:** run the existing eval cases on OpenCode and Copilot CLI through the unchanged case API, within the turn and spend caps, and produce the injection summaries; for OpenCode, start the pinned host binary of the tested version with a database of its own and answer `question` calls through the SDK (C002-IF-010 §4); for Copilot CLI, install a copy of the Copilot package into the case workspace, give the session the sdd MCP servers of its workspace MCP configuration and name agents `architect:<agent>`
- **Realizes:** C002-REQ-608, C002-REQ-609, C002-REQ-610, C002-REQ-611, C002-REQ-612; C002-NFR-105, C002-NFR-203
- **Interfaces:** C002-IF-010; C002-IF-009 (injection summary); calls `install copilot` of C002-IF-007
- **Depends on:** C002-COMP-003, C002-COMP-004, C002-COMP-002 (name mapping), C002-COMP-013 (existing harness), C002-COMP-018 (install command)
- **Owned data:** eval results per target, injection summaries

### C002-COMP-010 — Release check
- **Name:** `scripts/release-check.mjs` and release records under `docs/releases/`
- **Status:** new
- **Responsibility:** decide, per generated target and independently of the other, whether a package may be released, from regeneration, replay (completeness of the not-applicable list, the expected decision of every case, and a replay host with every capability the corpora's cases require), injection, checklist (hooks state in both Copilot modes, injection steps under the hooks fallback) and spike evidence at the tested versions (a closed OpenCode tool set included, ERR-REL-013), and write the release record
- **Realizes:** C002-REQ-617, C002-REQ-618, C002-REQ-619, C002-REQ-620, C002-REQ-621, C002-REQ-622, C002-REQ-629, C002-REQ-634; C002-NFR-501
- **Interfaces:** C002-IF-009 §5
- **Depends on:** C002-COMP-001, C002-COMP-002, C002-COMP-008, C002-COMP-009, C002-COMP-011
- **Owned data:** release records

### C002-COMP-011 — Manual VS Code checklist
- **Name:** `docs/checklists/vscode-copilot.md` and records under `docs/checklists/records/`
- **Status:** new
- **Responsibility:** verify by hand what no script can drive in VS Code (boundary, interview, gate with a skipped answer through `ask_user`, recording its input shape and no-choice result, toy change to G1 on a fresh install through `sdd install copilot` with the assumptions of C002-IF-005 §3, an edit delegated to the host built-in agent `general-purpose` and denied by the Copilot subagent guard hook, Revise at G1 and the revise prompt, the hooks state in both Copilot modes with its three sources `chat.useHooks`, Workspace Trust and organisation policy, the last two being those the doctor does not read, a guard-hook denial under the hooks fallback, injection cases when Copilot CLI cannot load the package and always under the hooks fallback) and keep one record per run, with the hooks state and its sources
- **Realizes:** C002-REQ-613, C002-REQ-614, C002-REQ-615, C002-REQ-616, C002-REQ-628; C002-NFR-601
- **Interfaces:** C002-IF-009 §4
- **Depends on:** C002-COMP-004
- **Owned data:** checklist, checklist records

### C002-COMP-012 — Hooks and guards (modified)
- **Name:** `src/hooks/` (guard-path, guard-bash, session-start, post-write, new host adapter) and `hooks/hooks.json`
- **Status:** modified
- **Modifies:** C001-COMP-08
- **Responsibility:** as in CHG-001, plus: the bash guard accepts a bare `sdd …` and `node --version`, denies `sdd install` in every form (C002-IF-008 §1.2), confines `sdd serena-config` and `sdd serena-launch` to `--user-data` or a data folder outside the repository on every host (C002-IF-008 §1.1), and allows `--cwd` on a writing `sdd` subcommand only with a folder at or under the repository root on every host (C002-IF-008 §1.2); the path guard core takes a memory-folder option (off for the generated targets); a Copilot host adapter (`hook guard --host copilot --mode …`) decides Copilot hook input by caller and mode: the session agent's calls pass; in both modes, a non-Architect subagent's call in a repository with `.sdd/` is denied for a write or terminal tool (GUARD-HOOK-002), allowed for a read-only tool and denied for an unclassed tool, and passes outside such repositories (the Copilot subagent guard hook); an Architect agent's call passes under server enforcement and is decided by the guard cores under the hooks fallback (read-only tools allowed, unclassed tools denied); plus briefs and trace refreshes; every fault is a deny decision with exit 2
- **Realizes:** C002-REQ-503, C002-REQ-517, C002-REQ-521, C002-REQ-308, C002-REQ-309, C002-REQ-313, C002-REQ-314, C002-REQ-315, C002-REQ-319, C002-REQ-320, C002-REQ-325, C002-REQ-327, C002-REQ-328, C002-REQ-329, C002-REQ-330; C002-NFR-201, C002-NFR-202, C002-NFR-204
- **Interfaces:** C002-IF-008; C001-IF-07
- **Depends on:** C001-COMP-03, C001-COMP-04
- **Owned data:** none
- **Evidence:** current-state E-5 (`src/hooks/guard-bash.ts:119` › `sddCli()`, layer: serena: a bare `sdd` is denied with GUARD-BASH-001, and any subcommand after `node <path>/sdd.mjs` passes); current-state E-22 (`src/cli/commands.ts:420` › `serenaConfig()`, layer: serena: the data folder is written as given, so `sdd serena-config src` writes into the repository); current-state E-6 (`src/hooks/guard-bash.ts:133` › `VERSION_PROBES`, layer: grep: `node -v` only); current-state E-4 (`src/hooks/guard-path.ts:18` › `WRITE_TOOLS`, layer: serena: memory folder at l.56); baseline E-13 (`src/cli/commands.ts:427` › `guardPath()`, layer: serena: the four hook entry points); critic CR-25 evidence, re-read for C002-REQ-521 (`src/cli/run.ts:133` › `execute()`, layer: read: the global `--cwd` of every subcommand is resolved against the CLI's working folder; `src/cli/run.ts:33` › `findCommand()`: the subcommand is the first word, or the first two for a group)

### C002-COMP-013 — Build and check tooling (modified)
- **Name:** `package.json` scripts, `scripts/build.mjs`, `scripts/package.mjs`, `scripts/check.mjs` and `scripts/check/`, `tests/` (including the guard corpora), `evals/`, `bench/`
- **Status:** modified
- **Modifies:** C001-COMP-12
- **Responsibility:** as in CHG-001, plus: bundle the two `architect-sdd` entries with the license check over both; run the generator in `npm run package` and in `npm run check`; stage and pack `architect-sdd`, translating the CLI lines of the staged templates and failing on a plugin path left in them (ERR-BLD-002), each build error printed as `<code>: <message>`; check that the root `package.json` carries the plugin version (PLG-VER-001); leave `targets/` out of the Claude Code staging; extend the corpora with the cases of the new risks and one case per writing sdd subcommand (C002-IF-008 §1.2); keep the regression set green
- **Realizes:** C002-REQ-101, C002-REQ-413, C002-REQ-502, C002-REQ-518, C002-REQ-519, C002-REQ-601, C002-REQ-607, C002-REQ-623; C002-NFR-801
- **Interfaces:** C001-IF-08 §3 (plus PLG-VAR-001 and PLG-VER-001, C002-IF-005 §6); calls C002-IF-004
- **Depends on:** C002-COMP-001, C002-COMP-007, C002-COMP-017, C002-COMP-018, C002-COMP-005
- **Owned data:** `tests/` (guard corpora included), `evals/`, `bench/`, `dist/` staging
- **Evidence:** current-state E-8 (`scripts/check/lib.mjs:10` › `context()`, layer: grep: checks read only `plugins/architect/` and two CHG-001 folders; six steps in `check.mjs`); current-state E-1 (`scripts/package.mjs:33`, layer: grep: Claude-only staging and INSTALL.md); current-state E-2 (`scripts/build.mjs:15`, layer: grep: one bundle, `scripts/` emptied); current-state E-3 (`package.json:4`, layer: grep: private, no `bin`)

### C002-COMP-014 — Conductor (modified)
- **Name:** `sdd-conductor` agent with its phase skills, on every host
- **Status:** modified
- **Modifies:** C001-COMP-01
- **Responsibility:** as in CHG-001, plus: ask through the host's question tool in rounds of at most four, with OpenCode's header and description rules; treat a result without a choice as no answer; refuse to ask when VS Code lacks `ask_user`, naming the tool and the install-notes step; on Copilot run as the session agent, load the deferred sdd MCP server tools through `tool_search_tool`; run the doctor with the host rows of C002-IF-006
- **Realizes:** C002-REQ-211, C002-REQ-212, C002-REQ-213, C002-REQ-214, C002-REQ-311, C002-REQ-312, C002-REQ-504, C002-REQ-505, C002-REQ-506, C002-REQ-508, C002-REQ-509, C002-REQ-510
- **Interfaces:** C001-IF-05, C001-IF-13, C002-IF-006
- **Depends on:** C002-COMP-016, C002-COMP-018
- **Owned data:** questions logs, gate-log entries (through the CLI), as in CHG-001
- **Evidence:** current-state E-24 (`plugins/architect/agents/sdd-conductor.md:7` › `tools`, layer: grep: AskUserQuestion granted); current-state E-25 (`plugins/architect/agents/sdd-conductor.md:61` › `Hard rules`, layer: grep: approval only after the AskUserQuestion answer)

### C002-COMP-015 — Commands (modified)
- **Name:** `commands/*.md` (`/architect:*` on Claude Code; `architect-<command>` on OpenCode; prompt files on Copilot)
- **Status:** modified
- **Modifies:** C001-COMP-09
- **Responsibility:** as in CHG-001; the doctor command gains host-dependent rows, probes and outcome through wiring variants (on Copilot a Copilot hooks row that is `ok` on `chat.useHooks` and names Workspace Trust and organisation policy as not read), and its description names the target's rows through the frontmatter construct `doctor-description`; command bodies and descriptions keep their Claude Code text, translated per target by the generator
- **Realizes:** C002-REQ-213, C002-REQ-504, C002-REQ-505, C002-REQ-506, C002-REQ-507, C002-REQ-508, C002-REQ-509, C002-REQ-510
- **Interfaces:** C001-IF-10, C002-IF-006
- **Depends on:** C002-COMP-014, C002-COMP-016
- **Owned data:** none
- **Evidence:** current-state E-14 (`plugins/architect/commands/doctor.md:17` › `Report`, layer: grep: eight rows, no host or sdd CLI row); current-state E-16 (`plugins/architect/commands/doctor.md:24` › `Outcome`, layer: grep); current-state E-28 (`plugins/architect/commands/new.md:14` › `step 3`, layer: grep: profile round; `archive.md:15` names AskUserQuestion)

### C002-COMP-016 — Skills library (modified)
- **Name:** `skills/*/SKILL.md`
- **Status:** modified
- **Modifies:** C001-COMP-10
- **Responsibility:** as in CHG-001; the toolchain record of code-discovery becomes host-dependent through a wiring variant; the "Claude Code wiring" sections stay the Claude Code text, their variants live in `targets/` (C002-CON-10)
- **Realizes:** C002-REQ-507, C002-REQ-111, C002-REQ-113
- **Interfaces:** C001-IF-09 (`skills` field); anchors of C002-IF-001
- **Depends on:** C001-COMP-13
- **Owned data:** none
- **Evidence:** current-state E-21 (`plugins/architect/skills/code-discovery/SKILL.md:94` › `Toolchain record`, layer: grep); current-state E-26 (`plugins/architect/skills/interview-protocol/SKILL.md:119` › `Claude Code wiring`, layer: grep); current-state E-27 (`plugins/architect/skills/gate-protocol/SKILL.md:87` › `Claude Code wiring`, layer: grep)

### C002-COMP-017 — Plugin package and configuration (modified)
- **Name:** `plugins/architect/` manifests, `agents/`, `.mcp.json`, README, LICENSE, notices, and the new `targets/` folder
- **Status:** modified
- **Modifies:** C001-COMP-11
- **Responsibility:** as in CHG-001; hosts `targets/` (C002-COMP-002); the README gains the OpenCode and Copilot VS Code sections with the enforcement mode and, under the hooks fallback, the warning
- **Realizes:** C002-REQ-205, C002-REQ-305, C002-REQ-310
- **Interfaces:** C001-IF-08, C001-IF-09
- **Depends on:** C002-COMP-002
- **Owned data:** plugin files
- **Evidence:** current-state E-10 (`plugins/architect/.mcp.json:11` › `serena`, layer: grep: Claude spelling of the Serena launch); current-state E-13 (`scripts/check/layout.mjs:6` › `PATHS`, layer: grep: layout pinned, 10 `sdd-*.md` agents)

### C002-COMP-018 — CLI front-end (modified)
- **Name:** `src/cli.ts`, `src/cli/commands.ts` → bundled `scripts/sdd.mjs` (plugin) and `scripts/sdd.mjs` of `architect-sdd`
- **Status:** modified
- **Modifies:** C001-COMP-07
- **Responsibility:** as in CHG-001, plus `--version`, `host-version` (the hooks line from `chat.useHooks` only), `template show|list` (confined to the profile's template folder, listed in code-point order; the shipped templates taken from the folder above the running bundle, and from `CLAUDE_PLUGIN_ROOT` only when that folder has no `templates/`, C002-IF-003 §1), `--user-data` (refused when not determinable, relative or inside the repository) and `--read-only` for the Serena commands, the `--host copilot` hook commands, and the Copilot install command `install copilot` (the guard hook first, in the package's `hooks.json` and the workspace hook file `.github/hooks/architect-guard.json`, with the absolute CLI path; the package's `plugin.json`; then the workspace agents, the `.vscode/mcp.json` merge and the install record; refusal on adopter files, and on a package that lacks a source file, its CLI copy `scripts/sdd.mjs` included); one source for the plugin bundle and the npm executable
- **Realizes:** C002-REQ-114, C002-REQ-322, C002-REQ-323, C002-REQ-324, C002-REQ-326, C002-REQ-327, C002-REQ-407, C002-REQ-501, C002-REQ-508, C002-REQ-509, C002-REQ-511, C002-REQ-513, C002-REQ-514, C002-REQ-515, C002-REQ-516, C002-REQ-520
- **Interfaces:** C001-IF-01, C002-IF-007
- **Depends on:** C001-COMP-03, C001-COMP-04, C001-COMP-05, C001-COMP-06, C002-COMP-012
- **Owned data:** none
- **Evidence:** current-state E-22 (`src/cli/commands.ts:420` › `serenaConfig()`, layer: serena: data folder taken as an argument); baseline E-14 (`src/workspace/templates.ts:32` › `defaultPluginRoot()`, layer: grep: templates resolved beside the bundle when `CLAUDE_PLUGIN_ROOT` is unset)

## 3. Runtime flows

| Flow | Steps | Realizes |
|---|---|---|
| F1 | Generation and packaging: build, Claude Code staging, generation of both targets, npm staging with the template CLI-line translation and scan, and pack | C002-REQ-101, C002-REQ-102, C002-REQ-104, C002-REQ-112, C002-REQ-412, C002-REQ-502, C002-REQ-512, C002-REQ-518, C002-REQ-519; C002-TS-101, C002-TS-102, C002-TS-103, C002-TS-104, C002-TS-106, C002-TS-108, C002-TS-119, C002-TS-417, C002-TS-503, C002-TS-519, C002-TS-529, C002-TS-530 |
| F2 | OpenCode write and command through the native permission rules, with the optional quick-lint feedback | C002-REQ-206, C002-REQ-207, C002-REQ-215; C002-TS-207, C002-TS-209, C002-TS-222, C002-TS-223 |
| F3 | Copilot write through the sdd MCP server (`sdd-files`, a workspace MCP server started after the session's first message, its tools deferred), including the server's start and end | C002-REQ-307, C002-REQ-401 … C002-REQ-404, C002-REQ-408 … C002-REQ-411; C002-TS-401, C002-TS-402, C002-TS-404, C002-TS-405, C002-TS-410, C002-TS-413, C002-TS-414, C002-TS-415 |
| F4 | Copilot command through the sdd MCP server (`sdd-shell`) | C002-REQ-405, C002-REQ-406, C002-REQ-407; C002-TS-406, C002-TS-407, C002-TS-408, C002-TS-409 |
| F5 | Copilot PreToolUse hook, both modes: the same entry, loaded from the package's `hooks.json` and the workspace hook file, reads `agent_type`; passes the session agent's calls; for a non-Architect subagent (a host built-in agent such as `general-purpose` that the conductor started) denies write and terminal calls and unclassed tools in a repository with `.sdd/`, allows read-only tools, and passes every call elsewhere; passes an Architect agent's calls under server enforcement and decides its edit, terminal or read call under the hooks fallback; a deny is a deny decision with exit 2, which Copilot CLI turns into a fail-closed hook error | C002-REQ-308, C002-REQ-309, C002-REQ-319, C002-REQ-320, C002-REQ-321, C002-REQ-327, C002-REQ-328, C002-REQ-329, C002-REQ-330; C002-TS-311, C002-TS-312, C002-TS-313, C002-TS-314, C002-TS-333, C002-TS-337, C002-TS-338 |
| F6 | Copilot session-start brief and SubagentStop trace refresh, through hook commands with the absolute CLI path written at install | C002-REQ-313, C002-REQ-314, C002-REQ-315, C002-REQ-316, C002-REQ-326; C002-TS-320, C002-TS-322, C002-TS-323, C002-TS-324, C002-TS-325 |
| F7 | Gate through the host question tool on a generated target (`question` on OpenCode, allowed for the conductor; `ask_user` on Copilot) | C002-REQ-211, C002-REQ-212, C002-REQ-217, C002-REQ-311, C002-REQ-312; C002-TS-217, C002-TS-218, C002-TS-316, C002-TS-318, C002-TS-319 |
| F8 | Doctor on a generated target | C002-REQ-504, C002-REQ-505, C002-REQ-508, C002-REQ-509, C002-REQ-510; C002-TS-506, C002-TS-509, C002-TS-513, C002-TS-515, C002-TS-516 |
| F9 | Release check of one generated target | C002-REQ-617 … C002-REQ-622, C002-REQ-629, C002-REQ-634; C002-TS-620, C002-TS-621, C002-TS-622, C002-TS-623, C002-TS-624, C002-TS-625, C002-TS-633 |
| F10 | `npm run check` with the target structure checks | C002-REQ-601 … C002-REQ-605; C002-TS-601, C002-TS-602, C002-TS-603, C002-TS-604, C002-TS-605 |
| F11 | Corpus replay of one enforcement mechanism, with per-mechanism expectations (malformed calls, unknown `architect:sdd-*` callers on OpenCode, memory cases), the case's own `cwd`, cases that require a host capability, and the not-applicable list | C002-REQ-606, C002-REQ-625, C002-REQ-626, C002-REQ-627, C002-REQ-630, C002-REQ-632, C002-REQ-633; C002-TS-608, C002-TS-609, C002-TS-628, C002-TS-629, C002-TS-630, C002-TS-631, C002-TS-643, C002-TS-644, C002-TS-645, C002-TS-646, C002-TS-647 |
| F12 | Serena command, or writing `sdd` subcommand with `--cwd`, decided by the bash guard core on every host, then run by the sdd CLI | C002-REQ-517, C002-REQ-521, C002-REQ-515, C002-REQ-516; C002-TS-525, C002-TS-527, C002-TS-528, C002-TS-536, C002-TS-537 |
| F13 | Copilot install: P-03 runs `sdd install copilot` in a repository; the CLI checks the package and every target, then writes the guard hook (the package's `hooks.json`, the workspace hook file), the package's `plugin.json`, the workspace agents, the `.vscode/mcp.json` merge and the install record, in that order, or refuses and writes nothing; an Architect agent's request of the command is denied by the bash guard | C002-REQ-322, C002-REQ-323, C002-REQ-324, C002-REQ-325, C002-REQ-326, C002-REQ-327; C002-TS-341, C002-TS-342, C002-TS-343, C002-TS-344, C002-TS-345, C002-TS-346, C002-TS-347, C002-TS-348, C002-TS-349, C002-TS-350, C002-TS-351, C002-TS-352, C002-TS-353, C002-TS-354, C002-TS-356 |

## 4. Data view

Entities: `../40-domain/domain-model.md`. No new data enters `.sdd/` (C002-NG-03).

| Data | Owner | Store | Retention |
|---|---|---|---|
| Mapping tables, wiring variants, install-notes sources | C002-COMP-002 | `plugins/architect/targets/` (git) | versioned with the source plugin |
| Generation manifests and target packages | C002-COMP-001, C002-COMP-003, C002-COMP-004 | `dist/opencode/`, `dist/copilot/` | rebuilt by every packaging run; never edited (C002-INV-01) |
| `architect-sdd` tarball | C002-COMP-006 | `dist/architect-sdd-<version>.tgz`; npm registry after P-01 publishes | rebuilt per run; published versions are immutable on npm |
| Guard corpora | C002-COMP-013 | `tests/guards/*.json` (git) | versioned; new cases of C002-REQ-607 |
| Replay reports, injection summaries, release records | C002-COMP-008, C002-COMP-009, C002-COMP-010 | `docs/releases/<target>/<version>/` (git) | kept for every proposed release |
| Spike records, checklist and checklist records | implementer in the plan's spike tasks (C002-IF-009 §1), C002-COMP-011 | `docs/spikes/`, `docs/checklists/` (git) | kept |
| Serena data on the generated targets | Serena (external) | per-user data folder of `architect-sdd` (C002-IF-007) | user-managed, never in the repository |
| Copilot workspace files: the ten agents, the workspace hook file `.github/hooks/architect-guard.json`, the Architect server entries of `.vscode/mcp.json`, the install record `.github/architect-install.json`; the package's `plugin.json` and `hooks.json` | written by C002-COMP-018 (`install copilot`) from C002-COMP-004 | the adopter's repository (outside `.sdd/`); the unpacked package folder | P-03's; replaced only by a later install that recognises them through the record (C002-REQ-324); the hook files hold the machine's package path, so the agents, the workspace hook file and the record are kept together in version control or not at all (C002-IF-005 §5) |

Sensitive data: none expected; eval transcripts may contain model output and are kept out of the
packages. Generated files are rebuildable at any commit (C002-NFR-301).

## 5. Deployment view

| Node | Runs | Started by | Lifetime |
|---|---|---|---|
| Maintainer machine (REF-WIN) | build, generator, structure and target checks, corpus replay, eval runners, release check; a corpus replay for a release runs with Developer Mode on or elevated, so that the `file-symlink` capability is present (C002-REQ-634, C002-IF-009 §2.1); the OpenCode replay and the OpenCode eval runner start the pinned OpenCode binary of the tested version by its absolute path with a database of their own, and need Node.js 22.22.2 or later for the OpenCode JS SDK (C002-IF-010 §4; `../10-context/scope.md` §3.1, §5) | P-01 (`npm run …`) | per command |
| Adopter machine, Claude Code | plugin as today; hooks call `node <plugin-root>/scripts/sdd.mjs` | Claude Code | per session; per hook call |
| Adopter machine, OpenCode | `.opencode/` and `opencode.json` of the OpenCode package (project or global placement); `sdd` from `architect-sdd`; under server mode one `sdd-mcp --profile files` and one `--profile shell` process per session; `sdd serena-launch` for Serena | OpenCode | per session (C002-CON-04) |
| Adopter machine, VS Code | the Copilot package's plugin part as a local plugin (`chat.pluginLocations`; loadable once the install has written its `plugin.json`; VS Code loads it from its own copy, S-08 §3); in each repository, after `sdd install copilot` run by P-03, the ten agents in `.github/agents/`, the workspace hook file in `.github/hooks/` and the servers in `.vscode/mcp.json`; one `sdd-mcp --profile files` and one `--profile shell` process per Local chat session, started after its first message; hook commands `node "<package>/scripts/sdd.mjs" …` with the absolute path written at install, the PreToolUse command once per loaded hooks file | VS Code (local agent host); P-03 for the install | per chat session; per hook call; per install |
| Maintainer machine, Copilot CLI eval runs | `copilot -p` per case, with a package copy installed into the case workspace and the sdd MCP servers given per session (C002-IF-010 §4) | the Copilot CLI eval runner | per eval session |
| npm registry | `architect-sdd` | P-01 publishes by hand | per version |
| Remote | Context7 and DeepWiki endpoints; Claude models through each host's provider | hosts | — |

**Known platform condition: MSIX AppData redirection** (defect D-013 item 7; glossary). On a
Windows machine where the Claude desktop app, installed as an MSIX package, starts a session, the
writes of every process of that session under `%LOCALAPPDATA%` land in the package's `LocalCache`.
A per-user data folder of `architect-sdd` written from there (`sdd serena-config --user-data`) is
then not the folder that OpenCode or VS Code, started outside the package, read. Architect does
nothing about it: the sdd CLI resolves the folder the same way in both cases (C002-IF-007
`serena-config`; C002-REQ-515, C002-REQ-516 rationale), and each host's own session writes the folder
it then reads.

## 6. Cross-cutting concerns

### 6.1 Concerns

| Concern | Approach |
|---|---|
| Authorization and boundary | Per target, the enforcement mechanism of its mode (C002-CON-03): Claude Code hooks; OpenCode `permission` rules generated from the allowlist, or the sdd MCP server; on Copilot no generic tool and the sdd MCP server, or one plugin-level Copilot guard hook with a conductor still on the server (flagged exception). One decision point: the guard cores and the one allowlist (C002-CON-06), which also confines the Serena commands to a data folder outside the repository and denies `sdd install` on every host (C002-IF-008 §1.1, §1.2). Closed tool sets: Copilot `tools` lists are allowlists (every agent has one; the host adds only `tool_search_tool`), and OpenCode agents start from a catch-all that turns every tool off (C002-IF-001 §6.1). On Copilot the conductor's `agents` list does not bound the agents it can start (host built-in agents, S-08 §3), so the Copilot subagent guard hook denies, in both modes, the write and terminal calls of every non-Architect subagent in a repository with `.sdd/` (C002-REQ-327). Identity: the server needs none (only Architect agents are granted it); the Copilot hook takes it from the hook input's `agent_type`, present on subagent calls only (C002-IF-008 §2) |
| Fail closed | Server faults refuse and change nothing; guard-hook faults write a deny decision and exit 2, and both Copilot hosts deny a call whose hook errors (C002-CON-08; S-08 §2.2, §3); the Copilot hook denies a tool it cannot class (C002-REQ-328) and is installed beside the agents it guards, before them, and the package is no plugin until then (C002-IF-005 §3); a hook command whose CLI copy is missing errors, so every call is denied; a generator error leaves no package (C002-INV-02); a missing `sdd-mcp`, or a session before its first message, leaves agents without write tools, never with generic ones; an install conflict writes nothing (ERR-CLI-021) |
| Shell surface | The server never starts a shell (C002-CON-07); compound commands are refused by the core before any process starts |
| Untrusted content | Unchanged rule (C001-NFR-205); injection evals per target (C002-NFR-203) |
| Error handling | Stable codes with fixes: ERR-GEN, ERR-MCP, WARN-MCP, ERR-REL (001 … 013), ERR-BLD (001, 002), ERR-CLI-019 … 022, GUARD-HOOK-001, GUARD-HOOK-002, and the TGT-*, PLG-VAR-001 and PLG-VER-001 check codes (`../50-interfaces/errors.md`, C002-IF-005 §6); every code of `errors.md` §1 … §6 is shown as `<code>: <message>`; the §7 check codes keep the finding format of C001-IF-08 §3 (C002-IF-005 §6) (with `. Fix: <fix>` from the CLI and the generator), or as separate code and message fields in structured results (`errors.md` print form) |
| Configuration | Mapping tables (mode, tested versions, models, tools) are the only per-target configuration; P-03 sets host settings named by the install notes and runs the install command, whose only machine-specific output is the package path in `hooks.json` and in the workspace hook file (generated files hold none, C002-CON-09) |
| Observability | `SDD_DEBUG=1` decision logs of the server on standard error; generator diagnostics; replay reports and release records as evidence |
| Determinism and versioning | Byte-identical generation (C002-CON-09); one version per packaging run (C002-CON-16); manifests carry `source_digest` and file hashes |
| Portability | Windows first: no shell in the server, so `.cmd`/`.bat` shims are not run (ERR-MCP-006) and the doctor reports such a tool as `error` with a native-install fix (C002-IF-006 §2); the `host-version` probes may use the platform shell for fixed command lines only; PowerShell and Git Bash cases in the corpora (C002-REQ-607), replayed in their own dialect (C002-IF-009 §2.2); MSIX AppData redirection of the per-user data folder is a known platform condition, not handled (§5) |
| Performance and cost | Server budgets of C002-NFR-101 and C002-NFR-102 (rules loaded once per process); eval caps of C002-NFR-105 |

### 6.2 Design choices of this step

None of these needs P-01: each follows from a decision or requirement and can be reversed in the plan
without changing a requirement. The plan may record any of them as an ADR if the critic asks.

| Choice | Follows from | Alternative kept open |
|---|---|---|
| Two server profiles (`sdd-files`, `sdd-shell`) of one program | C002-REQ-108 with only `<server>/*` grants documented on Copilot (C002-OA-001) and tested in VS Code (S-08 §3.2) | one server with per-tool grants, shown on Copilot CLI only (S-08 §2.1) |
| No shell in the server; pipe-only filters in-process | C002-NFR-202, C002-NFR-204 | none safer was found |
| Mapping tables and variants as data under `plugins/architect/targets/`, anchors by section or exact lines | C002-REQ-111, C002-REQ-113, C002-CON-01 | markers inside the source files (would change Claude Code prompt text) |
| Host versions read by `sdd host-version` | C002-REQ-508 open item (no allowlist widening) | version probes added to the allowlist (rejected: widens C002-REQ-503) |
| Templates through `sdd template show`, Serena data through `--user-data` | `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` have no counterpart in OpenCode and VS Code bodies (C002-R-001 A-09), and the Copilot package uses no root token anywhere (C002-REQ-326) | a templates copy per package with a host-specific path |
| Copilot hook commands use a CLI copy in the package | C002-NFR-204; a hook that errors denies every tool call of the session (S-08 §3), so a PATH miss would block the chat | the npm `sdd` on PATH |
| The Copilot package splits into a plugin part (prompt files, skills, hooks; agents for Copilot CLI) and install sources that `sdd install copilot` writes into the repository (agents byte-copied to `.github/agents/`, servers merged into `.vscode/mcp.json`) | C002-REQ-301, C002-REQ-307, C002-REQ-322, C002-REQ-323, C002-REQ-612; S-08 facts F-1, F-2 | an install step written as manual copy instructions (no conflict check, C002-REQ-324) |
| Hook commands reach the CLI copy by an absolute path that the install command writes into the package's `hooks.json` and the workspace hook file from `install/hooks.template.json` (token `@CLI_COPY@`); a package path with `"`, `$`, `%` or a backtick is refused (ERR-CLI-022) | C002-REQ-316, C002-REQ-326; S-08 fact F-3; absolute-path hooks ran on both hosts (S-08 §3) | a command that reads `PLUGIN_ROOT` (`node -e` with quoted code, which each shell parses differently) |
| The install command recognises its own files by an install record with the SHA-256 of each file and server entry it wrote, and treats an edited one as the adopter's; `.vscode/mcp.json` is parsed as strict JSON and refused, not rewritten, when it holds comments | C002-REQ-324 | a marker line in each agent file (covers no server entry); a JSONC rewrite (drops comments) |
| One PreToolUse command in both modes, `hook guard --host copilot --mode <mode> --agents <ten>`, keyed by `agent_type`: the session agent's calls pass; a non-Architect subagent in a repository with `.sdd/` gets read-only tools only (GUARD-HOOK-002 for write and terminal tools, GUARD-HOOK-001 for unclassed tools); an Architect agent's calls pass under server enforcement and go to the guard cores under the fallback; the conductor (the session agent) keeps the server profiles in both modes | C002-REQ-302, C002-REQ-308, C002-REQ-320, C002-REQ-321, C002-REQ-327 … C002-REQ-330 (Q-safety-06, Q-safety-07); S-08 fact F-4 | agent-scoped hooks (never ran for a subagent's calls, S-08 §3.1); two hook entries, one per mode role (two processes per call, and two places to keep in step); a fixed list of host built-in agent names (rejected by P-01 in Q-safety-07: an adopter agent or a built-in agent of a later host version would pass) |
| The PreToolUse entry is written twice by the install command: into the package's `hooks.json` (plugin level) and into the workspace hook file `.github/hooks/architect-guard.json` beside the workspace agents; the guard hook is written before the agents, and the package's `plugin.json` is written by the same install, so the package is no plugin before it (critic CR-38) | C002-CON-08, C002-DEC-005: the workspace agents are loaded by every VS Code that opens the repository, with or without the plugin part, and a plugin conductor loaded before the install could start host built-in agents with no hook (S-08 §3); a missing CLI copy makes the hook error, which denies (S-08 §3) | plugin level only (fail-open where the plugin part is not loaded); workspace level only (rests on an unverified assumption, C002-IF-005 §3; the plugin level is the location S-08 showed); specialists on the server profiles also under the fallback (no help where subagents are not confined, the case the fallback exists for) |
| A Copilot deny is a deny decision on standard output plus exit 2 | C002-REQ-309, C002-CON-08; S-08 fact F-6 (Copilot CLI reports exit 2 as 1 and fails closed) | exit 0 with the deny decision only (an allow on a host that ignores the decision) |
| The Copilot CLI eval runner installs a package copy into the case workspace and gives the session the servers of its workspace MCP configuration | C002-REQ-612, C002-REQ-307 | a plugin `.mcp.json` added to the runner's copy (the tested package would differ from the released one) |
| Generator runs every target; the release check decides publication; a `deferred` S-08 record leads to the spec revision of scope §1.1, not to a table mode | C002-REQ-101, C002-REQ-619, Q-defer-01 | skip a refused target at generation |
| Serena commands confined in the bash guard core from the resolved data folder; the literal `${CLAUDE_PLUGIN_DATA}` resolved from the guard's own environment where the command runs in a shell, an assumption checked on the real host by C002-TS-537 (C002-IF-008 §1.1); `--read-only` optional for `serena-launch` | C002-REQ-517 (Q-guards-04), C002-REQ-623 (the Claude Code doctor keeps its Serena step) | a dedicated allowlist entry per Serena form |
| The sdd MCP server calls the bash guard core with variable expansion off, so the literal `${CLAUDE_PLUGIN_DATA}` is denied there whatever the server's environment holds (C002-IF-002 §5.2; defect D-014 item 4, code fix of C002-T-041) | C002-CON-07 (no shell, so nothing expands), C002-REQ-517 | expand from the server's environment (the CLI receives the literal text and writes a folder of that name into the repository, the behaviour found in C002-T-041) |
| Text of frontmatter fields translated per target by `frontmatter` constructs with a `replace` action (`conductor-start`, `doctor-description`), each with a stand-in detector in the generator (C002-IF-001 §2; decided for defect D-010 item 4) | C002-REQ-103, C002-REQ-104: no Claude Code construct left in a generated file | frontmatter variants (a second anchor mechanism for two lines); the Claude Code text accepted (the doctor description would name Claude Code and miss the generated rows) |
| `sdd install copilot` refuses a package without its CLI copy `scripts/sdd.mjs`, before any write (C002-IF-007 §Install step 1; decided for defect D-013 item 8) | C002-CON-08, C002-CON-14: the hook commands name the copy by its absolute path, and a hook that errors denies every call of the session | install without it (fails closed, but leaves a repository in which every tool call is refused, with no message that names the cause) |
| The doctor's Copilot hooks row is `ok` on `chat.useHooks` alone, with a text naming Workspace Trust and organisation policy as not read; the manual VS Code checklist records the three sources in both Copilot modes (C002-IF-006 §2, C002-IF-009 §4) | P-01 decision on defect D-012 ("ok + caveat"), C002-REQ-510, C002-REQ-616 | read Workspace Trust and policy in `sdd host-version` (no source the CLI can read was found); keep the row `error` while two sources are unread (the row could never be `ok`) |
| Three replay expectations added per mechanism, each `deny`: write-tool cases of the shell corpus on every mechanism (C001-REQ-1103), and on the server the Serena literal cases (C002-REQ-517) and the cases whose `cwd` reaches the repository through a link (C002-REQ-401); ERR-MCP-003 read as the server's `allow`; Copilot hook input under the hook names of the classes file (C002-IF-009 §2.1 … §2.3; defects D-011 item 2, D-014) | C002-REQ-606, C002-NFR-201, C002-NFR-202: the expectations of §2.1 are what a correct mechanism decides on the input §2.2 gives it, and the release counts `sdd-mcp-server` and `copilot-hooks` | replay PG-135 with a server whose root is the link (closer to a session started there, but a second server per case spelling); count ERR-MCP-003 as `error` (a false difference for a case the guard allowed) |
| Writing commands recognised by their first words (the rows of C002-IF-008 §1.2, `status` and `trace` with `--write`, `archive` without `--dry-run`); every `--cwd` of such a command resolved like a write target and compared with the repository root | C002-REQ-521 (Q-guards-05); the CLI reads its subcommand from the first words only (`src/cli/run.ts:33`) | deny `--cwd` on every subcommand (rejected by P-01: breaks read-only uses such as BG-019) |
| Replay expectations by ordered rules (applicability, then C002-REQ-630, C002-REQ-632, C002-REQ-625, corpus), each case recording its `expected_source`; the report records its replay host so that the release check recomputes them (C002-IF-009 §2.1) | C002-REQ-630, C002-REQ-632 (Q-safety-04), C002-REQ-617 | let the report state expectations unchecked (the implementer would choose them, critic CR-23) |
| A case that requires a host capability is replayed with its own input on a fixture built with it; on a replay host without the capability the case is recorded as `error` (a differing decision), and the release check refuses a report whose `replay_host.capabilities` lacks a capability the cited corpora require (ERR-REL-012, problem `replay host lacks <capability>`); release replays run on REF-WIN with Developer Mode on or elevated (C002-IF-009 §2.1, §5) | C002-REQ-633, C002-REQ-634 (Q-safety-05) | feed such a case as a malformed call, or list it as not replayed (rejected by P-01: the first passes by construction, critic CR-32; the second widens the not-applicable list beyond identity cases) |
| An S-07 record with `agent_tools_closed: false` refuses the OpenCode release (ERR-REL-013) and triggers a spec revision with P-01, as a `deferred` S-08 record does | C002-REQ-108; Q-defer-01 as precedent | release under the sdd MCP server mode alone (rejected: the catch-all decides in both modes) |
| `run_command` takes an optional `dialect` (`bash` default, `powershell`) that selects the guard's syntax rules; the command still runs without a shell | C002-REQ-606 with C002-REQ-626: PowerShell corpus cases are applicable to the server and must be decided in their own dialect | decide PowerShell cases in the Bash dialect (gives false allows such as `git log` and false denies such as backslash paths) |
| Replay input mapping and decision reading per mechanism, fixed in C002-IF-009 §2.2–§2.3 | C002-REQ-606, C002-NFR-201, C002-NFR-202 | leave the mapping to the implementer (rejected: it is the safety measurement P-01 decided, Q-safety-02) |
| OpenCode `bash` rules no wider than the forms the generated agents send need; a guard rule a glob cannot follow is a replay difference, so the S-07 replay selects `sdd-mcp-server` when any remains (C002-IF-001 §6.3; Q-safety-03) | C002-CON-06, C002-NFR-202 | wider glob rules (false allows) |
| Templates of `architect-sdd` get their CLI lines translated at packaging and scanned (ERR-BLD-002) | C002-REQ-518, C002-REQ-519 | rewriting at `sdd template show` time (would need the host at run time) |
| Under the sdd MCP server, `.cmd` shims are not run; the doctor reports `error` with a native-install fix | C002-CON-07 | run shims through `cmd.exe` (a shell, and `%`/`^` expansion of agent text) |
| The CLI takes its shipped templates from the folder above its own bundle first, and from `CLAUDE_PLUGIN_ROOT` only when that folder has none (C002-IF-003 §1; defect D-004) | C002-REQ-512, C002-REQ-518: the npm `sdd`, started inside a Claude Code session that sets `CLAUDE_PLUGIN_ROOT`, must read its translated templates; on Claude Code both name the plugin folder | `CLAUDE_PLUGIN_ROOT` first (the npm `sdd` would read another package's untranslated templates) |
| One print form for every code, `<code>: <message>`, the Message column holding only the printed text (`errors.md`; defects D-004, D-008) | C001-NFR-601; C002-TS-530 reads the code from the build line; the CLI catalogue mirrors the column character for character | message lines without the code for build and release errors (a reader cannot tell the codes apart) |
| The OpenCode replay and eval runner start the pinned host binary with their own `OPENCODE_DB` (C002-IF-010 §4) | C002-REQ-606, C002-REQ-621; S-07 facts F-7, F-8 | the `opencode` that PATH resolves (another install is found first in Git Bash, and the tested version would migrate the user's shared database) |

## 7. Constraints

See `constraints.md` (C002-CON-06 … C002-CON-16), the scope constraints C002-CON-01 … C002-CON-05 in
`../10-context/scope.md` §4, and CHG-001's constraints as reviewed by C002-CON-12 and C002-CON-13.

## 8. Diagrams

Mermaid. Node and participant IDs are component IDs with `-` replaced by `_`. Unchanged CHG-001
components appear as plain nodes in the component views and by their C001 IDs in sequence diagrams.

### 8.1 Component view (to-be)

```mermaid
flowchart LR
  P01([P-01 spec owner])
  P03([P-03 adopter])
  subgraph REPO[Repository, build time]
    subgraph SRC[Source plugin]
      C002_COMP_017[Plugin package and configuration]
      C002_COMP_002[Mapping tables and wiring variants]
      C002_COMP_014[Conductor]
      C002_COMP_015[Commands]
      C002_COMP_016[Skills library]
    end
    C002_COMP_013[Build and check tooling]
    C002_COMP_001[Target generator]
    C002_COMP_007[Target structure checks]
    C002_COMP_008[Corpus replay suite]
    C002_COMP_009[Eval runners]
    C002_COMP_010[Release check]
    C002_COMP_011[Manual VS Code checklist]
  end
  subgraph DIST[dist]
    C002_COMP_003[OpenCode target package]
    C002_COMP_004[Copilot target package]
    C002_COMP_006[architect-sdd package]
  end
  subgraph CLIPKG[Shipped code]
    C002_COMP_018[CLI front-end]
    C002_COMP_012[Hooks and guards]
    C002_COMP_005[sdd MCP server]
    CORE[[Workspace, lint, trace, gate, archive of CHG-001]]
  end
  CC[[Claude Code]]
  OC[[OpenCode]]
  VSC[[VS Code with Copilot Chat]]
  P01 --> C002_COMP_013
  P01 --> C002_COMP_010
  P01 --> C002_COMP_011
  CCLI[[Copilot CLI, eval host]]
  P03 --> CC
  P03 --> OC
  P03 --> VSC
  P03 -.sdd install copilot.-> C002_COMP_018
  CC -.loads.-> C002_COMP_017
  OC -.loads.-> C002_COMP_003
  VSC -.loads plugin part and installed workspace files.-> C002_COMP_004
  CCLI -.loads as plugin dir.-> C002_COMP_004
  C002_COMP_009 --> CCLI
  C002_COMP_017 --> C002_COMP_002
  C002_COMP_015 --> C002_COMP_014
  C002_COMP_015 --> C002_COMP_016
  C002_COMP_014 --> C002_COMP_016
  C002_COMP_014 --> C002_COMP_018
  C002_COMP_013 --> C002_COMP_001
  C002_COMP_013 --> C002_COMP_007
  C002_COMP_013 --> C002_COMP_017
  C002_COMP_013 -.builds.-> C002_COMP_006
  C002_COMP_001 --> C002_COMP_002
  C002_COMP_001 --> C002_COMP_017
  C002_COMP_001 -.writes.-> C002_COMP_003
  C002_COMP_001 -.writes.-> C002_COMP_004
  C002_COMP_007 --> C002_COMP_001
  C002_COMP_007 --> C002_COMP_002
  C002_COMP_008 --> C002_COMP_005
  C002_COMP_008 --> C002_COMP_012
  C002_COMP_008 --> C002_COMP_003
  C002_COMP_008 --> C002_COMP_004
  C002_COMP_008 --> C002_COMP_006
  C002_COMP_008 --> C002_COMP_013
  C002_COMP_009 --> C002_COMP_003
  C002_COMP_009 --> C002_COMP_004
  C002_COMP_009 --> C002_COMP_018
  C002_COMP_010 --> C002_COMP_001
  C002_COMP_010 --> C002_COMP_002
  C002_COMP_010 --> C002_COMP_008
  C002_COMP_010 --> C002_COMP_009
  C002_COMP_010 --> C002_COMP_011
  C002_COMP_011 --> C002_COMP_004
  C002_COMP_003 --> C002_COMP_006
  C002_COMP_004 --> C002_COMP_006
  C002_COMP_004 --> C002_COMP_005
  C002_COMP_004 --> C002_COMP_012
  C002_COMP_004 --> C002_COMP_018
  C002_COMP_006 --> C002_COMP_005
  C002_COMP_006 --> C002_COMP_018
  C002_COMP_005 --> C002_COMP_012
  C002_COMP_005 --> C002_COMP_018
  C002_COMP_005 --> CORE
  C002_COMP_018 --> C002_COMP_012
  C002_COMP_018 --> CORE
  C002_COMP_012 --> CORE
```

### 8.2 F1 — Generation and packaging (realizes C002-TS-101, C002-TS-102, C002-TS-103, C002-TS-104, C002-TS-106, C002-TS-108, C002-TS-119, C002-TS-417, C002-TS-503, C002-TS-519, C002-TS-529, C002-TS-530)

```mermaid
sequenceDiagram
  %% F1 generation and packaging. Realizes C002-TS-101 C002-TS-102 C002-TS-103 C002-TS-104 C002-TS-106 C002-TS-108 C002-TS-119 C002-TS-417 C002-TS-503 C002-TS-519 C002-TS-529 C002-TS-530
  actor P01 as P-01
  participant C002_COMP_013 as Build and check tooling
  participant C002_COMP_001 as Target generator
  participant C002_COMP_002 as Mapping tables and variants
  participant C002_COMP_017 as Source plugin
  participant C002_COMP_006 as architect-sdd package
  P01->>C002_COMP_013: npm run package
  C002_COMP_013->>C002_COMP_013: bundle plugin sdd.mjs, then sdd and sdd-mcp entries, license check over both (ERR-BLD-001)
  C002_COMP_013->>C002_COMP_013: plugin checks, Claude Code staging without targets folder, zips as before
  C002_COMP_013->>C002_COMP_001: generate all targets into dist
  C002_COMP_001->>C002_COMP_002: load and validate opencode.json and copilot.json
  C002_COMP_001->>C002_COMP_017: read agents, commands, skills, hooks and MCP servers (read only)
  C002_COMP_001->>C002_COMP_001: variants, frontmatter, skill inlining, constructs, leak scan
  alt any diagnostic
    C002_COMP_001-->>C002_COMP_013: exit 1 with ERR-GEN lines, no dist/opencode and no dist/copilot
    C002_COMP_013-->>P01: packaging failed, naming file, line, construct and target
  else no diagnostic
    C002_COMP_001-->>C002_COMP_013: dist/opencode and dist/copilot with manifests
    C002_COMP_013->>C002_COMP_013: stage templates, CLI lines written as sdd, then scan for a plugin path
    alt plugin path left in a staged template
      C002_COMP_013-->>P01: build failed, ERR-BLD-002 naming template, line and construct
    else templates clean
      C002_COMP_013->>C002_COMP_006: stage entries, templates, serena mode file, notices, then npm pack
      C002_COMP_006-->>C002_COMP_013: dist/architect-sdd-VERSION.tgz
      C002_COMP_013-->>P01: Claude Code zips, two target packages, tarball
    end
  end
```

### 8.3 F2 — OpenCode write and command through the native permission rules (realizes C002-TS-207, C002-TS-209, C002-TS-222, C002-TS-223)

```mermaid
sequenceDiagram
  %% F2 OpenCode native permission enforcement. Realizes C002-TS-207 C002-TS-209 C002-TS-222 C002-TS-223
  participant C002_COMP_003 as OpenCode package agent sdd-spec-writer
  participant OC as OpenCode host and permission engine
  participant FS as File system
  participant C002_COMP_018 as sdd CLI of architect-sdd
  C002_COMP_003->>OC: edit .sdd/002-x/10-spec/a.md
  OC->>OC: agent permission.edit rules, last matching rule wins
  alt path inside .sdd
    OC->>FS: write the file
    opt quick-lint plugin present (spike S-07 found a feedback channel)
      OC->>C002_COMP_018: sdd lint quick on the written file
      C002_COMP_018-->>OC: findings in the C001-IF-07 format
    end
    OC-->>C002_COMP_003: result with findings
  else other path or dot-dot segment leaving .sdd
    OC-->>C002_COMP_003: permission denied
  end
  Note over OC: S-07 on 1.18.31, a link under .sdd to a folder inside the project passes the rule, a replay difference (C002-IF-001 6.3)
  C002_COMP_003->>OC: bash sdd lint 002
  OC->>OC: split into commands, each part against permission.bash, redirection targets not checked (S-07 F-3)
  alt every part allowed
    OC->>C002_COMP_018: run sdd lint 002
    C002_COMP_018-->>OC: exit code and output
    OC-->>C002_COMP_003: command output
  else any part denied
    OC-->>C002_COMP_003: permission denied
  end
```

### 8.4 F3 — Copilot write through the sdd MCP server (realizes C002-TS-401, C002-TS-402, C002-TS-404, C002-TS-405, C002-TS-410, C002-TS-413, C002-TS-414, C002-TS-415)

```mermaid
sequenceDiagram
  %% F3 Copilot write through sdd-files. Realizes C002-TS-401 C002-TS-402 C002-TS-404 C002-TS-405 C002-TS-410 C002-TS-413 C002-TS-414 C002-TS-415
  participant C002_COMP_004 as Copilot workspace agent sdd-spec-writer
  participant VSC as VS Code Copilot Chat, local agent host
  participant C002_COMP_005 as sdd MCP server, profile files, from .vscode/mcp.json
  participant C002_COMP_012 as Path guard core
  participant FS as File system
  participant C001_COMP_04 as Lint engine
  Note over VSC,C002_COMP_005: the workspace server starts with the session, after its first message (S-08 3.2)
  VSC->>C002_COMP_005: start sdd-mcp profile files, initialize
  C002_COMP_005-->>VSC: tools write_file and replace_text, root fixed
  C002_COMP_004->>VSC: tool_search_tool loads the deferred tool sdd-files-write_file
  C002_COMP_004->>VSC: sdd-files-write_file with path and content
  VSC->>C002_COMP_005: tools/call write_file
  C002_COMP_005->>C002_COMP_005: validate arguments, else failed ERR-MCP-001
  C002_COMP_005->>C002_COMP_012: decide Write of path, cwd root, memory folder off
  alt deny
    C002_COMP_012-->>C002_COMP_005: GUARD-PATH-001 and message
    C002_COMP_005-->>VSC: isError, refused, file unchanged
  else allow
    C002_COMP_005->>FS: temporary file then rename
    alt I/O error
      C002_COMP_005-->>VSC: isError, failed ERR-MCP-003, previous content kept
    else renamed
      C002_COMP_005->>C001_COMP_04: quick lint of the written file
      C001_COMP_04-->>C002_COMP_005: findings, or a fault
      C002_COMP_005-->>VSC: written with up to 15 findings, or WARN-MCP-001
    end
  end
  VSC-->>C002_COMP_004: tool result
  VSC->>C002_COMP_005: close standard input at session end
  C002_COMP_005-->>VSC: exit 0
```

### 8.5 F4 — Copilot command through the sdd MCP server (realizes C002-TS-406, C002-TS-407, C002-TS-408, C002-TS-409)

```mermaid
sequenceDiagram
  %% F4 Copilot command through sdd-shell. Realizes C002-TS-406 C002-TS-407 C002-TS-408 C002-TS-409
  participant C002_COMP_004 as Copilot workspace agent sdd-auditor
  participant VSC as VS Code Copilot Chat, local agent host
  participant C002_COMP_005 as sdd MCP server, profile shell
  participant C002_COMP_012 as Bash guard core
  participant C002_COMP_018 as sdd CLI of the same package
  participant EXE as git, ripwire, ast-grep, node
  C002_COMP_004->>VSC: sdd-shell-run_command sdd lint 002, loaded through tool_search_tool
  VSC->>C002_COMP_005: tools/call run_command
  C002_COMP_005->>C002_COMP_012: decide Bash command, cwd root
  alt deny
    C002_COMP_012-->>C002_COMP_005: GUARD-BASH-001 or GUARD-BASH-002
    C002_COMP_005-->>VSC: isError, refused, no process started
  else allow
    C002_COMP_005->>C002_COMP_005: words from the guard tokeniser, no shell, no variable expanded
    alt executable cannot start: own sdd.mjs not beside the server, not on PATH, only a cmd or bat shim
      C002_COMP_005-->>VSC: isError, failed ERR-MCP-006 with the reason, no process started
    else first word is sdd
      C002_COMP_005->>C002_COMP_018: node package scripts/sdd.mjs lint 002
      C002_COMP_018-->>C002_COMP_005: exit code, stdout, stderr
      C002_COMP_005->>C002_COMP_005: pipe-only filters in-process, output caps, timeout
      C002_COMP_005-->>VSC: completed with exit code, stdout and stderr (non-zero is not an error)
    else another allowlisted executable
      C002_COMP_005->>EXE: spawn from PATH, never a cmd or bat file
      EXE-->>C002_COMP_005: exit code, stdout, stderr
      C002_COMP_005->>C002_COMP_005: pipe-only filters in-process, output caps, timeout
      C002_COMP_005-->>VSC: completed with exit code, stdout and stderr (non-zero is not an error)
    end
  end
  VSC-->>C002_COMP_004: tool result
```

### 8.6 F5 — Copilot PreToolUse hook in both modes (realizes C002-TS-311, C002-TS-312, C002-TS-313, C002-TS-314, C002-TS-333, C002-TS-337, C002-TS-338)

```mermaid
sequenceDiagram
  %% F5 Copilot PreToolUse hook keyed by agent_type, subagent guard in both modes, guard cores under the fallback. Realizes C002-TS-311 C002-TS-312 C002-TS-313 C002-TS-314 C002-TS-333 C002-TS-337 C002-TS-338
  participant C002_COMP_014 as Conductor, session agent, server profiles only
  participant C002_COMP_004 as Copilot subagent, Architect sdd-spec-writer or host built-in general-purpose
  participant VSC as VS Code local agent host or Copilot CLI
  participant C002_COMP_012 as hook guard with host copilot and mode, CLI copy at its installed absolute path
  Note over VSC,C002_COMP_012: the same entry from the package hooks.json and from .github/hooks/architect-guard.json, the most restrictive decision wins
  C002_COMP_014->>VSC: Agent call, start a subagent
  VSC->>C002_COMP_012: PreToolUse JSON without agent_type
  C002_COMP_012-->>VSC: allow, exit 0, no output
  C002_COMP_004->>VSC: Write on src/app.ts
  VSC->>C002_COMP_012: PreToolUse JSON, tool_name Write, agent_type of the subagent
  alt mode or agents option missing, input empty, not JSON or not an object
    C002_COMP_012->>C002_COMP_012: GUARD-HOOK-001
  else agent_type absent, the session agent
    C002_COMP_012->>C002_COMP_012: allow without the classes file, C002-REQ-320 and C002-REQ-330
  else Architect agent and mode sdd-mcp-server
    C002_COMP_012->>C002_COMP_012: allow without the classes file, confined by its tool list, C002-REQ-330
  else non-Architect subagent, both modes
    alt no cwd, failed workspace lookup, no tool name or unreadable classes file
      C002_COMP_012->>C002_COMP_012: GUARD-HOOK-001
    else no .sdd at or above cwd
      C002_COMP_012->>C002_COMP_012: allow, C002-REQ-329
    else write or terminal tool
      C002_COMP_012->>C002_COMP_012: GUARD-HOOK-002, C002-REQ-327
    else read-only tool
      C002_COMP_012->>C002_COMP_012: allow, C002-REQ-329
    else unclassed tool
      C002_COMP_012->>C002_COMP_012: GUARD-HOOK-001, C002-REQ-328
    end
  else Architect agent and mode copilot-hooks
    C002_COMP_012->>C002_COMP_012: read tool-classes.json, classify tool_name
    alt write tool
      C002_COMP_012->>C002_COMP_012: path guard core for every target path, memory folder off
    else terminal tool
      C002_COMP_012->>C002_COMP_012: bash guard core in the class dialect
    else read-only tool
      C002_COMP_012->>C002_COMP_012: allow
    else no cwd, no tool name, unknown tool, unreadable classes file or internal fault
      C002_COMP_012->>C002_COMP_012: GUARD-HOOK-001
    end
  end
  alt allowed
    C002_COMP_012-->>VSC: exit 0, no output
    VSC-->>C002_COMP_004: tool runs
  else denied
    C002_COMP_012-->>VSC: deny decision JSON on standard output, message on standard error, exit 2
    Note over VSC: VS Code blocks the call, Copilot CLI sees exit 1 and fails closed (S-08 2.2)
    VSC-->>C002_COMP_004: call denied by a hook
  end
```

### 8.7 F6 — Copilot session-start and SubagentStop hooks (realizes C002-TS-320, C002-TS-322, C002-TS-323, C002-TS-324, C002-TS-325)

```mermaid
sequenceDiagram
  %% F6 Copilot session hooks. Realizes C002-TS-320 C002-TS-322 C002-TS-323 C002-TS-324 C002-TS-325
  participant VSC as VS Code Copilot Chat, local agent host
  participant C002_COMP_004 as Copilot package hooks.json, written at install
  participant C002_COMP_012 as Host adapter in the CLI copy
  participant C001_COMP_04 as Trace engine
  VSC->>C002_COMP_004: read hooks.json from its plugin copy, SessionStart and SubagentStop, commands with the absolute CLI path
  VSC->>C002_COMP_012: SessionStart JSON with cwd
  alt repository has .sdd
    C002_COMP_012-->>VSC: status brief, at most 10 lines, exit 0
  else no .sdd
    C002_COMP_012-->>VSC: no output, exit 0
  end
  VSC->>C002_COMP_012: SubagentStop JSON with agent_type, sdd-planner in VS Code or architect:sdd-planner in Copilot CLI
  alt agent is spec-writer, test-designer, architect or planner
    C002_COMP_012->>C001_COMP_04: trace of the active changes, write
    C001_COMP_04-->>C002_COMP_012: done, or a fault
  end
  C002_COMP_012-->>VSC: exit 0 in every case
```

### 8.8 F7 — Gate through the host question tool (realizes C002-TS-217, C002-TS-218, C002-TS-316, C002-TS-318, C002-TS-319)

```mermaid
sequenceDiagram
  %% F7 gate on a generated target. Realizes C002-TS-217 C002-TS-218 C002-TS-316 C002-TS-318 C002-TS-319
  actor P01 as P-01
  participant C002_COMP_014 as Conductor on OpenCode or VS Code
  participant QT as Host question tool, question or ask_user
  participant C002_COMP_018 as sdd CLI
  Note over C002_COMP_014,QT: OpenCode offers question only to the conductor, whose permission holds question allow (C002-REQ-217)
  C002_COMP_014->>C002_COMP_018: sdd gate show 002 10-spec
  C002_COMP_018-->>C002_COMP_014: gate summary
  alt VS Code without ask_user
    C002_COMP_014-->>P01: names the missing tool ask_user and the install-notes step, no question asked
  else question tool available
    C002_COMP_014->>QT: one call, summary, what approval commits to, four choices
    QT->>P01: dialog
    P01-->>QT: choice and words, or skip
    alt a choice
      QT-->>C002_COMP_014: answer
      C002_COMP_014->>C002_COMP_018: sdd gate approve or gate record with the verbatim words
    else skipped, dismissed or empty
      QT-->>C002_COMP_014: no choice
      C002_COMP_014-->>P01: no answer received, nothing recorded
    end
  end
```

### 8.9 F8 — Doctor on a generated target (realizes C002-TS-506, C002-TS-509, C002-TS-513, C002-TS-515, C002-TS-516)

```mermaid
sequenceDiagram
  %% F8 doctor with host rows. Realizes C002-TS-506 C002-TS-509 C002-TS-513 C002-TS-515 C002-TS-516
  actor P01 as P-01
  participant C002_COMP_015 as Doctor command, generated variant
  participant C002_COMP_014 as Conductor
  participant C002_COMP_018 as sdd CLI
  participant HOST as opencode or code executable
  P01->>C002_COMP_015: doctor
  C002_COMP_015->>C002_COMP_014: steps with the host rows of the target
  C002_COMP_014->>C002_COMP_018: sdd serena-config with user data folder
  C002_COMP_014->>C002_COMP_018: sdd host-version opencode
  C002_COMP_018->>HOST: fixed version probe of the opencode first on PATH
  HOST-->>C002_COMP_018: version
  C002_COMP_018-->>C002_COMP_014: opencode 1.15.10, another install first on this PATH
  C002_COMP_014->>C002_COMP_014: compare with tested version 1.18.31, status untested
  opt Copilot target, both enforcement modes
    C002_COMP_014->>C002_COMP_018: sdd host-version vscode-insiders
    C002_COMP_018->>HOST: fixed version and extension probes of code-insiders
    C002_COMP_018->>C002_COMP_018: read chat.useHooks, workspace settings first, then user settings
    C002_COMP_018-->>C002_COMP_014: vscode, copilot-chat and hooks lines
    alt hooks enabled
      C002_COMP_014->>C002_COMP_014: Copilot hooks row ok, text says Workspace Trust and policy not read, checklist confirms them
    else hooks disabled or unknown
      C002_COMP_014->>C002_COMP_014: Copilot hooks row error with its fix
    end
  end
  C002_COMP_014->>C002_COMP_018: sdd version flag
  alt sdd not reachable
    C002_COMP_014-->>P01: table, then Doctor failed, sdd CLI not reachable
  else version differs from the package version
    C002_COMP_014-->>P01: sdd CLI row error with the npm install command
  else versions equal
    C002_COMP_014-->>P01: table node to sdd CLI and the outcome line
  end
```

### 8.10 F9 — Release check of one target (realizes C002-TS-620, C002-TS-621, C002-TS-622, C002-TS-623, C002-TS-624, C002-TS-625, C002-TS-633)

```mermaid
sequenceDiagram
  %% F9 release check. Realizes C002-TS-620 C002-TS-621 C002-TS-622 C002-TS-623 C002-TS-624 C002-TS-625 C002-TS-633
  actor P01 as P-01
  participant C002_COMP_010 as Release check
  participant C002_COMP_001 as Target generator
  participant C002_COMP_002 as Mapping table and spike record
  participant C002_COMP_008 as Corpus replay reports
  participant C002_COMP_009 as Injection summary
  participant C002_COMP_011 as Checklist records
  P01->>C002_COMP_010: release-check, target copilot
  C002_COMP_010->>C002_COMP_001: regenerate at the release commit and compare with dist/copilot
  C002_COMP_010->>C002_COMP_002: enforcement mode, tested versions, S-08 outcome
  C002_COMP_010->>C002_COMP_008: differing decisions over the applicable cases, not-applicable list, expectations, host versions per mechanism
  C002_COMP_010->>C002_COMP_008: replay host capabilities against the requires fields of the cited corpora, C002-REQ-634
  C002_COMP_010->>C002_COMP_011: checklist record of the version, failed steps, host versions, hooks state enabled in both Copilot modes
  alt Copilot hooks fallback
    C002_COMP_010->>C002_COMP_011: one injection step per Copilot injection case
    C002_COMP_010->>C002_COMP_009: write the injection summary from the checklist record, hooks enabled required
  else other modes
    C002_COMP_010->>C002_COMP_009: injection cases acted upon and host versions
  end
  alt every check passes
    C002_COMP_010-->>P01: released, release record, exception flag under the hooks fallback
  else any check fails
    C002_COMP_010-->>P01: refused with ERR-REL codes, release record
  end
```

### 8.11 F10 — npm run check with the target structure checks (realizes C002-TS-601, C002-TS-602, C002-TS-603, C002-TS-604, C002-TS-605)

```mermaid
sequenceDiagram
  %% F10 npm run check. Realizes C002-TS-601 C002-TS-602 C002-TS-603 C002-TS-604 C002-TS-605
  actor P01 as P-01
  participant C002_COMP_013 as Check script
  participant C002_COMP_001 as Target generator
  participant C002_COMP_007 as Target structure checks
  participant C002_COMP_002 as Mapping tables
  P01->>C002_COMP_013: npm run check
  C002_COMP_013->>C002_COMP_013: typecheck, validate, build, tests, fixtures, 14 plugin checks, PLG-VAR-001, PLG-VER-001
  C002_COMP_013->>C002_COMP_001: generate into a fresh temporary folder
  C002_COMP_001-->>C002_COMP_013: both packages, or ERR-GEN lines
  C002_COMP_013->>C002_COMP_007: check the opencode and copilot packages and the tarball
  C002_COMP_007->>C002_COMP_002: expected grants, servers, detectors and accepted contexts
  C002_COMP_007-->>C002_COMP_013: TGT findings naming target, file and line
  C002_COMP_013->>C002_COMP_013: delete the temporary folder
  C002_COMP_013-->>P01: exit 0, or non-zero naming the target and the file
```

### 8.12 F11 — Corpus replay of one enforcement mechanism (realizes C002-TS-608, C002-TS-609, C002-TS-628, C002-TS-629, C002-TS-630, C002-TS-631, C002-TS-643, C002-TS-644, C002-TS-645, C002-TS-646, C002-TS-647)

```mermaid
sequenceDiagram
  %% F11 corpus replay with per-mechanism expectations. Realizes C002-TS-608 C002-TS-609 C002-TS-628 C002-TS-629 C002-TS-630 C002-TS-631 C002-TS-643 C002-TS-644 C002-TS-645 C002-TS-646 C002-TS-647
  actor P01 as P-01
  participant C002_COMP_008 as Corpus replay suite
  participant C002_COMP_013 as Guard corpora in tests
  participant C002_COMP_003 as OpenCode package rules, run by the pinned OpenCode binary
  participant C002_COMP_005 as sdd MCP server of the packed architect-sdd
  participant C002_COMP_012 as hook guard of the Copilot package
  P01->>C002_COMP_008: replay a target package for one mechanism
  C002_COMP_008->>C002_COMP_013: read the path and shell corpora and their SHA-256
  C002_COMP_008->>C002_COMP_008: build the fixture, with a file holding the oldString text for every Edit case on OpenCode, record platform and the host capabilities it provides as replay host
  opt OpenCode permission rules
    C002_COMP_008->>C002_COMP_003: start the pinned binary of the tested version, own OPENCODE_DB, no network at start
  end
  loop every case of both corpora
    alt identity case and the mechanism is not the OpenCode rules
      C002_COMP_008->>C002_COMP_008: list the case as not applicable, rule C002-REQ-626
    else applicable case
      alt no cwd, empty cwd or no tool name
        C002_COMP_008->>C002_COMP_008: malformed call of the mapped tool, expected deny, source C002-REQ-630
      else unknown architect sdd caller on the OpenCode rules
        C002_COMP_008->>C002_COMP_008: played by the adopter agent, expected allow, source C002-REQ-632
      else memory case
        C002_COMP_008->>C002_COMP_008: expected deny, source C002-REQ-625
      else shell corpus case of a write tool
        C002_COMP_008->>C002_COMP_008: fed as a write of the command text, expected deny, source C001-REQ-1103
      else sdd MCP server, Serena command with the plugin-data literal
        C002_COMP_008->>C002_COMP_008: expected deny, source C002-REQ-517, the server does not expand it
      else sdd MCP server, case cwd through a link to the repository
        C002_COMP_008->>C002_COMP_008: expected deny, source C002-REQ-401, the server runs at the real root
      else any other case
        C002_COMP_008->>C002_COMP_008: corpus expectation, source corpus
      end
      C002_COMP_008->>C002_COMP_008: map tool, caller, dialect and the case cwd to the mechanism input
      opt the case requires a host capability, C002-REQ-633
        C002_COMP_008->>C002_COMP_008: own input on the fixture built with the capability, actual error with the capability named when the replay host lacks it
      end
      alt OpenCode permission rules
        C002_COMP_008->>C002_COMP_003: tool call by the generated agent or the adopter agent
        C002_COMP_003-->>C002_COMP_008: refused by a rule, unavailable tool in either form, error before the rule, or tool ran
      else sdd MCP server
        C002_COMP_008->>C002_COMP_005: write_file, replace_text or run_command with its dialect
        C002_COMP_005-->>C002_COMP_008: result code, ERR-MCP-003 to ERR-MCP-006 read as allow
      else Copilot guard hooks
        C002_COMP_008->>C002_COMP_012: Copilot hook input on standard input, agent_type of the playing agent, tool_name Write, Bash or Glob from the classes file
        C002_COMP_012-->>C002_COMP_008: exit 0, or exit 2 with the deny decision
      end
      C002_COMP_008->>C002_COMP_008: actual allow, deny or error, compare, count differing
    end
  end
  C002_COMP_008-->>P01: replay report with applicable, differing and not-applicable cases, non-zero exit when any case differs
```

### 8.13 F12 — Serena command or writing command with `--cwd` decided by the bash guard core (realizes C002-TS-525, C002-TS-527, C002-TS-528, C002-TS-536, C002-TS-537)

```mermaid
sequenceDiagram
  %% F12 Serena command and --cwd confinement on every host. Realizes C002-TS-525 C002-TS-527 C002-TS-528 C002-TS-536 C002-TS-537
  participant C002_COMP_014 as Conductor running the doctor or init step, or a writing sdd command
  participant HOST as Claude Code hook, sdd MCP server or Copilot guard hook
  participant C002_COMP_012 as Bash guard core
  participant C002_COMP_018 as sdd CLI
  C002_COMP_014->>HOST: sdd serena-config with a data-folder argument, or a writing sdd command with --cwd
  HOST->>C002_COMP_012: decide the command with cwd
  alt Serena command
    C002_COMP_012->>C002_COMP_012: shape check, any --cwd denies, then the data-folder argument
    alt user-data option
      C002_COMP_012->>C002_COMP_012: allow, the CLI checks the per-user folder
    else literal CLAUDE_PLUGIN_DATA from a host that runs the command in a shell
      C002_COMP_012->>C002_COMP_012: value from the guard environment, deny when unset, then as a folder
    else literal CLAUDE_PLUGIN_DATA from the sdd MCP server, expansion off
      C002_COMP_012->>C002_COMP_012: a word with a dollar sign, not resolvable, deny
    else folder
      C002_COMP_012->>C002_COMP_012: resolve against cwd with links and case, allow only outside the repository root
    end
  else writing command with --cwd
    C002_COMP_012->>C002_COMP_012: resolve every --cwd folder against cwd with links and case, allow only at or under the repository root
  end
  alt allowed
    C002_COMP_012-->>HOST: allow
    HOST->>C002_COMP_018: run the command
    alt serena-config with a user-data folder not determinable, relative or inside the repository
      C002_COMP_018-->>C002_COMP_014: exit 2, ERR-CLI-020, nothing written
    else usable folder
      C002_COMP_018-->>C002_COMP_014: created, updated or unchanged, or the writing command's result inside the repository
    end
  else Serena folder inside the repository, --cwd outside the repository root, or a word not resolvable
    C002_COMP_012-->>HOST: deny GUARD-BASH-001 with the reason
    HOST-->>C002_COMP_014: command denied, guard message
  end
```

### 8.14 F13 — Copilot install command (realizes C002-TS-341, C002-TS-342, C002-TS-343, C002-TS-344, C002-TS-345, C002-TS-346, C002-TS-347, C002-TS-348, C002-TS-349, C002-TS-350, C002-TS-351, C002-TS-352, C002-TS-353, C002-TS-354, C002-TS-356)

```mermaid
sequenceDiagram
  %% F13 sdd install copilot. Realizes C002-TS-341 C002-TS-342 C002-TS-343 C002-TS-344 C002-TS-345 C002-TS-346 C002-TS-347 C002-TS-348 C002-TS-349 C002-TS-350 C002-TS-351 C002-TS-352 C002-TS-353 C002-TS-354 C002-TS-356
  actor P03 as P-03 in their own terminal
  participant C002_COMP_018 as sdd CLI, install copilot
  participant C002_COMP_004 as Copilot target package folder
  participant REPO as Adopter repository
  participant C002_COMP_014 as Conductor or another Architect agent
  participant C002_COMP_012 as Bash guard core
  P03->>C002_COMP_018: sdd install copilot, package option naming the unpacked folder
  C002_COMP_018->>C002_COMP_004: read architect-target.json and the agents its files list, install/plugin.json, install/mcp.json, install/hooks.template.json, hooks/tool-classes.json, check scripts/sdd.mjs exists
  alt no package, folder missing, bad manifest, missing source file or CLI copy, unparsable or empty mcp.json or hooks template, or a path with a quote, dollar, percent or backtick
    C002_COMP_018-->>P03: ERR-CLI-022 with the reason, exit 2, nothing written
  else package usable
    C002_COMP_018->>REPO: read .github/architect-install.json, .github/agents, .github/hooks/architect-guard.json, .vscode/mcp.json
    C002_COMP_018->>C002_COMP_018: each target recognised by its SHA-256 in the record, or equal to what this run writes
    alt an adopter agent file, hook file or server entry in the way, or mcp.json not strict JSON
      C002_COMP_018-->>P03: one ERR-CLI-021 line per file or server, exit 2, nothing written
    else no conflict
      Note over C002_COMP_018,REPO: guard first, so that an interrupted install never leaves agents without their guard hook
      C002_COMP_018->>C002_COMP_004: write hooks.json, the token replaced by the absolute scripts/sdd.mjs path
      C002_COMP_018->>REPO: write .github/hooks/architect-guard.json with the same PreToolUse entry
      C002_COMP_018->>C002_COMP_004: copy install/plugin.json to plugin.json, the folder becomes a plugin
      C002_COMP_018->>REPO: write the ten agents to .github/agents, temporary file then rename
      C002_COMP_018->>REPO: merge the package servers into .vscode/mcp.json, other entries kept
      C002_COMP_018->>REPO: write the install record last
      C002_COMP_018-->>P03: written, unchanged or merged lines, then the next step, exit 0
    end
  end
  C002_COMP_014->>C002_COMP_012: sdd install copilot, bare or node path sdd.mjs, any words
  C002_COMP_012-->>C002_COMP_014: deny GUARD-BASH-001, run by P-03 in their own terminal
```

## 9. As-is to to-be delta

### 9.1 As-is component view

Today's components that CHG-002 touches, shown under the C002 IDs of their modified entries (§2
names the CHG-001 component each one modifies).

```mermaid
flowchart LR
  P01([P-01 spec owner])
  subgraph CCR[Claude Code runtime]
    C002_COMP_014[Conductor]
    C002_COMP_015[Commands]
    C002_COMP_016[Skills library]
    C002_COMP_012[Hooks and guards]
  end
  C002_COMP_018[CLI front-end, plugin scripts/sdd.mjs only]
  C002_COMP_017[Plugin package and configuration]
  C002_COMP_013[Build and check tooling, Claude Code package only]
  CORE[[Workspace, lint, trace, gate, archive]]
  P01 --> C002_COMP_014
  P01 --> C002_COMP_015
  P01 --> C002_COMP_013
  C002_COMP_015 --> C002_COMP_014
  C002_COMP_014 --> C002_COMP_016
  C002_COMP_014 --> C002_COMP_018
  C002_COMP_018 --> CORE
  C002_COMP_012 --> CORE
  C002_COMP_013 -.builds and checks.-> C002_COMP_017
  C002_COMP_017 -.packages.-> CCR
```

### 9.2 What exists and what changes

| Component | As-is (CHG-001) | To-be (CHG-002) | Evidence |
|---|---|---|---|
| C002-COMP-012 (C001-COMP-08) | Bash allowlist accepts only `node <path>/sdd.mjs`, with any subcommand, any Serena data folder and any `--cwd`; probes lack `node --version`; path guard allows the memory folder; Claude hook input only | Bare `sdd …` and `node --version` accepted (C002-REQ-503); the new subcommand `install` denied in every form (C002-REQ-325); `serena-config` and `serena-launch` only with `--user-data` or a data folder outside the repository, on every host (C002-REQ-517); `--cwd` of a writing subcommand only at or under the repository root, on every host (C002-REQ-521); `memoryFolder` option; Copilot host adapter (`hook guard` keyed by `agent_type` with `--mode`, the Copilot subagent guard hook in both modes, `session-start`, `subagent-stop`); cores otherwise unchanged | current-state E-4, E-5, E-6, E-22; baseline E-13 |
| C002-COMP-013 (C001-COMP-12) | One bundle; Claude-only staging and INSTALL.md; six check steps over `plugins/architect/` | Two more bundles with license check; generator in package and check; npm staging with the template CLI-line translation and scan, and pack; build errors printed with their code; PLG-VER-001 next to the plugin checks; target checks step; corpora extended (one case per writing sdd subcommand, and one per writing subcommand with an outside `--cwd`); `targets/` excluded from the Claude Code staging | current-state E-1, E-2, E-3, E-8 |
| C002-COMP-014 (C001-COMP-01) | AskUserQuestion only; doctor rows fixed to Claude Code | Host question tool per wiring variant (`question`, `ask_user`); no-choice handling; doctor host rows (Claude Code text unchanged) | current-state E-24, E-25 |
| C002-COMP-015 (C001-COMP-09) | Doctor with eight rows and Claude Code probe; commands name `claude --agent` | Doctor host rows and sdd CLI row through variants; guard line and `$ARGUMENTS` translated per target | current-state E-14, E-16, E-17, E-28 |
| C002-COMP-016 (C001-COMP-10) | Four "Claude Code wiring" sections; toolchain record of eight rows | Same Claude Code text; variants kept in `targets/`; toolchain record host rows through a variant | current-state E-21, E-26, E-27 |
| C002-COMP-017 (C001-COMP-11) | Claude Code plugin with `.mcp.json` in Claude spelling | Adds `targets/`; README sections for OpenCode and Copilot VS Code | current-state E-10, E-13 |
| C002-COMP-018 (C001-COMP-07) | Bundled in the plugin only; templates beside the bundle or from `CLAUDE_PLUGIN_ROOT`; `sdd version` only | Same source also shipped as `architect-sdd` `sdd`; shipped templates from the folder above the running bundle first, `CLAUDE_PLUGIN_ROOT` only as the fallback (C002-IF-003 §1); `--version` (bare), `host-version`, `template show` (confined to the profile folder) and `template list`, `--user-data` (ERR-CLI-020 when not determinable, relative or inside the repository), `--read-only`, `--host copilot`, `install copilot` (guard hook in the package and the workspace hook file before the agents, package manifest; ERR-CLI-021, ERR-CLI-022, also for a package without its CLI copy) | current-state E-22; baseline E-14 |
| New | — | C002-COMP-001 … C002-COMP-011 | — |
| Unchanged | C001-COMP-02 … C001-COMP-06, C001-COMP-13 | used as they are; the sdd MCP server calls C001-COMP-03 and C001-COMP-04 in-process | baseline survey §4 note 1 |
