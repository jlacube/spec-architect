---
id: C002-SPEC-CTX-03
artifact: spec/context/scope
change: CHG-002
phase: 10-spec
status: draft
traces_to: [ideation §5, ideation §8, ideation §10]
---
# Scope, assumptions, constraints and dependencies

## 1. In scope

Source: [ideation §5](../../00-ideation/ideation.md) (scope boundary) and §8 (design direction).
The hook coverage per target is the table "Hooks per target" of ideation §5; its "in" cells are in
scope through the capabilities below, its "later" cells are listed in §2.

| Item | Capability |
|---|---|
| Generator: neutral model, mapping tables, skill inlining, wiring variants, target packages written by `npm run package` | C002-CAP-01 |
| OpenCode target package: agents, commands, skills, `opencode.json` with per-agent permission blocks and MCP configuration; interviews and gates through the `question` tool; post-write quick lint when spike S-07 finds a feedback channel; the sdd MCP server as fallback | C002-CAP-02 |
| Copilot VS Code target package: custom agents, prompt files, skills, workspace MCP configuration, and the Copilot install command that writes the workspace agents and MCP servers into the adopter's repository; interviews and gates through `ask_user`; session-start brief and SubagentStop trace hooks; the Copilot subagent guard hook in both enforcement modes (Q-safety-06); the Copilot hooks fallback with Copilot guard hooks (C002-DEC-005 exception) | C002-CAP-03 |
| sdd MCP server: guarded `.sdd/` writes, allowlisted commands, quick-lint findings with each write (C002-DEC-001) | C002-CAP-04 |
| `architect-sdd` on npm (C002-DEC-007); the Bash allowlist accepting a bare `sdd` command and `node --version` (with D-011 of CHG-001) and confining `sdd serena-config` and `sdd serena-launch` to a data folder outside the repository on every host (Q-guards-04); the doctor on every target | C002-CAP-05 |
| Per-target structure checks; corpus replay against each enforcement mechanism; OpenCode and Copilot CLI eval runners; the manual VS Code checklist (C002-DEC-003); the release check per target (C002-DEC-005); the Claude Code regression set | C002-CAP-06 |
| Per-target README sections and install notes | C002-CAP-02, C002-CAP-03 |

Spikes S-07 (OpenCode) and S-08 (Copilot VS Code) come first in the plan (ideation §8, Verification);
they settle the assumptions of §3 and are plan tasks, not capabilities.

### 1.1 Copilot target deferred by spike S-08

