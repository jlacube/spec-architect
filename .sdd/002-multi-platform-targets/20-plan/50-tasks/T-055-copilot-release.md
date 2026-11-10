---
id: C002-T-055
title: "P-01: release the Copilot target"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-050, C002-T-054, C002-T-057, C002-T-071, C002-T-075, C002-T-076]
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
(C002-REQ-509). From revision D-036 on, C002-T-075 publishes it, apart from any OpenCode release; this
task checks it. The release channel is `dist/architect-copilot-<version>.zip` (Q-release-01). Under the
hooks fallback the release record is flagged under the exception of C002-DEC-005 (C002-REQ-622).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/copilot/<version>/release.json` | release record written by the release check |
| add | `docs/releases/copilot/<version>/zip.sha256` | one line: SHA-256 and file name of the released zip, for C002-RB-003 |

## Preconditions

- **Package version 0.1.0** (defect D-041; P-01 answer to Q-copilot-010-01, "Ship 0.1.0 on both
  hosts (Recommended)"). Copilot 0.0.2 is refused (`INJ-19` and `INJ-21` acted upon, CHG-001 D-020;
  revision D-036). The 0.0.3 candidate 4ef1d61 (C002-T-071) is refused by the dry run with
  ERR-REL-007, because the CHG-001 release-gate fixes changed the files it is generated from, and
  the source is 0.1.0 since ab0cfc7. So Copilot ships alone at 0.1.0: `<version>` below is `0.1.0`,
  from `docs/releases/copilot/0.1.0/` and `dist/architect-copilot-0.1.0.zip`. Its Copilot CLI
  evidence is the 24 sessions that **C002-T-076** step 4 runs at 0.1.0. The runsheet
  `docs/runsheets/T-055-copilot-release.md` names 0.1.0. OpenCode is not released in this round.
- **C002-T-075 done:** `architect-sdd@0.1.0` is on npm, published by P-01 apart from any OpenCode
  release (revision D-036). This task publishes nothing itself.
- **C002-T-076 done** (revision D-041). The release is made from the release-candidate commit
  9eb56c0, to which revision D-047 moved it from b481e82, the commit C002-T-076 records (P-01's answers
  to Q-d047-ship-01 and Q-d047-ship-02), after the D-047 rerun list (`../handoff.md`); C001-T-072
  tags v0.1.0 at 9eb56c0 or at a later commit with an empty `plugins/architect/` diff against it, else
  P-01 decides before this task. It replaces C002-T-071's commit in the next item, and its near-cap list
  replaces C002-T-071's in Done when.
- **C002-T-071 done** (P-01 answer to Q-release-base-01; plan critic CR-71). The release is made from
  the release-candidate commit that C002-T-071 records, with the CHG-001 fixes. C002-T-071 re-ran the
  Copilot unpaid steps (C002-T-054 steps 1 and 2) there. Its step 5 ran the paid Copilot CLI rows (C002-T-054 step 3, 24 sessions, Copilot pool) at that
  commit and version 0.0.3 (P-01 answers to Q-inj21-01 and Q-noask-01). That commit is no longer the
  release candidate (revision D-041): C002-T-076 retakes these steps at 0.1.0, and C002-T-050 and
  C002-T-057 run on the package of C002-T-076's commit.
- C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-050, C002-T-054 and C002-T-057 done.
- The S-08 record is not `deferred` (its VS Code versions are historical since revision D-047; the
  tested versions are VS Code 1.145.2 with Copilot Chat 0.73.0, scope §3.1): the signed-off record gives
  `sdd-mcp-server` (C002-T-002). Only a later record of a new tested version (C002-REQ-621) could
  bring the defer branch of `75-rollout.md` §5 back, and with it a plan revision that drops this task.
- The release record names the tested hosts of scope §3.1 (VS Code `1.145.2` with GitHub Copilot
  Chat `0.73.0` since revision D-047, Copilot CLI `1.0.98`).

## Step outline (no production code)

1. Run `node scripts/release-check.mjs --target copilot` at the release-candidate commit. It compares
   the regenerated package with `dist/copilot/` and with the zip (C002-T-047 step 4).
2. **npm check:** `npm view architect-sdd@<version>` shows the version that C002-T-075 published. If
   the check of step 1 refuses Copilot, release nothing; the refusal stays recorded.
3. **P-01 step:** release `dist/architect-copilot-<version>.zip` through the channel of `75-rollout.md`
   §1, and keep the released zip with its `zip.sha256` line (retention for C002-RB-003).
4. Commit the release record and the `zip.sha256` line.

## Verification

- `npm view architect-sdd version` equals the `plugin.json` version
- The release record validates against `docs/releases/release-record.schema.json`; flagged under the hooks fallback
- The SHA-256 of the shared zip equals the `zip.sha256` line

## Done when

- [ ] `architect-sdd@0.1.0` on npm (C002-T-075) no later than the Copilot release
- [ ] The near-cap list of C002-T-076's report for `copilot-cli` is "none", or each listed injection row has P-01's cap-exception decision recorded (C002-IF-010 §2.2 Caps of injection rows; plan critic CR-80, spec CR-122)
- [ ] Copilot release record and released zip recorded, or the refusal recorded
- [ ] Progress reported: `sdd task set C002-T-055 --status done --commit <sha>`
