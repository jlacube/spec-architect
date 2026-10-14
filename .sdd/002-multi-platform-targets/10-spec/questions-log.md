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
