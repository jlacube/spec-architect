---
id: C001-T-019
title: "Lint rules: stories and EARS requirements"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: in-progress
depends_on: [C001-T-018]
implements: [C001-REQ-403, C001-REQ-405, C001-REQ-406, C001-REQ-407, C001-REQ-408]
satisfies_ac: [C001-AC-403.1, C001-AC-405.1, C001-AC-405.2, C001-AC-406.1, C001-AC-407.1, C001-AC-408.1, C001-AC-408.2]
verified_by: [C001-TS-403, C001-TS-405, C001-TS-406, C001-TS-407, C001-TS-408, C001-TS-409, C001-TS-410, C001-TC-403, C001-TC-405, C001-TC-406, C001-TC-407, C001-TC-408, C001-TC-409, C001-TC-410]
components: [C001-COMP-04]
risk_refs: [C001-RISK-006]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-019 — Lint rules: stories and EARS requirements

## Intent

Implement the requirement-quality rules: persona existence, story and requirement fields, EARS shape per declared pattern, singularity, known system names and weak words (C001-IF-04 §3–§4).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/lint/rules/us-001.ts, us-002.ts, req-001.ts` | field and persona checks |
| add | `src/lint/rules/ears-001.ts, ears-002.ts, ears-003.ts, word-001.ts` | EARS and weak words |
| add | `tests/lint-fixtures/...` | fixtures from the scenario Examples tables |

## Preconditions

- T-018
- Dependencies done: C001-T-018

## Step outline (no production code)

1. Port the EARS regexes of C001-IF-04 §3 with case-insensitive matching.
2. Count SHALL outside code spans.
3. Resolve system names against glossary-delta §2, project glossary and COMP names (prefix entries such as "definitions of").
4. Apply weak-word exemptions (backticks, quotes, fences, Examples tables).

## Verification

- C001-TC-402…410 pass
- This repository’s 10-spec yields zero findings for these rules
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Results of tools/prototypes/speccheck.py reproduced
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-019 --status done --commit <sha>` (or frontmatter fallback before T-026)
