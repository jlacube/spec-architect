---
artifact: questions-log
change: CHG-002
phase: 10-spec
---
# CHG-002 — Questions log (spec)

## Round 1 — 2026-10-14

Questions from the spec-writer's hand-back (step 2). Options and rationale as handed back.

### Q-versions-01 — Which versions of OpenCode, VS Code + Copilot Chat and Copilot CLI does CHG-002 support?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4
- **Options:** 1. Pin spike-tested versions (Recommended) · 2. Name minimums now
- **Rejected:** latest stable without pin; refuse other versions
- **Answer:** Pin spike-tested versions (Recommended)
- **Extracted instructions:** none

### Q-cli-02 — Under which npm name is the sdd CLI published?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4
- **Options:** 1. architect-sdd, unscoped (Recommended) · 2. Scoped under P-01's npm user
- **Rejected:** install from the GitHub repository; bundled copy per target (Q-cli-01)
- **Answer:** architect-sdd, unscoped (Recommended)
- **Extracted instructions:** none

### Q-models-01 — Which models do the generated agents use on OpenCode and Copilot?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4
- **Options:** 1. Same Claude tiers (Recommended) · 2. Per-target table · 3. Host default model
- **Rejected:** model table chosen by the adopter at generation time (NG-02)
- **Answer:** Same Claude tiers (Recommended)
- **Extracted instructions:** none

## Round 2 — 2026-10-14

Questions from the spec-writer's step 3 hand-back (Q-cli-03, Q-perf-01) and the critic's review
(`90-critic-report.md`, CR-1, CR-2, CR-5).

### Q-safety-02 — How is "100% of the guard corpora" (C002-DEC-005) measured where enforcement has no agent identity and no memory folder?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 4 (CR-1)
- **Options:** 1. Per-mechanism expectations (Recommended) · 2. Mechanism-independent subset
- **Rejected:** every case with unchanged expectations (cannot pass); delete identity and memory cases (breaks the Claude Code guard tests)
- **Answer:** Per-mechanism (Recommended) — memory cases expect deny on the targets (C002-DEC-009); identity cases replay only where a non-Architect caller exists (OpenCode) and are not applicable for the MCP server and scoped hooks (C002-REQ-208, C002-REQ-302); every other case has 0 differences.
- **Extracted instructions:** none

### Q-defer-01 — If spike S-08 gives "deferred", what happens to the Copilot part of CHG-002?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 4 (CR-2)
- **Options:** 1. Revise the spec at that point (Recommended) · 2. Declare them conditional now
- **Rejected:** keep building Copilot and only refuse its release; ship instructions-only with a warning (Q-guards-03)
- **Answer:** Revise spec then (Recommended) — a deferred S-08 record triggers a revision with P-01 that removes CAP-03, SC-02 and the Copilot DoD items.
- **Extracted instructions:** none

### Q-guards-04 — Allowlisted sdd subcommands can write outside .sdd/ (sdd serena-config <dir>; serena-launch passes arguments to Serena). Close it, and where?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 5 (CR-5)
- **Options:** 1. Confine in the guard core on every host (Recommended) · 2. Confine on the generated targets only · 3. Accept as parity
- **Rejected:** remove both commands from the allowlist (breaks the doctor and init Serena step); rely on agent instructions (C002-CON-03)
- **Answer:** Confine on every host (Recommended) — the guard core allows serena-config and serena-launch only with --user-data or a folder outside the repository; one corpus case per writing subcommand; widens the C002-GOAL-05 exception to cover this Claude Code change.
- **Extracted instructions:** none

### Q-cli-03 — How closely must the installed architect-sdd version match the version a target package was generated with?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4
- **Options:** 1. Exact version match (Recommended) · 2. Same major and minor version
- **Rejected:** report the versions only, never an error; target package starts a pinned CLI through npx
- **Answer:** Exact match (Recommended)
- **Extracted instructions:** none

### Q-perf-01 — What is the time limit for generating both target packages on the reference machine?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4
- **Options:** 1. ≤ 5 s at p95 (Recommended) · 2. ≤ 30 s at p95
- **Rejected:** ≤ 1 s at p95 (no measurement supports it); no threshold (TR-04)
- **Answer:** ≤ 5 s p95 (Recommended)
- **Extracted instructions:** none

## Round 3 — 2026-10-14

Question from the architect's critic-fix hand-back (C002-IF-001 §6.3).