If the spike S-08 record gives the enforcement mode `deferred` (Copilot subagents not confined to their
tool list and Copilot guard hooks not blocking a subagent's tool calls; C002-DEC-005, C002-AS-03), that
record triggers a revision of this spec with P-01 (Q-defer-01, spec round 2, `../questions-log.md`).
The revision removes C002-CAP-03, C002-SC-02 and the DoD items that cover the Copilot target, and
reviews every other item that names the Copilot target; the OpenCode release is not affected (it is in CHG-003, §2). Until that
revision the release check refuses the Copilot target (C002-REQ-620). The signed-off S-08 record gives
`sdd-mcp-server` (`docs/spikes/S-08-copilot-vscode.md §4`), so this section applies only to a later
spike record of a new tested version (C002-REQ-621).

## 2. Out of scope

- C002-NG-01 … C002-NG-04 (`problem-and-goals.md` §4).
- The OpenCode release and its release evidence: moved to a later change, CHG-003 "OpenCode release"
  (defects D-035, D-036; Q-opencode-scope-01; `problem-and-goals.md` §2.1). The OpenCode target
  generator, package, replays and the evidence built so far stay in CHG-002 as delivered work.
- On OpenCode, "later" in the ideation §5 hook table: the session-start brief (no documented context
  injection), the SubagentStop trace (the auditor runs the trace at gates instead), and the post-write
  quick lint when spike S-07 finds no feedback channel.
- Other hosts (Codex, Cursor and others) once the generator exists; Agent Plugins 1.0 packaging if the
  targets converge on it (ideation §5, Later).
- Any change of behaviour on Claude Code other than the bash guard changes of C002-GOAL-05
  (C002-REQ-503, C002-REQ-517, C002-REQ-521).

## 3. Assumptions

Carried from ideation §10, plus the OpenCode condition of ideation §8 (Enforcement per target).
Spikes S-07 and S-08 confirm or refute them.

| ID | Assumption | If wrong |
|---|---|---|
| C002-AS-01 | [ASSUMPTION: R-001] OpenCode splits compound commands and checks each part against `permission.bash` (C002-R-001 C-04). Partly refuted by S-07 on OpenCode 1.18.31: piped parts are checked alone, but redirection targets, a trailing `;` and `$((…))` are not (`docs/spikes/S-07-opencode.md §3.3`, fact F-3) | The shell boundary on OpenCode moves to the sdd MCP server |
| C002-AS-02 | [ASSUMPTION: R-001] OpenCode's permission engine, configured per agent, decides every case of the guard corpora as expected, including `..` segments, links, redirection and the Windows shell (C002-R-001 C-02, C-03, C-04). Refuted on the hand-replayed sample of S-07 on OpenCode 1.18.31 (`docs/spikes/S-07-opencode.md §3`, facts F-2 … F-4), so the record gives `sdd-mcp-server`, provisional until the full corpus replay (§8) | OpenCode agents lose their edit and shell tools and use the sdd MCP server, as on Copilot VS Code (ideation §8) |
| C002-AS-03 | VS Code Copilot confines a subagent to its tool list (C002-R-001 A-08, A-11). Settled by S-08: confined in the local agent host (`docs/spikes/S-08-copilot-vscode.md §3.1`, §3.2); the part "loads a plugin's `.mcp.json`" is refuted (plugin MCP servers are not started, §3.2, fact F-2) and replaced by workspace MCP servers (C002-REQ-307, C002-REQ-323) | For a later tested version whose record shows subagents not confined: the Copilot hooks fallback applies (C002-DEC-005 exception); if Copilot guard hooks do not block a subagent's tool calls either, the Copilot target is deferred to a later change and OpenCode still ships (§1.1) |
| C002-AS-04 | Copilot CLI loads the Copilot target package and honours agent tool lists as VS Code does. Settled by S-08: `--plugin-dir` loads agents, hooks and `.mcp.json`, and subagents are confined (`docs/spikes/S-08-copilot-vscode.md §2.1`, §2.4); agents are named `<plugin>:<agent>` (§2.3, fact F-6) | For a later tested version that does not load the package: Copilot evals cover the sdd MCP server in isolation; the Copilot injection cases move to the manual VS Code checklist |
| C002-AS-05 | [ASSUMPTION: Q-cli-01] Publishing `architect-sdd` to the npm registry is possible (name available, publishing account) | Agents on the generated targets use the bundled CLI through a per-target path (Q-cli-01 option 2) |

### 3.1 Tested hosts of spikes S-07 and S-08

Spike S-07 was signed off by P-01 on 2026-10-18 and re-tested on OpenCode 1.18.31, which P-01
confirmed as the tested version (Q-s07-01, Q-s07-02, `../../20-plan/questions-log.md` round 11).
Its enforcement mode is `sdd-mcp-server`, provisional until the full corpus replay
(`docs/spikes/S-07-opencode.md §8`; frontmatter `host_versions`). The host it tested, and the
conditions under which replay and evals use that host:

- **OpenCode 1.18.31** on REF-WIN, with `@opencode-ai/sdk` and `@opencode-ai/plugin` 1.18.31
  (§1); the model of each Claude model tier is the record's `host_versions.models` entry (§7;
  C002-REQ-105). The first run on OpenCode 1.15.10 (§1.1) does not make 1.15.10 a tested version.
- **Pinned host binary.** The `opencode` that PATH resolves need not be the tested one: on REF-WIN
  the Windows PATH resolves the npm shim `opencode.cmd`, and the Git Bash PATH finds another OpenCode
  install first (fact F-7). The corpus replay suite and the OpenCode eval runner therefore start the
  pinned host binary, with a database of their own (`OPENCODE_DB`) instead of the user's shared
  OpenCode database, which another OpenCode version migrates (fact F-8). The doctor reports the
  `opencode` that PATH resolves in its shell, so another install shows as `untested` (C002-REQ-508).
- **Node.js for the OpenCode JS SDK.** The Node.js floor of the SDK (row "OpenCode server and JS SDK"
  of §5 of this file; fact F-10) binds the machine that runs the OpenCode eval runner and the corpus replay
  (REF-WIN, upgraded by P-01, Q-s07-02), not `architect-sdd`.

Spike S-08 was signed off by P-01 on 2026-10-17 with enforcement mode `sdd-mcp-server`
(`docs/spikes/S-08-copilot-vscode.md §4`; frontmatter `host_versions`). The hosts it tested are:

- **VS Code Insiders 1.142.0-insider with GitHub Copilot Chat 0.35.3**, Local session type, whose
  chat runs in the local agent host (Copilot SDK agent host; §3). The Copilot Chat version is the one
  P-01 confirmed for the tested build (Q-versions-02, `../../20-plan/questions-log.md` round 7). The
  Copilot CLI session type of VS Code was not used: it does not offer the package's agents (§3).
