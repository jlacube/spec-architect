---
id: C001-T-031
title: "Interview protocol and questions contract"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-3
status: done
depends_on: [C001-T-030]
implements: [C001-REQ-205, C001-REQ-206, C001-REQ-207, C001-REQ-208, C001-REQ-209, C001-REQ-210, C001-REQ-211, C001-REQ-220]
satisfies_ac: [C001-AC-205.1, C001-AC-206.1, C001-AC-207.1, C001-AC-208.1, C001-AC-209.1, C001-AC-210.1, C001-AC-211.1, C001-AC-220.1]
verified_by: [C001-TS-206, C001-TS-207, C001-TS-208, C001-TS-209, C001-TS-210, C001-TS-211, C001-TS-212, C001-TS-222, C001-TC-206, C001-TC-207, C001-TC-208, C001-TC-209, C001-TC-210, C001-TC-211, C001-TC-212, C001-TC-222]
components: [C001-COMP-01, C001-COMP-02, C001-COMP-10]
risk_refs: []
estimate: M
report: { commit: 0dd7bf7, completed_at: 2026-10-11, notes: "7 of 8 evals pass at dev tier ($1.12); TC-209 runs with the researcher agent in T-035" }
---

# C001-T-031 — Interview protocol and questions contract

## Intent

Author the interview-protocol and options-analysis skills implementing rounds of ≤ 4 questions, 2–3 options with recommendation first, material-decision analysis, question merging, verbatim logging and extraction of embedded instructions.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/skills/interview-protocol/SKILL.md` | round rules, questions.schema.json usage, log format |
| add | `plugins/architect/skills/options-analysis/SKILL.md` | criteria, weights, 4–5 candidates, near-tie disclosure |
| add | `plugins/architect/skills/interview-protocol/references/questions.schema.json` | copy of C001-IF-05 |

## Preconditions

- T-030
- Dependencies done: C001-T-030

## Step outline (no production code)

1. Write both skills within the size budget (C001-NFR-105).
2. Add the specialist return contract text used by every specialist.
3. Run eval TCs.

## Verification

- C001-TC-206…212, 222 pass (dev tier)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Skills contain no Claude-specific tool names outside "Claude Code wiring" sections
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-031 --status done --commit <sha>` (or frontmatter fallback before T-026)
