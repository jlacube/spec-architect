# Changelog

All notable changes to the Architect plugin suite (`plugins/architect`, `architect-plugin`). Versions
follow semantic versioning; `0.0.x` were development installs (C001-M-1 … M-6), `0.1.0` is the first
release of CHG-001 (`.sdd/001-architect-agent-suite/20-plan/75-rollout.md`).

## 0.1.1 — release commit `2fec7a8` (2026-11-18, not yet tagged)

Patch release of CHG-005 "0.1.1 fixes" (`.sdd/005-0-1-1-fixes/`): the known gaps of 0.1.0 (CHG-001 defects D-032,
D-034, D-035) and the problems found while dogfooding it. Release notes, with the steps for workspaces made with
0.1.0: `docs/releases/github-release-notes-0.1.1.md`. Evidence: `docs/release-0.1.1-evidence.md`.

### Fixed

- **New-change procedure on every create-change request** (C005-REQ-101, 102, 123, 124; D-032): the conductor
  proposes the profile from a size estimate and asks for the kind in the same round, also when the change is
  asked for in plain words; a kind answer that names no kind gets a further round.
- **Pre-phase interview rounds** (C005-REQ-103, 104, 126; D-034): an answer given after G1 or G2 and before the
  next phase starts is logged in that phase's `questions-log.md`, marked as pre-phase; the lint accepts the file.
- **Reporting without the plugin** (C005-REQ-105 to 111; D-035): hand-offs, `SDD.md` and the plugin README give
  `npm install -g architect-sdd@<version>` and bare `sdd` commands; new lint rule LINT-HAND-003 reports a hand-off
  without a versioned install line while the plan is open.
- **Archive preconditions** (C005-REQ-112 to 115): the task marked as the change's archive task is skipped; the
  tasks of a lite plan count; new lint rule LINT-TASK-005 reports more than one marked task.
- **Lite plan approval hash** (C005-REQ-121, 122): the report-field lines of lite task sections are outside the
  `20-plan` hash, so task reports keep the plan approved. A lite plan approved with 0.1.0 needs one G3
  re-approval with 0.1.1 (C005-REQ-125).
- **Report-field placement** (C005-REQ-127; CHG-005 defect D-001): `sdd task set` writes a new report field after
  the section's last field line and its continuation lines.
- **Archived changes** (C005-REQ-116, 117): read-only subcommands find a change under `.sdd/_archive/` by number;
  writing subcommands refuse it with ERR-CLI-014, exit code 2.

### Release evidence

- `npm run check` on Windows 11 at the release commit; eval floor DOD-G-01 on Claude Code, every case at its
  floor, 46.43 USD notional (`docs/release-0.1.1-evidence.md`, sections "Check" and "Evals").

## 0.1.0 — release candidate `b6f1509` (2026-11-07, not yet tagged)

First release of the Architect spec-driven-development suite for Claude Code (CHG-001), from the
release gate C001-T-072. The tag `v0.1.0` is created locally, without a push, once the clean-profile
install C001-TC-1102 passes. Evidence for every DoD item: `docs/release-0.1.0-evidence.md`.

### Added

- **Ten agents** (C001-IF-09): `sdd-conductor` (main session, `claude --agent architect:sdd-conductor`)
  and the nine specialists `sdd-researcher`, `sdd-cartographer`, `sdd-options-analyst`,
  `sdd-spec-writer`, `sdd-test-designer`, `sdd-architect`, `sdd-planner`, `sdd-critic`, `sdd-auditor`,
  with fixed model routing, least-privilege tool grants and preloaded skills.
- **Thirteen commands** (C001-IF-10): `/architect:init`, `new`, `ideate`, `specify`, `plan`, `revise`,
  `gate`, `status`, `lint`, `decide`, `research`, `archive`, `doctor`.
- **Eighteen skills**: the phase procedures (`phase-ideation`, `phase-spec`, `phase-plan`), the
  protocols (`interview-protocol`, `gate-protocol`, `research-protocol`) and the authoring know-how
  (`sdd-conventions`, `ears-requirements`, `user-stories`, `nfr-catalogue`, `acceptance-scenarios`,
  `dod-catalogue`, `diagramming`, `architecture-decisions`, `planning`, `options-analysis`,
  `critique-rubrics`, `code-discovery`).
- **The `sdd` CLI** (`plugins/architect/scripts/sdd.mjs`, one bundled file, no runtime dependency;
  C001-IF-01): workspace and registry (`init`, `status`), changes and IDs (`change new|profile|revise|stop`,
  `id next|tombstone`), 60 lint rules and the trace graph (`lint`, `trace`), gates with approval hashes
  and stale detection (`gate show|approve|record`, `hash`, `stale check`), tracking (`task set`,
  `defect add|close|reopen`), `archive` into `_living/`, and the Serena launcher.
- **Hooks** (C001-IF-07): the path and Bash guards for Architect agents (PreToolUse), quick lint after
  `.sdd/` writes (PostToolUse), trace refresh after authoring subagents (SubagentStop) and the
  workspace brief (SessionStart).
- **Workspace templates** for the full and lite profiles and the constitution (gate G0).
- **Code intelligence** with a fallback ladder: ripwire, Serena (read-only mode, data folder outside
  the repository), LSP, grep/glob, ast-grep; Context7 and DeepWiki for research.
- **Evals**: the scripted-session harness with dev, milestone and release tiers (C001-ADR-003), the
  routing suite (42 `claude plugin eval` cases) and the injection suite (22 cases).
- **`npm run check`**: typecheck, plugin validation, build, tests, lint fixtures, encoding scan,
  plugin and target structure checks, the `architect-sdd` tarball check and coverage, on Windows 11
  under PowerShell 7 and Git Bash with Node 20 and 22.

Also in this version, from CHG-002 (multi-platform targets; released through their own channels by
CHG-002, not by this tag): the generated Copilot and OpenCode target packages (`npm run package`),
the `architect-sdd` npm package (bins `sdd`, `sdd-mcp`), the sdd MCP server, `sdd install copilot`,
`sdd template show|list`, `sdd host-version` and `sdd --version`.

### Release evidence

- Release evals (2026-10-28 – 2026-11-07, 350.95 USD notional): routing 350 / 350 runs after re-grade;
  release-high 22 rows, each ≥ 9 / 10; release-standard 70 rows, each 3 / 3; injection 110 valid runs,
  0 acted upon (`docs/release-0.1.0-evidence.md` §4.7).
- `npm run check` exit 0 at `b6f1509` on Node 22.22.3 and 20.20.2, in Git Bash and
  PowerShell 7; coverage 95.60% lines and 83.2% branches over `src/` (evidence §2.1). Interface review
  (DOD-G-04): evidence §9.

### Known limitations

- Tested on Windows 11 only (macOS and Linux untested, plan critic CR-8).
- Node 20's test runner cannot merge coverage; coverage is measured on Node 22 (C001-NFR-502).
- C001-NFR-304 (graceful degradation over three configurations) and the token figures of
  C001-NFR-106 / 701 are measured by the dogfood tasks C001-T-073 and C001-T-074, after this release.

### Development versions

- `0.0.3` (2026-10-28, C002-T-074) — conductor text fallback without a question tool (C001-T-084);
  Copilot release candidate.
- `0.0.2` (2026-10-28, C002-T-073) — INJ-21 session cap on OpenCode.
- `0.0.1` — development installs of milestones C001-M-1 … M-6.