- **Copilot CLI 1.0.98**, standalone (§2).

The facts of the S-08 record that contradict the earlier platform assumptions (F-1 … F-7, §5) are
taken into C002-CAP-03, C002-REQ-103, C002-REQ-211, C002-REQ-612 and C002-REQ-614 by the revision for
defect D-003. The facts of the S-07 record (F-1 … F-10, `docs/spikes/S-07-opencode.md §9`) are taken
into this section, C002-REQ-214, C002-REQ-217, C002-REQ-606, C002-REQ-610, C002-REQ-621 and the
interfaces by the revision for defect D-009.

## 4. Constraints

CHG-001's constraints (C001-CON-01 … 16) apply unchanged unless a CHG-002 requirement modifies them;
the architecture step of this spec reviews C001-CON-02 (one bundled file; the sdd MCP server adds a
bundled entry) and C001-CON-03 (distribution as a Claude Code plugin; CHG-002 adds generated packages).

| ID | Constraint | Source |
|---|---|---|
| C002-CON-01 | The source plugin is the only source of every target package; no target package is maintained by hand | C002-DEC-006 |
| C002-CON-02 | Generated files are written outside `plugins/architect/agents/` and `plugins/architect/scripts/` | C002-DEC-006; current-state E-2, E-13 |
| C002-CON-03 | A target is released only when its write/shell boundary is enforced by an enforcement mechanism; a boundary that relies on agent instructions alone is never released | C002-DEC-005 |
| C002-CON-04 | The sdd MCP server is a stdio process that the host starts with a session and stops with it; it is not a daemon and opens no network connection | C002-DEC-001; constitution, forbidden technologies; C001-CON-12 |
| C002-CON-05 | Requirements that change CHG-001 behaviour are `MODIFIED` deltas citing the C001 requirement; their LINT-DELTA-001 findings are waived at G2 and G3 until C001-T-075 archives CHG-001 | C002-DEC-008 |

## 5. External dependencies

| Dependency | Version policy | Required? | Used by | License |
|---|---|---|---|---|
| OpenCode | Tested version: the OpenCode version recorded by spike S-07, which validated the target (OpenCode 1.18.31, started as the pinned host binary for replay and evals; §3.1); shown by the doctor and re-checked before each release (Q-versions-01) | Yes, for the OpenCode target | P-03 on OpenCode; OpenCode eval runner | host application, not bundled |
| VS Code with GitHub Copilot Chat | Tested versions: the VS Code and GitHub Copilot Chat versions recorded by spike S-08, which validated the target (VS Code Insiders 1.142.0-insider with GitHub Copilot Chat 0.35.3, Local session type; §3.1); shown by the doctor and re-checked before each release (Q-versions-01) | Yes, for the Copilot VS Code target | P-03 on Copilot VS Code; manual VS Code checklist | host application, not bundled |
| Copilot CLI | Tested version: the Copilot CLI version recorded by spike S-08 for the eval runner (1.0.98; §3.1) and re-checked before each release (Q-versions-01); not shown by the doctor (eval tool only) | Evals only (C002-NG-01) | Copilot CLI eval runner | host application, not bundled |
| npm registry | package `architect-sdd`, unscoped, published by P-01 (Q-cli-02) | Yes, for `architect-sdd` | P-01 (publish), P-03 on the generated targets (install) | service |
| Node.js | 20 or later on the PATH (constitution); unchanged by the floor of the OpenCode JS SDK (next row), which `architect-sdd` does not bundle (C002-NFR-402) | Yes | `sdd` executable of `architect-sdd`, sdd MCP server | MIT |
| OpenCode server and JS SDK | pinned with the OpenCode version (1.18.31; §3.1); needs Node.js 22.22.2 or later on the machine that runs them (S-07 fact F-10) | Evals only | OpenCode eval runner (C002-R-001 D-02); corpus replay suite on OpenCode | checked against the license allowlist when the eval dependency is added |
| Claude Code, ripwire, Serena, ast-grep, Context7, DeepWiki | as in CHG-001 `10-context/scope.md` §5 | as in CHG-001 | as in CHG-001; Serena's context on each generated target is an open research item (baseline survey §4 note 6) | as in CHG-001 |

## 6. Change dependencies

- CHG-001 is not archived. CHG-002's deltas cite CHG-001 requirements under C002-CON-05; C001-T-075
  (archive CHG-001) must precede CHG-002's archive (C002-DEC-008).
- Defect D-011 of CHG-001 (`node --version` denied) overlaps the allowlist change and stays open until
  the CHG-002 task that implements it is done; CHG-001's archive waits for that task (ideation §5).
- Evidence for the current behaviour that the deltas change: `current-state.md` (cartographer).
