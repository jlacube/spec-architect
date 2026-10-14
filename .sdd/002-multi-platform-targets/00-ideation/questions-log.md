---
artifact: questions-log
change: CHG-002
phase: 00-ideation
---
# CHG-002 — Questions log (ideation)

## Round 1 — 2026-10-13

Restatement shown with the round: Architect runs only on Claude Code; teams on GitHub Copilot or
OpenCode cannot use its spec-driven workflow. CHG-002 makes the same suite run on other platforms,
generated from the one Claude plugin source, at the same safety level. Starting research:
`PORTING-STUDY.md`. CHG-002 is also CHG-001's brownfield dogfood (C001-T-074).

### Q-scope-01 — Which targets are in scope for CHG-002?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 4 (`PORTING-STUDY.md` §1)
- **Why it matters:** sets the size of the change and which enforcement mechanisms are needed.
- **Options:**
  1. OpenCode + Copilot VS Code (Recommended) — the two interactive targets with the best fit
  2. OpenCode only first — smallest change; Copilot later
  3. OpenCode + all Copilot — adds Copilot CLI (partial fit)
- **Rejected:** Copilot cloud agent — runs unattended, cannot hold a gate
- **Sources:** `PORTING-STUDY.md` §1
- **Answer:** OpenCode + Copilot VS Code (Recommended)
- **Extracted instructions:** none → C002-DEC-004

### Q-safety-01 — Safety bar on a target where hooks can't identify the calling agent (Copilot today)?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 3 (`PORTING-STUDY.md` §3.6)
- **Why it matters:** decides whether a target may ship without an enforced write/shell boundary.
- **Options:**
  1. Same as Claude (Recommended) — a target ships only when the boundary is enforced
  2. Ship with a warning — instructions-only safety, flagged in the README
- **Rejected:** none presented
- **Sources:** `PORTING-STUDY.md` §3.6, C001-NFR-201
- **Answer:** Same as Claude (Recommended)
- **Extracted instructions:** none → C002-DEC-005

### Q-source-01 — How are the target packages produced?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 2 (`PORTING-STUDY.md` §4)
- **Why it matters:** decides between one source of truth and per-target copies that drift.
- **Options:**
  1. Generated from plugins/architect (Recommended) — one canonical source, structure checks on every output
  2. Maintained copies — simpler start, drifts over time
- **Rejected:** none presented
- **Sources:** `PORTING-STUDY.md` §4
- **Answer:** Generated from plugins/architect (Recommended)
- **Extracted instructions:** none → C002-DEC-006

### Q-cli-01 — How do agents on other targets reach the sdd CLI?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 2 (`PORTING-STUDY.md` §3.5)
- **Why it matters:** `${CLAUDE_PLUGIN_ROOT}` does not exist on the other targets.
- **Options:**
  1. npm package + bundled (Recommended) — `architect-sdd` with `bin: sdd`; Claude keeps its bundled copy
  2. Bundled copy per target — no npm publishing
- **Rejected:** none presented
- **Sources:** `PORTING-STUDY.md` §3.5
- **Answer:** npm package + bundled (Recommended)
- **Extracted instructions:** none → C002-DEC-007

## Round 2 — 2026-10-14

Questions merged from the specialists' hand-backs (C002-OA-001, C002-OA-002, C002-R-001).

### Q-guards-01 — How should Architect enforce the write/shell boundary on Copilot in VS Code?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 5 (C002-OA-001)
- **Why it matters:** sets the size of the Copilot target and whether its boundary fails closed or open.
- **Options:**
  1. sdd MCP write server (Recommended) — 3.70, fails closed
  2. Agent-scoped hooks — 3.60, Preview, fails open when hooks are off
- **Rejected:** tool-list restriction only; VS Code extension; defer Copilot (see C002-OA-001)
- **Sources:** C002-OA-001, C001-NFR-201, `PORTING-STUDY.md` §3.6
- **Answer:** sdd MCP write server (Recommended)
- **Extracted instructions:** none → C002-DEC-001

### Q-skills-01 — How should specialists get their procedure skills on OpenCode and Copilot?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 5 (C002-OA-002)
- **Why it matters:** decides whether the procedures are reliably in context and how the skill budgets apply.
- **Options:**
  1. Inline at generation (Recommended) — 4.45
  2. Hybrid — 4.25
  3. Load instruction in body — 3.55
- **Rejected:** host file include; command- or fork-based delivery (see C002-OA-002)
- **Sources:** C002-OA-002, C001-NFR-105
- **Answer:** Inline at generation (Recommended)
- **Extracted instructions:** none → C002-DEC-002

