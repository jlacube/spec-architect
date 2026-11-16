---
id: C001-T-078
title: "Opt-in commit at approval and Serena launcher"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: done
depends_on: [C001-T-025, C001-T-077]
implements: [C001-REQ-816, C001-REQ-817, C001-REQ-1013]
satisfies_ac: [C001-AC-816.1, C001-AC-817.1, C001-AC-1013.1]
verified_by: [C001-TS-818, C001-TS-819, C001-TS-1015, C001-TS-1007, C001-TC-818, C001-TC-819, C001-TC-1015, C001-TC-1007]
components: [C001-COMP-02, C001-COMP-09]
risk_refs: []
estimate: S
report: { commit: 91f7bcf, completed_at: 2026-10-13, notes: "TS-818/819/1007 pass; TS-1015 dev tier pass ($0.09)" }
---

# C001-T-078 — Opt-in commit at approval and Serena launcher

## Intent

Close defects D-009 and D-010: `sdd gate approve --commit` commits the approved change folder and the status files when P-01 opted in (constitution, Version control), and the plugin starts Serena through `sdd serena-launch`, which writes Serena's configuration before Serena first runs.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/gate/gate.ts`, `src/cli/commands.ts`, `src/cli/errors.ts` | `--commit`: git preconditions checked before any write (ERR-CLI-018), commit of the change folder, `.sdd/SDD.md` and `.sdd/registry.json` after the approval |
| add | `src/workspace/serena-launch.ts` | ensure the config, run `serena` with the arguments, streams passed through, Serena's exit code |
| modify | `plugins/architect/.mcp.json`, `scripts/check/mcp.mjs` | Serena launched through `node ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs serena-launch ${CLAUDE_PLUGIN_DATA} --` |
| modify | `plugins/architect/templates/constitution/constitution.md`, `skills/gate-protocol/SKILL.md` | Version control section (commit at approval yes/no); the conductor passes `--commit` when it says yes |
| add | `tests/integration/cap08/TS-818.test.ts`, `TS-819.test.ts` | commit content and message; refusals |
| modify | `tests/integration/cap10/TS-1007.test.ts` | launch through the CLI; live tool list through the launcher |

## Preconditions

- T-025, T-077
- Dependencies done: C001-T-025, C001-T-077

## Step outline (no production code)

1. Implement `--commit` with its precondition checks and tests.
2. Implement `serena-launch` and switch `.mcp.json`.
3. Update the constitution template and the gate protocol.

## Verification

- C001-TC-818, 819, 1007 pass; C001-TC-1015 at dev tier
- Run `npm run check` and `node plugins/architect/scripts/sdd.mjs lint`.

## Done when

- [ ] A fresh session in a repository without `/architect:init` leaves no `.serena/` in it
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-078 --status done --commit <sha>`
