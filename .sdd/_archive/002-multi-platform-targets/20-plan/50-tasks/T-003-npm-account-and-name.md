---
id: C002-T-003
title: "P-01: npm account and availability of the name architect-sdd"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-01
status: done
depends_on: []
implements: []
satisfies_ac: [C002-AC-502.1]
verified_by: [C002-TS-503, C002-TC-503]
components: [C002-COMP-006]
risk_refs: []
estimate: S
report: { commit: 5ef4d58, completed_at: 2026-10-18, notes: "Account jlacube, 2FA on for publish, name unclaimed (npm view: E404); docs/releases/npm-prerequisites.md; publication only in T-052 by P-01" }
---

# C002-T-003 — P-01: npm account and availability of the name architect-sdd

## Intent

C002-REQ-502 fixes an unscoped npm package named `architect-sdd`, and C002-ADR-004 leaves publication
to P-01's own account. This task confirms both before the staging is built. A taken name is a spec
defect, not something the implementer may rename around.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/npm-prerequisites.md` | date, npm account name (no token or e-mail), result of the name check, 2FA setting for publish |

## Preconditions

- None.

## Step outline (no production code)

1. **P-01 step:** confirm that an npm account exists for publication and that two-factor
   authentication for publish is on. Record the account name only, never a token.
2. **P-01 step:** check that `architect-sdd` is unclaimed (`npm view architect-sdd` returns
   "not found"). Record the command output.
3. If the name is taken or reserved, raise a spec defect against C002-REQ-502 and C002-IF-003 with
   `sdd defect add --ref C002-REQ-502 --summary "…"`. The rename goes through `/architect:revise spec`.
4. Note in the record that publication happens only in C002-T-052, after the release evidence.

## Verification

- `npm view architect-sdd` output recorded in the file (expected: E404).
- Run `node plugins/architect/scripts/sdd.mjs lint 002`.

## Done when

- [ ] P-01 has confirmed the account and the name, or a defect is raised
- [ ] No credential appears in the repository
- [ ] C002-TC-503 (staging test of the package name) listed in the task report as carried to C002-T-022
- [ ] Progress reported: `sdd task set C002-T-003 --status done --commit <sha>`