### Q-eval-01 — How should the Copilot target's VS Code behaviour be tested?
- **Blocking:** no · **Material:** yes (it sets a release-gate condition) · **Candidates considered:** 2 (C002-R-001)
- **Why it matters:** VS Code has no headless chat mode; scripted evals can only use Copilot CLI.
- **Options:**
  1. CLI evals + manual VS Code checklist (Recommended)
  2. Manual VS Code checks only
- **Rejected:** none presented
- **Sources:** C002-R-001
- **Answer:** CLI evals + manual VS Code checklist (Recommended)
- **Extracted instructions:** none → C002-DEC-003

## Round 3 — 2026-10-14

Questions from the critic's readiness review (`critic-report.md`, CR-1, CR-2, CR-3, CR-14).

### Q-sequence-01 — How should CHG-002's spec cite the CHG-001 requirements it changes while CHG-001 is not archived?
- **Blocking:** no (needed before the spec's first delta) · **Material:** yes · **Candidates considered:** 4 (CR-1)
- **Why it matters:** LINT-DELTA-001 refuses MODIFIED deltas whose cited ID is not in `_living/`; CHG-001's archive (C001-T-075) waits for this dogfood (C001-T-074).
- **Options:**
  1. Cite + waive at G2/G3 (Recommended) — temporary waiver; IDs reach `_living/` at C001-T-075
  2. Lint accepts active earlier changes — a CHG-001 defect and revision first
  3. Archive CHG-001 first — dogfood order changes
- **Rejected:** write the Claude-side changes as ADDED requirements — misstates the change
- **Sources:** CR-1, C001-T-074, C001-T-075, C001-REQ-1106
- **Answer:** Cite + waive at G2/G3 (Recommended)
- **Extracted instructions:** none → C002-DEC-008

### Q-guards-02 — If spike S-08 shows Copilot subagents are not confined to their tool list, what happens to the Copilot target?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4 (CR-2, C002-OA-001)
- **Why it matters:** decides whether a fail-open mechanism may ship under Q-safety-01.
- **Options:**
  1. Defer Copilot (Recommended) — keep the fail-closed bar; OpenCode still ships
  2. Ship with agent-scoped hooks — Copilot ships; boundary off when hooks are disabled
- **Rejected:** tool-list restriction only; VS Code extension
- **Sources:** CR-2, C002-OA-001, C002-DEC-001, Q-safety-01
- **Answer:** Ship with agent-scoped hooks
- **Extracted instructions:** none → C002-DEC-001 (Consequences), C002-DEC-005 (exception)

### Q-memory-01 — Do the researcher and cartographer keep a project memory folder on OpenCode and Copilot?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4 (CR-3)
- **Why it matters:** the MCP server has no agent identity; neither target has native agent memory.
- **Options:**
  1. No, drop it on targets (Recommended) — boundary stays `.sdd/` only
  2. Yes, per-agent folder — generated per-agent configuration
- **Rejected:** memory folder inside `.sdd/` (changes the layout); platform-native memory (none exists)
- **Sources:** CR-3, C002-DEC-001
- **Answer:** No, drop it on targets (Recommended)
- **Extracted instructions:** none → C002-DEC-009

### Q-profile-01 — Confirm the change profile for CHG-002?
- **Blocking:** no · **Material:** no · **Candidates considered:** 2 (CR-14)
- **Why it matters:** readiness needs P-01's confirmation of the profile.
- **Options:**
  1. Full (Recommended) — more than 2 touched modules and more than 10 expected requirements (constitution thresholds)
  2. Lite
- **Rejected:** none
- **Sources:** CR-14, `evidence/baseline-survey.md` §3.1
- **Answer:** Full (Recommended)
- **Extracted instructions:** none

## Round 4 — 2026-10-14

Question from the critic's re-review (CR-16).

### Q-guards-03 — If spike S-08 also shows that agent-scoped hooks do not block a Copilot subagent's tool calls, what happens to the Copilot target?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4 (CR-16, C002-OA-001)
- **Why it matters:** the hooks fallback of Q-guards-02 would then enforce nothing; the spec needs the Copilot ship condition.
- **Options:**
  1. Defer Copilot (Recommended) — consistent with Q-safety-01; OpenCode still ships
  2. Ship instructions-only + warning — no enforced boundary on Copilot
- **Rejected:** VS Code extension (not generated, C002-DEC-006); tool-list restriction only (C001-NFR-201)
- **Sources:** CR-16, Q-guards-02, Q-safety-01, C002-OA-001, C002-R-001
- **Answer:** Defer Copilot (Recommended)
- **Extracted instructions:** none → C002-DEC-005
