---
id: C001-T-021
title: "Lint rules: ideation, architecture and interfaces"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: done
depends_on: [C001-T-018]
implements: [C001-REQ-310, C001-REQ-503, C001-REQ-509, C001-REQ-512]
satisfies_ac: [C001-AC-310.1, C001-AC-310.2, C001-AC-503.1, C001-AC-509.1, C001-AC-512.1]
verified_by: [C001-TS-310, C001-TS-311, C001-TS-503, C001-TS-509, C001-TS-512, C001-TC-310, C001-TC-311, C001-TC-503, C001-TC-509, C001-TC-512]
components: [C001-COMP-04]
risk_refs: [C001-RISK-006]
estimate: M
report: { commit: 2ec426a, completed_at: 2026-10-11, notes: "15 rules done (LINT-RES-001/002, OA-001, IDE-001, ARCH-001..005, TR-10, IF-001/002, ERR-001, CON-001, EVD-001); C001-TC-310, 311, 503, 509, 512 pass, plus TC-302, 308, 314, 501, 502, 510, 513, 514, 516, 1003 (plan owners are agent tasks). The CHG-001 OA tables give no LINT-OA-001 (12+ tables checked). Zero findings on this repository except LINT-IDE-001: the approved bootstrap ideation lacks Research index, Options and decisions index and Design direction; escalation for C001-T-028. LINT-ERR-001 reads every 50-interfaces table as the catalogue, because errors.md delegates TR-* to C001-IF-04 §5 and PLG-* to C001-IF-08 §3. Quick lint ~570 ms, full ~830 ms." }
---

# C001-T-021 — Lint rules: ideation, architecture and interfaces

## Intent

Implement research-note, option-analysis arithmetic, ideation-section, architecture-section/catalogue/ID-consistency/sequence, interface parse/registry and error-catalogue rules.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/lint/rules/res-001.ts, res-002.ts, oa-001.ts, ide-001.ts` | ideation rules |
| add | `src/lint/rules/arch-001..005.ts, tr-10.ts, if-001.ts, if-002.ts, err-001.ts, con-001.ts, evd-001.ts` | architecture and interface rules |
| add | `tests/lint-fixtures/...` | fixtures incl. the corrected CHG-001 OA tables (C001-TC-311) |

## Preconditions

- T-018
- Dependencies done: C001-T-018

## Step outline (no production code)

1. Parse score tables and recompute Σ score × weight (tolerance 0.01).
2. Map Mermaid IDs with `_` back to `-` before comparing with the catalogue.
3. Parse JSON/YAML contract files and report parser positions.

## Verification

- C001-TC-302, 308, 310, 311, 314, 501…503, 509, 510, 512…514, 516, 1003 pass
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] The approved CHG-001 ideation and spec produce zero findings
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-021 --status done --commit <sha>` (or frontmatter fallback before T-026)
