---
id: C002-T-021
title: "Build: two bundles and the licence check over both"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-03
status: todo
depends_on: [C002-T-004, C002-T-016]
implements: [C002-REQ-413, C002-REQ-414, C002-NFR-801]
satisfies_ac: [C002-AC-413.1, C002-AC-414.1]
verified_by: [C002-TS-418, C002-TS-419, C002-TC-418, C002-TC-419]
components: [C002-COMP-013, C002-COMP-006]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-021 — Build: two bundles and the licence check over both

## Intent

Bundle `src/cli.ts` and `src/mcp/server.ts` in one esbuild run (C002-ADR-004). The licence check runs
over both metafiles (C002-REQ-413, ERR-BLD-001), and the notices of the union are produced for
`architect-sdd` (C002-REQ-414). `build.mjs` empties `plugins/architect/scripts/` except `sdd.mjs`,
so the second bundle is written **outside** the plugin, to `build/npm/sdd-mcp.mjs`.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `scripts/build.mjs` | second entry written to `build/npm/sdd-mcp.mjs` with the `#!` first line; plugin bundle unchanged in place |
| modify | `scripts/licenses.mjs` | accepts several metafiles; ERR-BLD-001 names package and licence |
| add | `build/npm/THIRD_PARTY_NOTICES.md` (generated) | union of both bundles; the plugin's notices keep listing `scripts/sdd.mjs` only |
| modify | `tests/integration/cap11/TS-1115.test.ts` | temporary build tree also copies `plugins/architect/.claude-plugin/plugin.json` and `src/mcp/` |
| add | `tests/integration/build/notices-union.test.ts` | the union notices list every package of both metafiles (SDK and Ajv included) |

## Preconditions

- C002-T-004 (version, first line) and C002-T-016 (server entry) done.

## Step outline (no production code)

1. Add the entry and its output path. `tests/smoke.test.ts` must still see exactly `["sdd.mjs"]` in
   the plugin's `scripts/`.
2. Run the licence check over the union of both metafiles. Check from the metafile whether the SDK
   already bundles Ajv (C002-ADR-002 consequence).
3. Fix the copy list of `TS-1115.test.ts` so that it still fails on the injected GPL package for the right reason.

## Verification

- `npm run build`, then `npm test -- smoke`, `npm test -- cap11` and `npm test -- build`

## Done when

- [ ] `plugins/architect/scripts/` holds only `sdd.mjs`
- [ ] C002-TS-418 and C002-TS-419 pass
- [ ] Progress reported: `sdd task set C002-T-021 --status done --commit <sha>`
