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
