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

### Q-scope-01 — Which targets are in scope?
- OpenCode + Copilot VS Code (Recommended) · OpenCode only first · OpenCode + all Copilot
- **Answer (P-01):** "OpenCode + Copilot VS Code (Recommended)"

### Q-safety-01 — Safety bar on a target whose hooks cannot identify the calling agent?
- Same as Claude (Recommended) · Ship with a warning
- **Answer (P-01):** "Same as Claude (Recommended)"

### Q-source-01 — How are the target packages produced?
- Generated from plugins/architect (Recommended) · Maintained copies
- **Answer (P-01):** "Generated from plugins/architect (Recommended)"

### Q-cli-01 — How do agents on other targets reach the sdd CLI?
- npm package + bundled (Recommended) · Bundled copy per target
- **Answer (P-01):** "npm package + bundled (Recommended)"
