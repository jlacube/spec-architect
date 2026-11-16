---
id: C001-T-020
title: "Lint rules: acceptance, coverage, NFR, DoD, delta evidence"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: done
depends_on: [C001-T-018]
implements: [C001-REQ-410, C001-REQ-413, C001-REQ-415, C001-REQ-420]
satisfies_ac: [C001-AC-410.1, C001-AC-413.1, C001-AC-415.1, C001-AC-420.1]
verified_by: [C001-TS-412, C001-TS-415, C001-TS-417, C001-TS-422, C001-TC-412, C001-TC-415, C001-TC-417, C001-TC-422]
components: [C001-COMP-04]
risk_refs: [C001-RISK-006]
estimate: M
report: { commit: f3b3c63, completed_at: 2026-10-11, notes: "11 rules done (TR-01, 03, 04, 05, 09, LINT-TS-001, COV-001/002, NFR-001, DOD-001, DELTA-001); C001-TC-412, 415, 417, 422 pass, plus TS-411, 413, 414, 416 (plan owners C001-T-037/038). TR-01..05 give zero findings on this repository, matching the generator (100%). Escalation for C001-T-028: LINT-TS-001 reports 71 approved scenarios (70 without a Given step, C001-TS-205 without a When); a spec revision or a change to C001-REQ-413 is P-01 decision. Quick lint ~580 ms on this repository (C001-NFR-102 threshold 800 ms, measured in C001-T-065)." }
---

# C001-T-020 — Lint rules: acceptance, coverage, NFR, DoD, delta evidence

## Intent

Implement TR-01…TR-05 and TR-09 plus scenario structure, coverage tables, NFR fields and DoD evidence types.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/lint/rules/tr-01..05.ts, tr-09.ts` | traceability rules for the spec phase |
| add | `src/lint/rules/ts-001.ts, cov-001.ts, cov-002.ts, nfr-001.ts, dod-001.ts, delta-001.ts` | structure rules |
| add | `tests/lint-fixtures/...` | fixtures |

## Preconditions

- T-018
- Dependencies done: C001-T-018

## Step outline (no production code)

1. Implement gherkin step counting (one When, ≥1 Given/Then; Outline Examples allowed).
2. Implement coverage-table parsing incl. per-column n/a notes (C001-IF-03 §7).
3. Implement DoD coverage via capability rows and NFR ranges (e.g. "501 … 503, 702").
4. Implement delta citation and evidence checks.

## Verification

- C001-TC-411…417, 422 pass
- CHG-001 spec coverage equals the prototype matrix (100% TR-01…05)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] 80-traceability coverage numbers match the generator
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-020 --status done --commit <sha>` (or frontmatter fallback before T-026)
