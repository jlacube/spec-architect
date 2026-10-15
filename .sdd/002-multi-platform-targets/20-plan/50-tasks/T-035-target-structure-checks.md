---
id: C002-T-035
title: "Target structure checks and the npm run check step"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-022, C002-T-030, C002-T-033]
implements: [C002-REQ-110, C002-REQ-113, C002-REQ-601, C002-REQ-602, C002-REQ-603, C002-REQ-604, C002-REQ-605, C002-NFR-104]
satisfies_ac: [C002-AC-110.1, C002-AC-113.1, C002-AC-601.1, C002-AC-602.1, C002-AC-603.1, C002-AC-604.1, C002-AC-605.1]
verified_by: [C002-TS-116, C002-TS-121, C002-TS-122, C002-TS-601, C002-TS-602, C002-TS-603, C002-TS-604, C002-TS-605, C002-TS-606, C002-TS-607]
components: [C002-COMP-007, C002-COMP-013]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-035 — Target structure checks and the npm run check step

## Intent

Add the check family of C002-IF-005 §6. TGT-* checks compare each generated package with its contract
(C002-REQ-603) and report untranslated constructs (C002-REQ-602), Copilot generic grants
(C002-REQ-604), the inlining budget (C002-REQ-110, C002-NFR-104), the Serena declaration and the tool
classes. PLG-VAR-001 runs on the source plugin (C002-REQ-113). No check reads a change folder by a
fixed path (C002-REQ-605). `npm run check` generates into a fresh temporary folder and runs them
(C002-REQ-601).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/check/targets/*.mjs` | TGT-* checks with their own `ctx` (generated output), never the plugin `ctx` |
| add | `scripts/check/variants.mjs` | PLG-VAR-001 over `agents/`, `commands/`, `skills/` |
| modify | `scripts/check.mjs` | new step `targets` (not part of `structure`, so `TS-1118.test.ts` is unaffected) |
| add | `tests/integration/cap06/structure-checks.test.ts` | the listed scenarios with planted faults |

## Preconditions

- C002-T-022 (tarball), C002-T-030 and C002-T-033 (complete packages) done.

## Step outline (no production code)

1. Build the target `ctx` from a temporary `--out`, so the repository's `dist/` is not read.
2. Measure the inlined size per skill and per agent. Name the skills concerned when a budget is
   exceeded.
3. Read the contract values from the mapping tables and from the C002 interface files through the
   locator, never by a fixed change-folder path.

## Verification

- `npm run check` and `npm test -- cap06`

## Done when

- [ ] `npm run check` green on the real packages; every planted fault reported with its code
- [ ] Progress reported: `sdd task set C002-T-035 --status done --commit <sha>`
