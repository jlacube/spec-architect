---
id: C002-T-034
title: "npm run package runs the generator"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-022, C002-T-029, C002-T-031]
implements: [C002-REQ-101]
satisfies_ac: [C002-AC-101.1]
verified_by: [C002-TS-101, C002-TS-102, C002-TS-103]
components: [C002-COMP-013, C002-COMP-001]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-034 — npm run package runs the generator

## Intent

Complete flow F1. After the build and the plugin checks, `scripts/package.mjs` runs
`scripts/generate.mjs` as a child process. A non-zero exit stops packaging (C002-ADR-003). One
`npm run package` then writes the Claude Code zips, `dist/opencode/`, `dist/copilot/` and the
`architect-sdd` tarball (C002-REQ-101).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `scripts/package.mjs` | `generate` step between the Claude Code staging and the npm staging; exit code passed through |
| add | `tests/integration/cap01/package-flow.test.ts` | the three listed scenarios |

## Preconditions

- C002-T-022, C002-T-029 and C002-T-031 done.

## Step outline (no production code)

1. Add the step, started with `execFile` (no shell).
2. A generator failure leaves no `dist/opencode` and no `dist/copilot`, and no tarball is packed.

## Verification

- `npm run package` and `npm test -- cap01`

## Done when

- [ ] One command writes all four outputs
- [ ] Progress reported: `sdd task set C002-T-034 --status done --commit <sha>`
