---
id: C002-T-013
title: "CLI: --user-data and --read-only for the Serena commands"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: [C002-T-005, C002-T-006]
implements: [C002-REQ-515, C002-REQ-516]
satisfies_ac: [C002-AC-515.1, C002-AC-516.1]
verified_by: [C002-TS-523, C002-TS-524, C002-TS-525, C002-TS-533, C002-TC-523, C002-TC-524, C002-TC-525, C002-TC-533]
components: [C002-COMP-018]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-013 — CLI: --user-data and --read-only for the Serena commands

## Intent

The generated targets have no `${CLAUDE_PLUGIN_DATA}`. `sdd serena-config` and `sdd serena-launch`
therefore take `--user-data`, which resolves to the per-user data folder of `architect-sdd`
(C002-REQ-515, C002-IF-007). They refuse a folder that cannot be determined, is relative or lies
inside the repository, with ERR-CLI-020 (C002-REQ-516). `--read-only` adds the Serena read-only mode
file shipped beside the CLI (C002-REQ-114, C002-REQ-512).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/cli/commands.ts` | `serena-config` and `serena-launch` rows: positional optional when `--user-data` is given; `--read-only` |
| add | `src/workspace/user-data.ts` | per-user data folder per platform, as C002-IF-007 defines it; containment through the C002-T-005 helper |
| modify | `src/workspace/serena-launch.ts` | `--mode <cli folder>/../serena/architect-read-only.yml` when `--read-only` is given |
| modify | `src/cli/errors.ts` | ERR-CLI-020 |
| add | `tests/integration/cli/serena-user-data.test.ts` | platform rules, refusals, nothing written on refusal, read-only mode path in the plugin layout and in the npm layout |

## Preconditions

- C002-T-005 and C002-T-006 done.

## Step outline (no production code)

1. Resolve the per-user folder from the platform rules of C002-IF-007. Refuse it when it is
   undeterminable, relative or inside the repository, before any write or spawn.
2. Keep `serena-config <folder>` with a positional folder exactly as today (`cap10` tests).
3. Resolve the mode file relative to the bundle. The same folder shape must hold in the plugin and in
   the `architect-sdd` staging (blast-radius §3.3); C002-T-022 checks the staging side.

## Verification

- `npm test -- integration/cli` and `npm test -- cap10`

## Done when

- [ ] The listed scenarios pass; `cap10` Serena tests unchanged and green
- [ ] Progress reported: `sdd task set C002-T-013 --status done --commit <sha>`
