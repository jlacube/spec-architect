---
id: C001-T-030
title: "Conductor agent: definition, orientation, allowlist"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-3
status: in-progress
depends_on: [C001-T-006, C001-T-028, C001-T-029]
implements: [C001-REQ-201, C001-REQ-202, C001-REQ-203, C001-REQ-217, C001-REQ-219, C001-REQ-909]
satisfies_ac: [C001-AC-201.1, C001-AC-202.1, C001-AC-203.1, C001-AC-217.1, C001-AC-219.1, C001-AC-909.1]
verified_by: [C001-TS-201, C001-TS-202, C001-TS-203, C001-TS-219, C001-TS-221, C001-TS-910, C001-TC-201, C001-TC-202, C001-TC-203, C001-TC-219, C001-TC-221, C001-TC-910]
components: [C001-COMP-01, C001-COMP-11]
risk_refs: [C001-RISK-001]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-030 — Conductor agent: definition, orientation, allowlist

## Intent

Author agents/sdd-conductor.md per C001-IF-09 A0 with its operating loop (orient, plan, delegate, interview, gate), including orientation over SDD.md/registry/change.md and surfacing open defects. Spike S-05: grant specialists by plugin-qualified name (`Agent(architect:sdd-…)`; short names admit no agent), and run specialists in the foreground or wait for their hand-back before using a result or presenting a gate (subagents may launch asynchronously).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/agents/sdd-conductor.md` | frontmatter per IF-09; body: role, operating loop, hard rules, untrusted-content rule |
| add | `plugins/architect/skills/sdd-conventions/SKILL.md` | layout, IDs, statuses, markers, link-don’t-summarise |

## Preconditions

- S-05 verdict (T-006)
- Dependencies done: C001-T-006, C001-T-028, C001-T-029

## Step outline (no production code)

1. Write the definition; keep phase procedures out (they live in phase skills).
2. Write sdd-conventions.
3. Run eval TCs (dev tier).

## Verification

- C001-TC-201, 202, 203, 219, 221, 910 pass (dev tier)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] No phase procedure text duplicated in the agent body
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-030 --status done --commit <sha>` (or frontmatter fallback before T-026)
