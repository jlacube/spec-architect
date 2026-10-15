---
id: C002-T-012
title: "CLI: template show and template list, confined to the profile folder"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: [C002-T-006]
implements: [C002-REQ-513, C002-REQ-514, C002-REQ-520]
satisfies_ac: [C002-AC-513.1, C002-AC-514.1, C002-AC-520.1]
verified_by: [C002-TS-520, C002-TS-521, C002-TS-522, C002-TS-531, C002-TS-532]
components: [C002-COMP-018]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-012 — CLI: template show and template list, confined to the profile folder

## Intent

Generated agents name templates through `sdd template show <profile>/<path>` (C002-REQ-115), so the
CLI must print a repository override or the shipped template. It refuses any path that leaves the
profile folder, with ERR-CLI-019 (C002-REQ-513, C002-REQ-514). `template list` prints the paths in
code-point order (C002-REQ-520).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/workspace/templates.ts` | confinement inside the shared template resolution: normalised and real path must stay inside the profile folder (no `..`, no link out) |
| add | `src/cli/template-cmd.ts` | `template show`, `template list` handlers, registered by one row each in `COMMANDS` |
| modify | `src/cli/errors.ts` | ERR-CLI-019 as in the CHG-002 `errors.md` |
| add | `tests/integration/cli/template.test.ts` | override first, shipped fallback, `..` and link refusals, ordering and uniqueness, `CLAUDE_PLUGIN_ROOT` set while the npm `sdd` runs |

## Preconditions

- C002-T-006 done: the catalogue and command-list tests read the CHG-002 rows.

## Step outline (no production code)

1. Put the confinement in the one resolution function, so that `change new` and `upgrade` inherit it.
   Their callers pass constants, so `templates.test.ts` and `cap01/TS-123` stay green unchanged.
2. Add the two commands in a new module (hotspot rank 1: keep `commands.ts` edits to one row each),
   with `sampleArgs` for `frontend.test.ts`.
3. List = the union of override and shipped paths, deduplicated, sorted by code point.

## Verification

- `npm test -- integration/cli`, `npm test -- unit/workspace` and `npm test -- cap01`

## Done when

- [ ] C002-TS-520, C002-TS-521, C002-TS-522, C002-TS-531, C002-TS-532 pass
- [ ] Progress reported: `sdd task set C002-T-012 --status done --commit <sha>`
