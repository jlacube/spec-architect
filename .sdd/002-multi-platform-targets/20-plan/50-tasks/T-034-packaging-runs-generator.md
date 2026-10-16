---
id: C002-T-034
title: "npm run package runs the generator and zips each target"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-022, C002-T-029, C002-T-031]
implements: [C002-REQ-101]
satisfies_ac: [C002-AC-101.1]
verified_by: [C002-TS-101, C002-TS-102, C002-TS-103, C002-TC-101, C002-TC-102, C002-TC-103]
components: [C002-COMP-013, C002-COMP-001]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-034 — npm run package runs the generator and zips each target

## Intent

Complete flow F1. After the build and the plugin checks, `scripts/package.mjs` runs
`scripts/generate.mjs` as a child process. A non-zero exit stops packaging (C002-ADR-003). One
`npm run package` then writes the Claude Code zips, `dist/opencode/`, `dist/copilot/`, one zip per
target package and the `architect-sdd` tarball (C002-REQ-101). The per-target zips are the release
channel P-01 chose in Q-release-01 ("zips in dist/", `questions-log.md` round 3).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `scripts/package.mjs` | `generate` step between the Claude Code staging and the npm staging; exit code passed through; then one zip per generated target with the existing `zipDir` helper: `dist/architect-opencode-<version>.zip` from `dist/opencode/` and `dist/architect-copilot-<version>.zip` from `dist/copilot/` (each holds the folder content at its root, generation manifest included); the closing `packaged:` list names both zips |
| add | `tests/integration/cap01/package-flow.test.ts` | the three listed scenarios |
| add | `tests/integration/build/target-zips.test.ts` | each target zip lists exactly the files of its `dist/<target>/` folder with equal content, and its generation manifest equals the folder's; no zip exists after a generator failure |

## Preconditions

- C002-T-022, C002-T-029 and C002-T-031 done.

## Step outline (no production code)

1. Add the step, started with `execFile` (no shell).
2. A generator failure leaves no `dist/opencode` and no `dist/copilot`, no target zip, and no tarball
   is packed. Remove the previous run's target zips before the generator step, as the script already
   does for the Claude Code zip.
3. Zip each generated target folder with `zipDir`, in the same way as the Claude Code marketplace
   zip, and add both zips to the closing summary.

## Verification

- `npm run package`, `npm test -- cap01` and `npm test -- build/target-zips`

## Done when

- [ ] One command writes the Claude Code outputs as today, the two target folders with their zips, and the tarball
- [ ] Each target zip matches its folder and generation manifest
- [ ] Progress reported: `sdd task set C002-T-034 --status done --commit <sha>`