### Q-safety-03 — Should OpenCode decisions that are stricter than the guard, for command forms the generated agents never send, count as differences in the corpus replay?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4
- **Options:** 1. Keep 0 differences; OpenCode likely runs under sdd MCP server enforcement (Recommended) · 2. Accept stricter OpenCode decisions for a fixed list of forms
- **Rejected:** mixed mode (native edit rules + sdd MCP server for shell); OpenCode rules generated per repository at install time (C002-CON-01)
- **Answer:** Keep 0 differences (Recommended) — no spec change; the S-07 replay decides whether OpenCode runs native or under the sdd MCP server.
- **Extracted instructions:** none

## Round 4 — 2026-10-14

Questions from the critic's re-review (`90-critic-report.md`, CR-23, CR-25).

### Q-safety-04 — How do corpus cases that depend on Claude Code hook inputs the targets lack (no or empty cwd, no tool name, unknown architect:sdd-* caller) count in the 0-difference replay?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 4 (CR-23)
- **Options:** 1. Per-target expectation, as for memory cases (Recommended) · 2. Second not-applicable rule
- **Rejected:** keep the corpus expectations (can never pass); delete or rewrite these corpus cases (breaks the Claude Code guard tests, C002-GOAL-05)
- **Answer:** Per-target expectation (Recommended) — on the generated targets these cases expect deny and are sent as malformed calls (fail-closed, C002-CON-08); an unknown architect:sdd-* caller on OpenCode expects allow (the rules bind only the generated agents, C002-REQ-208); every case is still replayed and the not-applicable list stays limited to identity cases.
- **Extracted instructions:** none

### Q-guards-05 — The global option --cwd lets any allowed writing sdd command write another folder's .sdd/. Close it, and where?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 5 (CR-25)
- **Options:** 1. Restrict --cwd in the guard core on every host (Recommended) · 2. Accept the same behaviour as Claude Code · 3. Restrict on the generated targets only
- **Rejected:** deny --cwd on every command (breaks read-only uses such as BG-019); rely on agent instructions (C002-CON-03)
- **Answer:** Restrict on every host (Recommended) — writing commands may use --cwd only when the folder resolves inside the repository root of C002-IF-008 §1.1; one corpus case per writing command with an outside --cwd; widens the C002-GOAL-05 exception again.
- **Extracted instructions:** none

## Round 5 — 2026-10-15

Question from the critic's second re-review (`90-critic-report.md`, CR-32).

### Q-safety-05 — How does the release replay handle corpus cases that need a host capability the reference machine lacks (PG-163, file symbolic link)?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 5 (CR-32)
- **Options:** 1. Require the capability on the replay host (Recommended) · 2. List such cases as not replayed
- **Rejected:** keep the malformed-call rule (passes by construction); run release replays on a POSIX host (expectations and PowerShell cases need win32); rewrite PG-163 as a directory junction (changes a CHG-001 corpus case)
- **Answer:** Require it on the host (Recommended) — release replays run on REF-WIN with Developer Mode on (or an elevated replay run); the release check refuses a report whose host lacks a capability a corpus case needs; every case is really replayed.
- **Extracted instructions:** none

## Round 6 — 2026-10-17

Question from the critic's D-003 review (`90-critic-report.md`, CR-37).

