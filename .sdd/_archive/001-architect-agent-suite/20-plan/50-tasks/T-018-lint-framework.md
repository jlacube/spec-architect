---
id: C001-T-018
title: "Lint engine framework and generic rules"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: done
depends_on: [C001-T-010, C001-T-012]
implements: [C001-REQ-701, C001-REQ-705, C001-REQ-717, C001-REQ-718, C001-REQ-719, C001-REQ-118, C001-REQ-122]
satisfies_ac: [C001-AC-701.1, C001-AC-705.1, C001-AC-717.1, C001-AC-718.1, C001-AC-719.1, C001-AC-118.1, C001-AC-122.1]
verified_by: [C001-TS-701, C001-TS-705, C001-TS-717, C001-TS-718, C001-TS-719, C001-TS-124, C001-TS-128, C001-TC-701, C001-TC-705, C001-TC-717, C001-TC-718, C001-TC-719, C001-TC-124, C001-TC-128]
components: [C001-COMP-04]
risk_refs: [C001-RISK-006]
estimate: L
report: { commit: c60cda8, completed_at: 2026-10-11, notes: "Engine and 8 rules done (TR-02 added for C001-TS-124); C001-TC-701, 705, 717..719, 124, 128 pass. Quick lint ~470 ms on this repo, full ~700 ms; the NFR-102 p95 on fx-large is measured in C001-T-065. LINT-SEC-001 patterns are in place; the detection corpus is C001-T-054. On this repository the lint reports TR-12 for ideation labels written as short forms in spec prose (IDEA NG-01..06, AS-01..08), example IDs in ideation prose and T-010's text, and two LINT-TXT-001 meta-mentions in ideation.md: residue for C001-T-028, tracked by a test." }
---

# C001-T-018 — Lint engine framework and generic rules

## Intent

Build the rule engine (catalogue, one module per rule, pure functions over the graph — C001-CON-13), scopes, quick single-file mode, profile awareness, and the generic rules TR-12, TR-13, LINT-TXT-001, LINT-WS-002, LINT-LIV-001, LINT-SEC-001.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/lint/engine.ts` | rule registry, scope selection, severity, report assembly (C001-IF-11 §1) |
| add | `src/lint/rules/*.ts` | tr-12, tr-13, txt-001, ws-002, liv-001, sec-001 |
| add | `tests/lint-fixtures/<rule>/{bad,good}/` | one negative and one positive fixture per rule |

## Preconditions

- T-010, T-012
- Dependencies done: C001-T-010, C001-T-012

## Step outline (no production code)

1. Implement the engine and catalogue; enforce one module + fixture per rule (C001-NFR-503).
2. Implement scopes (change, workspace, --phase) and --quick --file.
3. Make file-presence rules profile-aware (lite).
4. Implement generic rules with code-span/quote/fence exemptions.

## Verification

- C001-TC-701, 705, 717, 718, 719, 124, 128 pass
- Quick lint ≤ 800 ms p95 on fx-large (C001-NFR-102)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Engine rejects a rule without a fixture in tests
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-018 --status done --commit <sha>` (or frontmatter fallback before T-026)
