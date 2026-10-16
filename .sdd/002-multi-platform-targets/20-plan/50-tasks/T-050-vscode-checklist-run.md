---
id: C002-T-050
title: "P-01: run the manual VS Code checklist and record it"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-046, C002-T-054]
implements: []
satisfies_ac: [C002-AC-614.1, C002-AC-615.1, C002-AC-618.1]
verified_by: [C002-TS-617, C002-TS-618, C002-TS-621, C002-TC-617, C002-TC-618, C002-TC-621, C002-TC-901]
components: [C002-COMP-011]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-050 — P-01: run the manual VS Code checklist and record it

## Intent

**P-01 executes this task.** P-01 runs the checklist on the Copilot release candidate in VS Code at the
tested versions, on a fresh install, and records the run (C002-DOD-004). This covers C002-SC-02 (a toy
change reaches G1). Under the hooks fallback, or when Copilot CLI cannot load the package
(C002-REQ-613), the run includes the injection cases; under the hooks fallback with hooks enabled
(C002-REQ-629). This task serves the Copilot release only (C002-T-055); the OpenCode release does not
wait for it.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/checklists/records/vscode-<YYYY-MM-DD>-<version>.md` | the checklist record |

## Preconditions

- C002-T-046 and C002-T-054 done; the release candidate packed at the commit of C002-T-054.
- The Copilot subscription named in C002-T-002 has allowance for about 10 VS Code sessions per
  checklist run, about 20 with the repeat of step 3 (test plan §4.2, C002-RISK-026). These sessions
  are not billed to the prepaid API key.

## Step outline (no production code)

1. **P-01 step:** install the Copilot package from `dist/architect-copilot-<version>.zip` and
   `architect-sdd` from the local tarball on a fresh VS Code profile, following `INSTALL.md` only.
2. **P-01 step:** run every step of the checklist and record each result and the versions.
3. A failed step reopens the owning task; the run is repeated after the fix.

## Verification

- `node scripts/release-check.mjs --target copilot --dry-run` reads the record without a checklist error

## Done when

- [ ] Record committed with every step passed and P-01's name
- [ ] Progress reported: `sdd task set C002-T-050 --status done --commit <sha>`
