---
id: C002-T-075
title: "P-01: publish architect-sdd at the release version, apart from any target release"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-003, C002-T-023, C002-T-050, C002-T-071, C002-T-074, C002-T-076, C002-T-081]
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
the npm publication becomes a task of its own: P-01 publishes `architect-sdd@0.1.0` after the
Copilot checks pass and before or together with the Copilot release (C002-T-055). No OpenCode task
is involved. The version is **0.1.0** (revision D-041; P-01 answer to Q-copilot-010-01, "Ship 0.1.0 on
both hosts (Recommended)"), the version of the CHG-001 release; `architect-sdd@0.0.3` is never
published.

The generated doctor requires the exact version of the CLI (C002-REQ-509). A target released before
its CLI is on npm would show the sdd CLI row as `error` to every adopter (C002-ADR-004;
`../75-rollout.md` §1). This is a P-01 step: the agent prepares and checks, and P-01 publishes from
the account of C002-T-003.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | npm registry › `architect-sdd@0.1.0` | published by P-01 from `dist/architect-sdd-0.1.0.tgz`, the tarball that C002-T-023 checked and C002-T-076 packed at the release-candidate commit |
| add | `docs/releases/architect-sdd/0.1.0.md` | one record: the version, the tarball's `sha512` integrity, the release-candidate commit, `npm view architect-sdd version` after the publication, and the date |

## Preconditions

- C002-T-003 done (P-01's npm account and the name), C002-T-023 done (install smoke and manifest
  check of the tarball), C002-T-074 done (version 0.0.3, history). The version is 0.1.0 since C001-T-072 (ab0cfc7; revision D-041).
- C002-T-071 and **C002-T-076** done: the tarball is packed at the release-candidate commit of
  C002-T-076, whose evidence the Copilot release check reads. **Revision D-051 … D-053:** C002-T-081
  done; the release-candidate commit is C002-T-081's, and the tarball is the
  `dist/architect-sdd-0.1.0.tgz` it rebuilt there (its `scripts/sdd.mjs` holds the session-start
  output of C002-T-078). Wherever this task names C002-T-076's commit, C002-T-081's applies.
  **Revision D-054: C002-T-082's candidate applies.** C002-T-082 done (reached through C002-T-050);
  wherever this task names C002-T-081's candidate or commit, C002-T-082's release candidate applies,
  and the tarball is the `dist/architect-sdd-0.1.0.tgz` it rebuilt there. Neither runs an OpenCode step, since
  the OpenCode release moved to CHG-003.
- **C002-T-050 done** (plan critics CR-82, CR-84): the checklist record exists at 0.1.0 (C002-T-057,
  the Copilot clean-profile run, is dropped: C002-NFR-601 waived, defect D-049). npm versions are immutable, so the CLI is published only
  after every Copilot check can pass.
- `npm view architect-sdd@0.1.0` shows no such version. A version already on npm is never published
  again: npm versions are immutable (C002-RB-001).

## Step outline (no production code)

1. **Released dry run** (plan critics CR-82, CR-84). At the release-candidate commit of C002-T-076,
   run `node scripts/release-check.mjs --target copilot --dry-run`. It must give `released`, with the
   checklist record of C002-T-050 in place. Any other outcome stops this
   task, and nothing is published.
2. At the same commit, run `npm run smoke:npm` and the tarball check
   (`node scripts/check/tarball.mjs dist/architect-sdd-0.1.0.tgz`). Record the tarball's `sha512`
   integrity.
3. Re-check that the name is still P-01's (`npm view architect-sdd`; C002-RISK-017).
4. **P-01 step:** `npm publish dist/architect-sdd-0.1.0.tgz` from P-01's account, then
   `npm view architect-sdd version`, which must print `0.1.0`.
5. Write the record with the dry-run outcome, and commit it. C002-T-055 then releases Copilot.

## Verification

- `npm run smoke:npm`, the tarball check
- `npm view architect-sdd version` prints `0.1.0`
- `npm view architect-sdd@0.1.0 dist.integrity` equals the `sha512` integrity of the local tarball (`npm pack --dry-run --json` or a hash of the file), and the record names both

## Done when

- [ ] The Copilot release-check dry run gave `released` at the release-candidate commit, after C002-T-050
- [ ] `architect-sdd@0.1.0` is on npm, published by P-01 from the checked tarball of the release-candidate commit, before or together with the Copilot release of C002-T-055
- [ ] The record `docs/releases/architect-sdd/0.1.0.md` is committed
- [ ] Progress reported: `sdd task set C002-T-075 --status done --commit <sha>`
