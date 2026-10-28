---
id: C002-T-055
title: "P-01: release the Copilot target"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-050, C002-T-054, C002-T-057, C002-T-071]
implements: []
satisfies_ac: [C002-AC-502.1, C002-AC-617.1, C002-AC-619.1]
verified_by: [C002-TS-503, C002-TS-620, C002-TS-622, C002-TC-503, C002-TC-620, C002-TC-622]
components: [C002-COMP-006, C002-COMP-010]
risk_refs: [C002-RISK-031]
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

- **Package version 0.0.2** (defect D-035; P-01 answer to Q-inj21-01; C002-T-073). Both targets
  share the one version, so Copilot is released at 0.0.2 too: `<version>` below is `0.0.2`, from
  `docs/releases/copilot/0.0.2/` and `dist/architect-copilot-0.0.2.zip`. Its Copilot CLI evidence is
  the 24 sessions that C002-T-071 step 5 runs at 0.0.2 (P-01: "retake both targets' paid
  evidence"). The runsheet `docs/runsheets/T-055-copilot-release.md` names 0.0.2.
- **C002-T-071 done** (P-01 answer to Q-release-base-01; plan critic CR-71). The release is made from
  the release-candidate commit that C002-T-071 records, with the CHG-001 fixes. C002-T-071 re-ran the
  Copilot unpaid steps (C002-T-054 steps 1 and 2) there. Its step 5 ran the paid Copilot CLI rows (C002-T-054 step 3, 24 sessions, Copilot pool) at that
  commit and version 0.0.2, which P-01 decided with the answer to Q-inj21-01. C002-T-050 and C002-T-057 ran
  on the package of that commit.
- C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-050, C002-T-054 and C002-T-057 done.
- The S-08 record of the tested versions is not `deferred`: the signed-off record gives
  `sdd-mcp-server` (C002-T-002). Only a later record of a new tested version (C002-REQ-621) could
  bring the defer branch of `75-rollout.md` §5 back, and with it a plan revision that drops this task.
- The release record names the tested hosts of scope §3.1 (VS Code Insiders `1.142.0-insider`,
  Copilot CLI `1.0.98`).

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
