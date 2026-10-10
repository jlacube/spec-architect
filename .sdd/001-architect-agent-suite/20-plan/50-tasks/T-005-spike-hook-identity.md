---
id: C001-T-005
title: "Spike S-04: hook input and agent identity"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-1
status: in-progress
depends_on: [C001-T-001]
implements: []
satisfies_ac: [C001-AC-1103.1, C001-AC-1105.1]
verified_by: [C001-TS-1103, C001-TS-1106, C001-TC-1103, C001-TC-1106]
components: [C001-COMP-08]
risk_refs: [C001-RISK-002]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-005 — Spike S-04: hook input and agent identity

## Intent

Determine which fields Claude Code passes to PreToolUse/PostToolUse/SessionStart hooks from a plugin, in particular whether the calling subagent is identifiable, to choose between the primary and fallback guard designs (C001-REQ-1103/1105).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/spikes/S-04-hooks.md` | captured hook JSON samples per event, field table, chosen guard design |
| add | `plugins/architect/hooks/hooks.json` | temporary logging hook (removed at end of spike) |

## Preconditions

- Plugin installable from the local marketplace (T-001)
- Dependencies done: C001-T-001

## Step outline (no production code)

1. Install a logging hook that writes stdin JSON to a temp file for each event.
2. Trigger writes from the main session and from a plugin subagent; capture inputs.
3. Identify the agent identity field (if any) and the session/transcript fields; update C001-IF-07 §1 via a spec defect if names differ.
4. Remove the logging hook.

## Verification

- Report includes at least one captured input per event and the identity verdict
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Guard design (primary or fallback) decided and recorded
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-005 --status done --commit <sha>` (or frontmatter fallback before T-026)
