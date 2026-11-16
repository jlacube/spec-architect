---
id: C001-T-052
title: "Session-start, post-write, SubagentStop hooks and hooks.json"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-5
status: done
depends_on: [C001-T-050, C001-T-017, C001-T-018]
implements: [C001-REQ-911, C001-REQ-912, C001-REQ-1121]
satisfies_ac: [C001-AC-911.1, C001-AC-912.1, C001-AC-1121.1]
verified_by: [C001-TS-912, C001-TS-913, C001-TS-1122, C001-TC-912, C001-TC-913, C001-TC-1122]
components: [C001-COMP-08, C001-COMP-11]
risk_refs: []
estimate: M
report: { commit: 43d044f, completed_at: 2026-10-11, notes: "live haiku session confirmed guards and brief (/usr/bin/bash.002); D-006 opened (IF-01 lacks trace --active)" }
---

# C001-T-052 — Session-start, post-write, SubagentStop hooks and hooks.json

## Intent

Wire all hooks in hooks.json with shell-agnostic commands and implement the session-start brief and post-write quick lint feedback.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/hooks/hooks.json` | events and matchers of C001-IF-07 §2 |
| add | `src/hooks/session-start.ts, post-write.ts` | brief ≤ 10 lines; feedback ≤ 15 findings |

## Preconditions

- T-050, T-017, T-018
- Dependencies done: C001-T-050, C001-T-017, C001-T-018

## Step outline (no production code)

1. Write hooks.json.
2. Implement brief and feedback.
3. Test in PowerShell and Git Bash sessions.

## Verification

- C001-TC-912, 913, 1122 pass
- Session-start p95 ≤ 1 s (C001-NFR-104)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Unrelated repositories show no output
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-052 --status done --commit <sha>` (or frontmatter fallback before T-026)
