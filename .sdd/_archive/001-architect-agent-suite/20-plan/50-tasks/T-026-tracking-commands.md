---
id: C001-T-026
title: "Tracking commands: task set, defect add/close/reopen"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: done
depends_on: [C001-T-017]
implements: [C001-REQ-901, C001-REQ-902, C001-REQ-903, C001-REQ-904, C001-REQ-907, C001-REQ-908, C001-REQ-910, C001-REQ-922, C001-REQ-923]
satisfies_ac: [C001-AC-901.1, C001-AC-901.2, C001-AC-902.1, C001-AC-903.1, C001-AC-904.1, C001-AC-907.1, C001-AC-908.1, C001-AC-910.1, C001-AC-922.1, C001-AC-923.1]
verified_by: [C001-TS-901, C001-TS-902, C001-TS-903, C001-TS-904, C001-TS-905, C001-TS-908, C001-TS-909, C001-TS-911, C001-TS-923, C001-TS-924, C001-TC-901, C001-TC-902, C001-TC-903, C001-TC-904, C001-TC-905, C001-TC-908, C001-TC-909, C001-TC-911, C001-TC-923, C001-TC-924]
components: [C001-COMP-06]
risk_refs: []
estimate: M
report: { commit: ffe41ae, completed_at: 2026-10-11, notes: "task set and defect add/close/reopen done; C001-TC-901..905, 908, 909, 911, 923, 924 pass. Reported with sdd task set itself. The registry schema has no defect history field, so reopen history stays in change.md (spec gap noted for C001-T-028). Same-status updates (for example done to done) are refused as the state machine lists no such transition." }
---

# C001-T-026 — Tracking commands: task set, defect add/close/reopen

## Intent

Give implementers (C001-ADR-004: plain Claude Code sessions) a working progress and defect protocol from M-2 onward.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/tracking/task.ts` | state machine of state-machines §3; report fields |
| add | `src/tracking/defect.ts` | D-<nnn> per change; history on reopen |
| add | `tests/integration/tracking/*.test.ts` | transitions, refusals, warnings |

## Preconditions

- T-017
- Dependencies done: C001-T-017

## Step outline (no production code)

1. Implement allowed transitions and ERR-CLI-005/006/013.
2. Emit WARN-CLI-001 for unfinished dependencies.
3. Implement defects with registry sync.

## Verification

- C001-TC-901…905, 908, 909, 911, 923, 924 pass
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Implementers of later tasks use `sdd task set` for this plan
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-026 --status done --commit <sha>` (or frontmatter fallback before T-026)
