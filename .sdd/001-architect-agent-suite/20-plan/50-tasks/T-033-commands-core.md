---
id: C001-T-033
title: "Commands: init, new, ideate, specify, plan, status, lint, decide, research"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-3
status: todo
depends_on: [C001-T-032]
implements: [C001-REQ-204, C001-REQ-114, C001-REQ-116, C001-REQ-315, C001-REQ-316]
satisfies_ac: [C001-AC-204.1, C001-AC-204.2, C001-AC-114.1, C001-AC-114.2, C001-AC-116.1, C001-AC-315.1, C001-AC-315.2, C001-AC-316.1]
verified_by: [C001-TS-204, C001-TS-205, C001-TS-119, C001-TS-120, C001-TS-122, C001-TS-316, C001-TS-317, C001-TS-318, C001-TC-204, C001-TC-205, C001-TC-119, C001-TC-120, C001-TC-122, C001-TC-316, C001-TC-317, C001-TC-318]
components: [C001-COMP-09]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-033 — Commands: init, new, ideate, specify, plan, status, lint, decide, research

## Intent

Author the thin command files of C001-IF-10 that load phase skills, run the constitution interview, propose profiles and run ad-hoc research/decisions.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/commands/*.md` | init, new, ideate, specify, plan, status, lint, decide, research (gate/revise/archive/doctor in later tasks) |

## Preconditions

- T-032
- Dependencies done: C001-T-032

## Step outline (no production code)

1. Keep bodies to argument handling + skill loading (C001-IF-10 §2).
2. Implement profile proposal using constitution thresholds.
3. Run eval TCs.

## Verification

- C001-TC-204, 205, 119, 120, 122, 316…318 pass
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] PLG-DUP-001 clean
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-033 --status done --commit <sha>` (or frontmatter fallback before T-026)
