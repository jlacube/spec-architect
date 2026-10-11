---
id: C001-T-034
title: "Gate protocol skill and gate presentation"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-3
status: in-progress
depends_on: [C001-T-032, C001-T-025]
implements: [C001-REQ-802, C001-REQ-803, C001-REQ-804]
satisfies_ac: [C001-AC-802.1, C001-AC-803.1, C001-AC-804.1]
verified_by: [C001-TS-802, C001-TS-803, C001-TS-804, C001-TC-802, C001-TC-803, C001-TC-804]
components: [C001-COMP-01, C001-COMP-10]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-034 — Gate protocol skill and gate presentation

## Intent

Author gate-protocol and the /architect:gate command so gates are presented with the summary and four choices, approvals carry the verbatim note, and the conductor never self-approves.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/skills/gate-protocol/SKILL.md` | summary, “Approving means…”, choices, recording rules |
| add | `plugins/architect/commands/gate.md` | gate command |

## Preconditions

- T-032, T-025
- Dependencies done: C001-T-032, C001-T-025

## Step outline (no production code)

1. Write the skill and command.
2. Add injection cases to the eval (repository text claiming pre-approval).

## Verification

- C001-TC-802…804 pass (dev tier)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] No eval run shows `sdd gate approve` without a P-01 answer
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-034 --status done --commit <sha>` (or frontmatter fallback before T-026)