### Q-safety-06 — On Copilot the host lets the conductor start its built-in subagents (general-purpose, task, explore, …), which run outside the Architect tool lists. What does the spec require?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 5 (CR-37)
- **Options:** 1. Verify, and refuse the release if the gap is real (critic's recommendation) · 2. Add a deny hook for built-in subagents in Architect repositories · 3. Accept as a flagged residual risk
- **Rejected:** remove the agent tool from the conductor (C002-REQ-107); rely on the conductor's prompt (C001-NFR-201)
- **Answer:** P-01: "I lean also for option 2" — a plugin-level PreToolUse hook, in both Copilot enforcement modes, denies edit and terminal calls whose `agent_type` is a host built-in agent when the repository contains `.sdd/` (plugin-level hooks carry `agent_type` on subagent calls, S-08 §2.3, §3.1); the adopter's own use of built-in subagents for edits and commands in such a repository is blocked, accepted as the cost.
- **Extracted instructions:** none

### Q-safety-07 — Scope of the Copilot subagent guard hook (C002-REQ-327, C002-REQ-328)
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 2
- **Options:** 1. Accept: in a repository with `.sdd/`, every subagent whose `agent_type` is not one of the ten Architect agents (host built-ins and the adopter's own agents) is denied edit and terminal calls; unclassified tools are denied (fail-closed), so such subagents keep read-only tools only (Recommended) · 2. Built-ins only: deny a fixed list of host built-in agent names
- **Rejected:** none beyond the options
- **Answer:** Accept (Recommended)
- **Extracted instructions:** none

## Round 2026-10-19 — revision D-010 … D-014

### Q-hooks-row-01 — Copilot doctor hooks row when Workspace Trust and policy cannot be read (D-012, C002-REQ-510)
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 3
- **Options:** 1. ok + caveat: `ok` when `chat.useHooks` is on, the row text says Workspace Trust and organisation policy were not read, the manual VS Code checklist confirms them (Recommended) · 2. New `warning` status · 3. Read trust and policy (VS Code internal storage, new spike)
- **Rejected:** none beyond the options
- **Answer:** P-01: "ok + caveat (Recommended)"
- **Extracted instructions:** none

### Q-safety-08 — Per-mechanism replay expectations for D-014 (C002-IF-009 §2.1)
- **Blocking:** no · **Material:** no · **Candidates considered:** 2
- **Options:** 1. Confirm the three deny rows: shell-corpus write-tool cases (BG-268 class) on every mechanism; on the sdd MCP server the Serena cases with the literal `${CLAUDE_PLUGIN_DATA}` (no shell, no expansion) and PG-135/PG-136 (cwd through a junction) (Recommended) · 2. Replay PG-135/PG-136 with a server rooted at the junction
- **Rejected:** none beyond the options
- **Answer:** P-01: "Confirm three deny rows (Recommended)"
- **Extracted instructions:** none

### Q-release-hooks-01 — Release check against an inconsistent hooks record (C002-IF-009 §5, C002-REQ-615, C002-REQ-629)
- **Blocking:** no · **Material:** yes · **Candidates considered:** 5
- **Options:** 1. Release check refuses a checklist record whose `hooks_state` contradicts its `hooks_sources`, under ERR-REL-010 (Recommended) · 2. Leave it to the review of the record (C002-TC-618)
- **Rejected:** derive `hooks_state` in the check and ignore the stored field (two sources of truth); new error code (ERR-REL-010 covers it); drop `hooks_state` from the record (format just revised)
- **Answer:** P-01: "Refuse under ERR-REL-010 (Recommended)"
- **Extracted instructions:** none

## Round 2026-10-20 — revision D-015 … D-017

### Q-mcp-errors-01 — MCP error results and the advertised output schema (D-017, C002-IF-002 §3)
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 2
- **Options:** 1. Error results carry text content only (`isError: true`, first line `ERR-MCP-nnn: …`), no `structuredContent` (Recommended) · 2. Advertise an output schema that is a union of the success and the error shape
- **Rejected:** none beyond the options
- **Answer:** P-01: "No structured error (Recommended)"
- **Extracted instructions:** none

### Q-openrouter-02 — OpenRouter account balance exhausted during C002-T-056 (HTTP 402)
- **Blocking:** yes · **Material:** no · **Candidates considered:** 2
- **Options:** 1. P-01 tops up the account; the $40 stop rule stays · 2. Pause OpenCode evals
- **Answer:** P-01: "Topped up / will top up"
- **Extracted instructions:** none

### Q-checklist-rerun-01 — Re-runs of checklist steps (critic CR-52; C002-REQ-615, C002-REQ-618, C002-IF-009 §4/§5)
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 2
- **Options:** 1. Failures stay binding: earlier runs in a structured field; a step with an earlier `failed` run refuses the release (ERR-REL-004) unless the re-run is the allowed one (a hooks source changed, settings restored, group re-run) (Recommended) · 2. Last run wins (earlier failures only in a free-text note)
- **Answer:** P-01: "Failures stay binding (Recommended)"
- **Extracted instructions:** none

### Q-checklist-restricted-01 — TS-516 restricted-mode row when VS Code blocks the chat (critic CR-53; D-015 item 8)
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 3
- **Options:** 1. The row passes when VS Code itself refuses the chat or the doctor prompt in restricted mode, the note quoting what VS Code showed; if VS Code runs the prompt, the doctor row must read `ok` + caveat (Recommended) · 2. Drop the restricted-mode rows · 3. Keep failed
- **Answer:** P-01: "Blocked chat passes (Recommended)"
- **Extracted instructions:** none

### Q-cli-model-01 — Conductor model on Copilot CLI non-interactive sessions (D-019 item 1, C002-IF-010)
- **Blocking:** yes (for C002-T-054) · **Material:** yes · **Candidates considered:** 2
- **Options:** 1. The runner passes `--model` from the agent file so the conductor runs on its tier; the spec notes CLI users choose the model themselves (Recommended) · 2. Accept the host default (sonnet) as a known host limitation
- **Answer:** P-01: "Pass --model (Recommended)"
- **Extracted instructions:** none

### Q-openrouter-03 — OpenRouter top-up before resuming C002-T-056
- **Answer:** P-01: "Yes, topped up" (2026-10-20)

## Round 2026-10-20 (2) — revision D-018 … D-020

### Q-opencode-glob-01 — OpenCode glob does not list dot folders (D-020 item 1)
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 2
- **Options:** 1. Guide agents: the generated OpenCode agent and skill texts find `.sdd/` files with `sdd status`, `read` or the sdd MCP server's tools, never `glob` (wiring variant) (Recommended) · 2. Known host limitation, TS-511 waived
- **Answer:** P-01: "Guide agents (Recommended)"
- **Extracted instructions:** none

### Q-ts634-budget-01 — TS-634 on OpenCode exceeds the session cap (D-020 item 2)
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 3
- **Options:** 1. Smaller fixture or shorter rework path within $0.50 (Recommended) · 2. Budget exception: this case up to $1.00 per session, one run plus one rerun on failure · 3. Waive the row
- **Answer:** P-01: "Budget exception $1"
- **Extracted instructions:** none

### Q-replay-rule-01 — A platforms-limited case listed with another not-applicable rule (C002-IF-009 §5, TS-637, TS-682)
- **Blocking:** no · **Material:** no · **Candidates considered:** 2
- **Options:** 1. Refuse under ERR-REL-012 "lists cases as not applicable without a rule" (Recommended) · 2. Accept any rule value
- **Answer:** conductor recommendation (option 1, fail-closed), confirmed by P-01 at G2 on 2026-10-20 ("Approve with waivers").
- **Extracted instructions:** none

### Q-capped-runs-01 — TS-634 sessions ended by a cap a later exception raised (plan critic CR-38)
- **Options:** 1. Not runs: a written rule marks sessions ended by a cap that a later approved exception raised `valid_run: false`; TS-634 gets one run at $1 plus one rerun on failure (Recommended) · 2. Count them
- **Answer:** P-01: "Don't count them (Recommended)"

### Q-copilot-pool-01 — Scope of the $30 Copilot stop
- **Options:** 1. Copilot CLI eval sessions the harness records only; the manual VS Code runs (T-050, T-057) stay under P-01's watch of GitHub's usage view (Recommended) · 2. CLI and VS Code sessions in one total
- **Answer:** P-01: "CLI evals only (Recommended)"

### Q-rerun-scope-01 — OpenCode rows to rerun after the file-inspection variant (D-020)
- **Options:** 1. TS-511 and TS-634 only; T-049 reruns routing and injection on the release candidate (Recommended) · 2. Also the passed doctor rows (~17 sessions)
- **Answer:** P-01: "TS-511 and TS-634 (Recommended)"

### Q-exec-lookup-01 — PATH-only lookup for every executable the sdd CLI starts (critic CR-63 follow-up)
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4
- **Options:** 1. Extend the rule to every executable the CLI starts (git in `sdd gate`, serena in `sdd serena-launch`, the probes): resolved over the PATH folders only, run by absolute path (Recommended) · 2. Separate defect after this revision
- **Rejected:** accept as a known platform condition (repository content is untrusted); only set NoDefaultCurrentDirectoryInExePath (unverified for Node/libuv)
- **Answer:** P-01: "Fix everywhere now (Recommended)"
- **Extracted instructions:** none

## Round 2026-10-20 (3) — revision D-021, D-022

### Q-ts634-budget-02 — TS-634 on OpenCode still exceeds its 1.00 USD cap exception (C002-T-056)
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 3
- **Options:** 1. One run at 2.00 USD (exception raised to 2.00 for one more run, no further rerun; a failure is recorded and waived) (Recommended) · 2. Smaller fixture (one specialist in the rework), one run within 1.00 · 3. Waive the row
- **Answer:** P-01: "One run at $2 (Recommended)"
- **Extracted instructions:** none
