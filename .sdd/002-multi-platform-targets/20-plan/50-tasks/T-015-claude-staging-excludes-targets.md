---
id: C002-T-015
title: "Claude Code staging leaves out plugins/architect/targets/"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: []
implements: []
satisfies_ac: [C002-AC-113.1]
verified_by: [C002-TS-121]
components: [C002-COMP-013, C002-COMP-017]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-015 — Claude Code staging leaves out plugins/architect/targets/

## Intent

`scripts/package.mjs` copies the whole plugin tree into the Claude Code staging, so the new
`targets/` folder would ship in the Claude Code zips (blast-radius BR-10, C002-CON-10, C002-ADR-002).
The filter has to exist before the first mapping table lands (C002-T-024).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `scripts/package.mjs` | the plugin copy filters out `plugins/architect/targets/` |
| add | `tests/integration/build/package-staging.test.ts` | with a dummy `targets/` file present, the staged plugin and the zips hold no `targets/` entry; `claude plugin validate` input unchanged |

## Preconditions

- None.

## Step outline (no production code)

1. Add the filter to the recursive copy.
2. Test with a temporary `targets/` file created by the test and removed afterwards.
3. Check that PLG-PATH-001 and PLG-LAYOUT-001 still pass with a `targets/` folder present
   (regression-set §4.4).

## Verification

- `npm test -- build`
- `npm run package`, then list the zip contents

## Done when

- [ ] No `targets/` entry in the Claude Code zips
- [ ] Progress reported: `sdd task set C002-T-015 --status done --commit <sha>`
