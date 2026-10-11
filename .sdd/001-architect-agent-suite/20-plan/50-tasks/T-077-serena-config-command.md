---
id: C001-T-077
title: "sdd serena-config command"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: in-progress
depends_on: [C001-T-044]
implements: [C001-REQ-1013]
satisfies_ac: [C001-AC-1013.1]
verified_by: [C001-TS-1015, C001-TC-1015]
components: [C001-COMP-02, C001-COMP-09]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-077 — sdd serena-config command

## Intent

Move the writing of Serena's configuration out of the conductor into the CLI (D-004 revision): `sdd serena-config <plugin-data-dir>` creates or updates `serena/serena_config.yml`, so agents write only under `.sdd/` and the path guard needs no exception.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/workspace/serena-config.ts` | create or update the config: `web_dashboard: false`, `web_dashboard_open_on_launch: false`, `project_serena_folder_location` inside the data folder, `projects: []` when absent; other keys kept |
| modify | `src/cli/commands.ts` | register `serena-config <plugin-data-dir>` (C001-IF-01) |
| modify | `plugins/architect/commands/init.md`, `doctor.md`, `agents/sdd-conductor.md` | run the command; drop the conductor's write exception |
| add | `tests/integration/cap10/serena-config.test.ts` | create, update, idempotence |

## Preconditions

- T-044
- Dependencies done: C001-T-044

## Step outline (no production code)

1. Implement the command and its tests.
2. Update the two commands and the conductor's write rule.
3. Re-run the TS-1015 eval.

## Verification

- C001-TC-1015 passes (dev tier)
- Run `npm run check` and `node plugins/architect/scripts/sdd.mjs lint`.

## Done when

- [ ] `sdd serena-config` creates and updates the file idempotently
- [ ] No agent or command writes outside `.sdd/`
- [ ] Progress reported: `sdd task set C001-T-077 --status done --commit <sha>`
