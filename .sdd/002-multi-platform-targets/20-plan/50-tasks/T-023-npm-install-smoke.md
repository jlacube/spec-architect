---
id: C002-T-023
title: "architect-sdd: install smoke test and manifest check"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-03
status: todo
depends_on: [C002-T-022]
implements: [C002-NFR-401, C002-NFR-402, C002-NFR-801]
satisfies_ac: [C002-AC-501.1, C002-AC-412.1]
verified_by: [C002-TS-501, C002-TS-417, C002-TC-501, C002-TC-417]
components: [C002-COMP-006]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-023 — architect-sdd: install smoke test and manifest check

## Intent

Show that the packed tarball installs and runs `sdd` and `sdd-mcp` with no other package
(C002-NFR-401, C002-NFR-402; C002-DOD-016, C002-DOD-017). Show also that it contains only
allowlisted licences (C002-NFR-801, C002-DOD-020).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/smoke-npm.mjs` | installs the tarball globally into a temporary prefix outside the repository; runs `sdd --version`, `sdd status` in a fixture workspace and an MCP `initialize` exchange with `sdd-mcp --profile files` |
| add | `scripts/check/tarball.mjs` | manifest check: 0 `dependencies`, only Node.js built-ins imported outside bundled code; SPDX header scan |
| modify | `package.json` | `smoke:npm` script |

## Preconditions

- C002-T-022 done.

## Step outline (no production code)

1. Install from the tarball file into a fresh prefix, with the npm cache isolated in the temporary folder.
2. Run the three probes. Remove the prefix afterwards.
3. Run the smoke in the 4 combinations: PowerShell 7 or Git Bash, with Node.js 20 LTS or 22 LTS.
   Record each result in `bench/results/`.

## Verification

- `npm run smoke:npm` under each of the 4 combinations
- `node scripts/check/tarball.mjs dist/architect-sdd-<version>.tgz`

## Done when

- [ ] 4 of 4 combinations pass; manifest check and SPDX scan report 0 findings
- [ ] Progress reported: `sdd task set C002-T-023 --status done --commit <sha>`
