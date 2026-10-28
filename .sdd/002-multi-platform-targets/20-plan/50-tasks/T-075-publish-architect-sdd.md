---
id: C002-T-075
title: "P-01: publish architect-sdd at the release version, apart from any target release"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-003, C002-T-023, C002-T-050, C002-T-057, C002-T-071, C002-T-074]
implements: [C002-REQ-501, C002-REQ-502, C002-REQ-509]
satisfies_ac: [C002-AC-501.1, C002-AC-502.1, C002-AC-509.1]
verified_by: [C002-TS-501, C002-TC-501]
components: [C002-COMP-006]
risk_refs: [C002-RISK-017, C002-RISK-018, C002-RISK-019]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-075 — P-01: publish architect-sdd at the release version, apart from any target release

## Intent

Until now, P-01 published `architect-sdd` in C002-T-052, with the OpenCode release, or in C002-T-055
if OpenCode had not shipped. The OpenCode release leaves CHG-002 for the future CHG-003 (P-01
answers to Q-opencode-defer-01 and Q-opencode-scope-01; defect D-036), and C002-T-052 is dropped. So
the npm publication becomes a task of its own: P-01 publishes `architect-sdd@0.0.3` after the
Copilot checks pass and before or together with the Copilot release (C002-T-055). No OpenCode task
is involved.

The generated doctor requires the exact version of the CLI (C002-REQ-509). A target released before
its CLI is on npm would show the sdd CLI row as `error` to every adopter (C002-ADR-004;
`../75-rollout.md` §1). This is a P-01 step: the agent prepares and checks, and P-01 publishes from
the account of C002-T-003.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | npm registry › `architect-sdd@0.0.3` | published by P-01 from `dist/architect-sdd-0.0.3.tgz`, the tarball that C002-T-023 checked and C002-T-071 packed at the release-candidate commit |
| add | `docs/releases/architect-sdd/0.0.3.md` | one record: the version, the tarball's `sha512` integrity, the release-candidate commit, `npm view architect-sdd version` after the publication, and the date |

## Preconditions

- C002-T-003 done (P-01's npm account and the name), C002-T-023 done (install smoke and manifest
  check of the tarball), C002-T-074 done (version 0.0.3).
- C002-T-071 done: the tarball is packed at the release-candidate commit whose evidence the Copilot
  release check reads. C002-T-071 runs no OpenCode step, since the OpenCode release moved to CHG-003.
- **C002-T-050 and C002-T-057 done** (plan critics CR-82, CR-84): the checklist record and the
  Copilot clean-profile run exist at 0.0.3. npm versions are immutable, so the CLI is published only
  after every Copilot check can pass.
- `npm view architect-sdd@0.0.3` shows no such version. A version already on npm is never published
  again: npm versions are immutable (C002-RB-001).

## Step outline (no production code)

1. **Released dry run** (plan critics CR-82, CR-84). At the release-candidate commit of C002-T-071,
   run `node scripts/release-check.mjs --target copilot --dry-run`. It must give `released`, with the
   checklist record of C002-T-050 and the run of C002-T-057 in place. Any other outcome stops this
   task, and nothing is published.
2. At the same commit, run `npm run smoke:npm` and the tarball check
   (`node scripts/check/tarball.mjs dist/architect-sdd-0.0.3.tgz`). Record the tarball's `sha512`
   integrity.
3. Re-check that the name is still P-01's (`npm view architect-sdd`; C002-RISK-017).
4. **P-01 step:** `npm publish dist/architect-sdd-0.0.3.tgz` from P-01's account, then
   `npm view architect-sdd version`, which must print `0.0.3`.
5. Write the record with the dry-run outcome, and commit it. C002-T-055 then releases Copilot.

## Verification

- `npm run smoke:npm`, the tarball check
- `npm view architect-sdd version` prints `0.0.3`
- `npm view architect-sdd@0.0.3 dist.integrity` equals the `sha512` integrity of the local tarball (`npm pack --dry-run --json` or a hash of the file), and the record names both

## Done when

- [ ] The Copilot release-check dry run gave `released` at the release-candidate commit, after C002-T-050 and C002-T-057
- [ ] `architect-sdd@0.0.3` is on npm, published by P-01 from the checked tarball of the release-candidate commit, before or together with the Copilot release of C002-T-055
- [ ] The record `docs/releases/architect-sdd/0.0.3.md` is committed
- [ ] Progress reported: `sdd task set C002-T-075 --status done --commit <sha>`
