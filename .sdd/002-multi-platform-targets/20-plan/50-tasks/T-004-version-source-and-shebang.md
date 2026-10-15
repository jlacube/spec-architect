---
id: C002-T-004
title: "Single version source, bare sdd --version and the executable first line"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: []
implements: [C002-REQ-511]
satisfies_ac: [C002-AC-511.1]
verified_by: [C002-TS-517, C002-TS-518]
components: [C002-COMP-013, C002-COMP-018]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-004 — Single version source, bare sdd --version and the executable first line

## Intent

Make `plugins/architect/.claude-plugin/plugin.json` the only version source of every build (C002-CON-16,
C002-ADR-004). Add `sdd --version`, which prints the bare version (C002-REQ-511), and give the plugin
bundle a `#!/usr/bin/env node` first line so that npm can install it as an executable.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `scripts/build.mjs` | `__SDD_VERSION__` read from `plugin.json`; banner written after a `#!/usr/bin/env node` first line |
| modify | `scripts/test.mjs` | `__SDD_VERSION__` read from `plugin.json` |
| modify | `src/cli/run.ts` | `--version` as a first-argument form beside `--help`, before command lookup |
| modify | `scripts/check/rules.mjs` | new plugin structure check: root `package.json` version equals `plugin.json` version (error otherwise) |
| modify | `tests/smoke.test.ts` | `sdd version` compared with `plugin.json`; keeps the `["sdd.mjs"]` folder assertion |
| add | `tests/integration/cli/version.test.ts` | bare `--version`, unchanged `sdd version`, mismatch check |

## Preconditions

- None.

## Step outline (no production code)

1. Read the version from `plugin.json` in `build.mjs` and `test.mjs`. The root `package.json` is no
   longer read for the version.
2. Add the structure check that fails when the root `package.json` version differs from
   `plugin.json`. The ADR-004 consequence requires that the two cannot disagree silently.
3. Prepend the `#!` line to the bundle. Search `tests/`, `scripts/` and `bench/` for any reader of
   line 1 of `scripts/sdd.mjs` (banner, first-line match). Move each one you find to the second line,
   or to the version API, and list them in the task report.
4. Add `--version`: one line, `<major>.<minor>.<patch>`, exit 0. `sdd version` keeps printing
   `architect-plugin@<semver>` (`src/version.ts`).

## Verification

- `npm test -- smoke` and `npm test -- integration/cli`
- `node plugins/architect/scripts/sdd.mjs --version` prints the bare version
- `npm run check`

## Done when

- [ ] No build or test reads the version from the root `package.json`
- [ ] The line-1 search result is recorded in the report (list of readers, or "none")
- [ ] C002-TS-517 and C002-TS-518 pass
- [ ] Progress reported: `sdd task set C002-T-004 --status done --commit <sha>`
