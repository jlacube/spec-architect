---
id: C001-T-022
title: "Lint rules: plan phase"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: done
depends_on: [C001-T-018]
implements: [C001-REQ-603, C001-REQ-604, C001-REQ-605, C001-REQ-606, C001-REQ-607, C001-REQ-612, C001-REQ-906]
satisfies_ac: [C001-AC-603.1, C001-AC-604.1, C001-AC-605.1, C001-AC-606.1, C001-AC-607.1, C001-AC-607.2, C001-AC-612.1, C001-AC-906.1]
verified_by: [C001-TS-603, C001-TS-604, C001-TS-605, C001-TS-606, C001-TS-607, C001-TS-608, C001-TS-614, C001-TS-907, C001-TC-603, C001-TC-604, C001-TC-605, C001-TC-606, C001-TC-607, C001-TC-608, C001-TC-614, C001-TC-907]
components: [C001-COMP-04]
risk_refs: [C001-RISK-006]
estimate: M
report: { commit: e24f695, completed_at: 2026-10-11, notes: "12 rules done (TR-06, 07, 08, 11, 14, 15, LINT-PLAN-001, TASK-001..003, OBS-001, GATE-001); C001-TC-603..608, 614, 907 pass, plus TC-601, 610, 616, 618 (plan owner C001-T-043). TC-615 (risk entry structure) has no lint code in errors.md; left to C001-T-043. Plan rules run only once phases.20-plan has started. Rules can declare a phase so --phase 20-plan keeps cross-phase findings (TR-06 at the requirement, TR-08 at the scenario), per C001-TS-701. CHG-001 plan: zero findings, 58 tasks read. Quick lint ~590 ms, full ~810 ms." }
---

# C001-T-022 — Lint rules: plan phase

## Intent

Implement TR-06, TR-07, TR-08, TR-11, TR-14, TR-15 and the plan structure rules (milestones, task content, code in tasks, observability mapping, done without commit, gate-log usage).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/lint/rules/tr-06..08.ts, tr-11.ts, tr-14.ts, tr-15.ts` | plan traceability |
| add | `src/lint/rules/plan-001.ts, task-001..003.ts, obs-001.ts, gate-001.ts` | plan structure |
| add | `tests/lint-fixtures/...` | fixtures incl. cycles and dangling depends_on |

## Preconditions

- T-018
- Dependencies done: C001-T-018

## Step outline (no production code)

1. Implement DAG cycle detection reporting the cycle path.
2. Count code-block lines by language for LINT-TASK-002.
3. Check observability mapping NFR → signal → task.

## Verification

- C001-TC-601, 603…608, 610, 614…616, 618, 907 pass
- This CHG-001 plan lints clean
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Plan-phase rules run only when 20-plan has started
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-022 --status done --commit <sha>` (or frontmatter fallback before T-026)
