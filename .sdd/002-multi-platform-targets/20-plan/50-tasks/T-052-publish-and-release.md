---
id: C002-T-052
title: "P-01: publish architect-sdd and release each target"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-049, C002-T-050, C002-T-051]
implements: []
satisfies_ac: [C002-AC-502.1, C002-AC-617.1, C002-AC-619.1]
verified_by: [C002-TS-503, C002-TS-620, C002-TS-622, C002-TC-503, C002-TC-620, C002-TC-622]
components: [C002-COMP-006, C002-COMP-010]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-052 — P-01: publish architect-sdd and release each target

## Intent

Release on evidence. The release check runs per target. P-01 publishes the `architect-sdd` tarball
**before or together with** each target release, because the generated doctor requires the exact
version (C002-REQ-509, C002-ADR-004). Each target that passes gets its release record. The rollback
and communication steps belong to `75-rollout.md`.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/opencode/<version>/release.json`, `docs/releases/copilot/<version>/release.json` | release records written by the release check |

## Preconditions

- C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-049, C002-T-050 and C002-T-051 done.

## Step outline (no production code)

1. Run `node scripts/release-check.mjs --target opencode` and `--target copilot`. Each target is
   decided on its own.
2. **P-01 step:** if at least one target passes, publish the tarball: `npm publish
   dist/architect-sdd-<version>.tgz` from P-01's account. Then check `npm view architect-sdd version`.
3. **P-01 step:** release each passing target package. A refused target is not released, and its
   refusal stays recorded.
4. Commit the release records.

## Verification

- `npm view architect-sdd version` equals the `plugin.json` version
- Release records validate against `docs/releases/release-record.schema.json`

## Done when

- [ ] `architect-sdd` published no later than the first target release
- [ ] A release record per passing target; refusals recorded
- [ ] Progress reported: `sdd task set C002-T-052 --status done --commit <sha>`
