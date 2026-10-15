---
id: C002-T-038
title: "Doctor host rows, version checks and the toolchain record per host"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-05
status: todo
depends_on: [C002-T-013, C002-T-014, C002-T-028]
implements: [C002-REQ-504, C002-REQ-505, C002-REQ-506, C002-REQ-507, C002-REQ-508, C002-REQ-509, C002-REQ-510]
satisfies_ac: [C002-AC-504.1, C002-AC-505.1, C002-AC-506.1, C002-AC-507.1, C002-AC-508.1, C002-AC-509.1, C002-AC-510.1]
verified_by: [C002-TS-506, C002-TS-507, C002-TS-508, C002-TS-509, C002-TS-510, C002-TS-511, C002-TS-512, C002-TS-513, C002-TS-514, C002-TS-515, C002-TS-516, C002-TS-526, C002-TS-639]
components: [C002-COMP-014, C002-COMP-015, C002-COMP-016, C002-COMP-002]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-038 — Doctor host rows, version checks and the toolchain record per host

## Intent

Make the doctor table and the toolchain record host-dependent through wiring variants (C002-IF-006).
The table gains a host row (C002-REQ-504), an sdd CLI row on the generated targets with the exact
version check (C002-REQ-509) and an `untested` status for an unrecorded host version
(C002-REQ-508). Under the hooks fallback it gains a hooks row (C002-REQ-510). The failure conditions of
C002-REQ-505 apply. On Claude Code the minimum-version row stays (C002-REQ-506), and the source
`commands/doctor.md` text does not change, so `TS-1116` stays green.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/targets/{opencode,copilot}/wiring/doctor-*.md` | final host rows, probes (`sdd host-version`, `sdd --version`), outcome and remedies with the tested versions from the tables |
| modify | `plugins/architect/targets/{opencode,copilot}/wiring/code-discovery-toolchain.md` | toolchain record with the host and the sdd CLI rows (C002-REQ-507) |
| add | `evals/targets/doctor/*.eval.mjs` | `@eval` doctor cases with fake host shims (`tests/fixtures/cfg-*` pattern) |
| add | `tests/integration/cap05/doctor-variants.test.ts` | generated doctor bodies per target; the Claude Code doctor unchanged |

## Preconditions

- C002-T-013, C002-T-014 and C002-T-028 done.

## Step outline (no production code)

1. Write the remedies rows with the install command for the package's own `architect-sdd` version
   (C002-REQ-509).
2. Report a `.cmd`-only tool as `error` with a native-install fix under server mode (C002-IF-006 §2).
3. Run the Claude Code doctor evals of regression-set §5 once at the end of the milestone. If no source
   text changed, only the first row is needed.

## Verification

- `npm test -- cap05` and `npm test -- cap11` (`TS-1116.test.ts`)
- One milestone run of `evals/cap11/doctor-no-ripwire.eval.mjs`

## Done when

- [ ] Generated doctor variants pass the integration test; Claude Code doctor text byte-unchanged
- [ ] Progress reported: `sdd task set C002-T-038 --status done --commit <sha>`
