---
id: C001-SPEC-CTX-04
artifact: spec/context/current-state
change: CHG-001
phase: 10-spec
status: draft
kind: greenfield
---

# Current state

CHG-001 is **greenfield**: all requirements in this spec have delta `ADDED`. No living specs
exist yet (`.sdd/_living/` is absent), so lint rule TR-09 (code evidence for MODIFIED/REMOVED
requirements) does not apply.

## Repository baseline (2026-10-10)

| Item | State | Evidence layer |
|---|---|---|
| Repository | `C:\Sandbox\ClaudeCode\Architect`, git initialised, branch `master`, 3 commits (ideation + G1) | git log |
| Source code | none | directory listing |
| `.sdd/` | `SDD.md`, `registry.json`, `001-architect-agent-suite/{change.md, 00-ideation/ideation.md, 10-spec/…}` written manually (bootstrap; the suite does not exist yet) | directory listing |
| `.sdd/metrics/snapshots.jsonl` | written by an unidentified third-party tool (kanban-style metrics); ignored via `.gitignore` | file inspection |
| `.gitattributes` | `.sdd/** text eol=lf` | file |
| User-level agents/skills | none in `~/.claude/agents`, `~/.claude/skills` | directory listing |

## Implications for the spec

- The bootstrap files written by hand (`SDD.md`, `registry.json`, `change.md`) must be
  **readable and upgradable** by the first version of the sdd CLI (C001-REQ-123).
- The third-party `metrics/` folder shows that other tools may write into `.sdd/`. The
  workspace must tolerate unknown entries (C001-REQ-124).
