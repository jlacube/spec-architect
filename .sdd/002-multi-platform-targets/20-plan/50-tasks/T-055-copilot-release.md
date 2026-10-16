---
id: C002-T-055
title: "P-01: release the Copilot target"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-050, C002-T-054, C002-T-057]
implements: []
satisfies_ac: [C002-AC-502.1, C002-AC-617.1, C002-AC-619.1]
verified_by: [C002-TS-503, C002-TS-620, C002-TS-622, C002-TC-503, C002-TC-620, C002-TC-622]
components: [C002-COMP-006, C002-COMP-010]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-055 — P-01: release the Copilot target

## Intent

Release Copilot on its own evidence, independently of OpenCode (C002-REQ-619; OpenCode is C002-T-052).
`architect-sdd` of the same version must be on npm before or together with this release
(C002-REQ-509): if C002-T-052 has not published it (OpenCode refused, or not yet released), this task
publishes it. The release channel is `dist/architect-copilot-<version>.zip` (Q-release-01). Under the
hooks fallback the release record is flagged under the exception of C002-DEC-005 (C002-REQ-622).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/copilot/<version>/release.json` | release record written by the release check |
| add | `docs/releases/copilot/<version>/zip.sha256` | one line: SHA-256 and file name of the released zip, for C002-RB-003 |

## Preconditions

- C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-050, C002-T-054 and C002-T-057 done.
- The S-08 record is not `deferred` (else the defer branch of `75-rollout.md` §5 applies and this task
  is dropped through a plan revision).

## Step outline (no production code)

1. Run `node scripts/release-check.mjs --target copilot` at the release-candidate commit. It compares
   the regenerated package with `dist/copilot/` and with the zip (C002-T-047 step 4).
2. **P-01 step:** if the check passes and `npm view architect-sdd@<version>` shows no such version,
   publish the tarball as in C002-T-052 step 2. If the check refuses Copilot, release nothing; the
   refusal stays recorded.
3. **P-01 step:** release `dist/architect-copilot-<version>.zip` through the channel of `75-rollout.md`
   §1, and keep the released zip with its `zip.sha256` line (retention for C002-RB-003).
4. Commit the release record and the `zip.sha256` line.

## Verification

- `npm view architect-sdd version` equals the `plugin.json` version
- The release record validates against `docs/releases/release-record.schema.json`; flagged under the hooks fallback
- The SHA-256 of the shared zip equals the `zip.sha256` line

## Done when

- [ ] `architect-sdd` of this version on npm no later than the Copilot release
- [ ] Copilot release record and released zip recorded, or the refusal recorded
- [ ] Progress reported: `sdd task set C002-T-055 --status done --commit <sha>`
