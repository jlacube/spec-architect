---
id: C001-T-004
title: "Spike S-03: Archify validate, deliver and compare"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-1
status: done
depends_on: [C001-T-001]
implements: []
satisfies_ac: [C001-AC-504.1, C001-AC-505.1, C001-AC-506.1]
verified_by: [C001-TS-504, C001-TS-505, C001-TS-506, C001-TC-504, C001-TC-505, C001-TC-506]
components: [C001-COMP-02]
risk_refs: [C001-RISK-009]
estimate: S
report: { commit: a2b2a00, completed_at: 2026-10-10, notes: "Verdict fallback-only (docs/spikes/S-03-archify.md). License MIT (code; bundled brand marks mixed incl. CC-BY-NC-SA, not to be used). Hyphenated component IDs accepted. All output commands fail on Windows 11 with Archify 3.0.1 (upstream issue #474); doctor gives a false positive. Spec defects D-S03-1 (C001-REQ-504..506, Mermaid fallback per strategy contingency) and D-S03-2 (C001-IF-14 §3 IR conventions) opened. C001-TC-504..506 belong to C001-T-042 and cannot pass on REF-WIN with Archify 3.0.1." }
---

# C001-T-004 — Spike S-03: Archify validate, deliver and compare

## Intent

Confirm the Archify CLI works headless from a shell on Windows, that IR node IDs can carry component IDs, that compare produces a delta, and that its license is permissive (C001-CON-05).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/spikes/S-03-archify.md` | install, license found, validate/deliver/compare results, ID constraints for nodes |

## Preconditions

- Node >= 20
- Dependencies done: C001-T-001

## Step outline (no production code)

1. `npx skills add tt-a1i/archify -g`; read its LICENSE.
2. Author a 5-node architecture IR with IDs like C001-COMP-01; run validate, deliver, compare with ARCHIFY_UPDATE_CHECK_DISABLED=1.
3. Note whether hyphenated IDs are accepted.

## Verification

- Report states license, ID rules and command outcomes
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] License verdict recorded; if not permissive, C001-CON-05 conflict raised as spec defect
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-004 --status done --commit <sha>` (or frontmatter fallback before T-026)
