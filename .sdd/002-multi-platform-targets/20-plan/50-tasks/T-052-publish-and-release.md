---
id: C002-T-052
title: "P-01: publish architect-sdd and release the OpenCode target"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-049, C002-T-051]
implements: []
satisfies_ac: [C002-AC-502.1, C002-AC-617.1, C002-AC-619.1]
verified_by: [C002-TS-503, C002-TS-620, C002-TS-622, C002-TC-503, C002-TC-620, C002-TC-622]
components: [C002-COMP-006, C002-COMP-010]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-052 — P-01: publish architect-sdd and release the OpenCode target

## Intent

Release OpenCode on its own evidence, independently of the Copilot target (C002-REQ-619; Copilot is
C002-T-055). P-01 publishes the `architect-sdd` tarball **before or together with** the first target
release, because the generated doctor requires the exact version (C002-REQ-509, C002-ADR-004). The
release channel is the per-target zip in `dist/` (Q-release-01): P-01 shares
`dist/architect-opencode-<version>.zip` as the Claude Code zips are shared today. The rollback and
communication steps belong to `75-rollout.md`.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/opencode/<version>/release.json` | release record written by the release check |
| add | `docs/releases/opencode/<version>/zip.sha256` | one line: SHA-256 and file name of the released zip, for C002-RB-002 |

## Preconditions

- C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-049 and C002-T-051 done.

## Step outline (no production code)

1. Run `node scripts/release-check.mjs --target opencode` at the release-candidate commit. It compares
   the regenerated package with `dist/opencode/` and with the zip (C002-T-047 step 4).
2. **P-01 step:** if the check passes and `npm view architect-sdd@<version>` shows no such version,
   re-check that the name is still P-01's (C002-RISK-017), then publish:
   `npm publish dist/architect-sdd-<version>.tgz` from P-01's account, and check
   `npm view architect-sdd version`. If the check refuses OpenCode, do not publish here; the refusal
   stays recorded and C002-T-055 publishes with the Copilot release if that target passes.
3. **P-01 step:** release `dist/architect-opencode-<version>.zip` through the channel of
   `75-rollout.md` §1: share the zip as the Claude Code zips are shared, and keep the released zip
   with its `zip.sha256` line (retention for C002-RB-002). The README section and install notes name
   the version.
4. Commit the release record and the `zip.sha256` line.

## Verification

- `npm view architect-sdd version` equals the `plugin.json` version
- The release record validates against `docs/releases/release-record.schema.json`
- The SHA-256 of the shared zip equals the `zip.sha256` line

## Done when

- [ ] `architect-sdd` published no later than the OpenCode release (or the refusal recorded and no publication)
- [ ] OpenCode release record and released zip recorded, or the refusal recorded
- [ ] Progress reported: `sdd task set C002-T-052 --status done --commit <sha>`
