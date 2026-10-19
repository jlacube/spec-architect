---
id: C002-T-023
title: "architect-sdd: install smoke test and manifest check"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-03
status: in-progress
depends_on: [C002-T-022, C002-T-034, C002-T-061]
implements: [C002-NFR-401, C002-NFR-402, C002-NFR-801]
satisfies_ac: [C002-AC-501.1, C002-AC-412.1]
verified_by: [C002-TS-501, C002-TS-417, C002-TC-501, C002-TC-417]
components: [C002-COMP-006]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: "Code 64760b0. Node 22 x Git Bash/PowerShell pass (bench/results/smoke-npm-2026-10-19T07-59-*). Node 20 runs open: Node 20 not installed on REF-WIN. Candidate defects: TGT-NPM-001 owner = T-023; SPDX scan has no code (used C002-NFR-801); DoD-020 dist/ target scan only via --spdx." }
---

# C002-T-023 — architect-sdd: install smoke test and manifest check

## Intent

Show that the packed tarball installs and runs `sdd` and `sdd-mcp` with no other package
(C002-NFR-401, C002-NFR-402; C002-DOD-016, C002-DOD-017). Show also that it contains only
allowlisted licences (C002-NFR-801, C002-DOD-020). This task owns the tarball check of C002-IF-005
§6: TGT-NPM-001 (manifest and imports, the `tarball` step of `npm run check`) and the SPDX header
scan, whose findings carry the code `C002-NFR-801` (errors.md §7, revised for defect D-013 item 9).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/smoke-npm.mjs` | installs the tarball globally into a temporary prefix outside the repository; runs `sdd --version`, `sdd status` in a fixture workspace and an MCP `initialize` exchange with `sdd-mcp --profile files` |
| add | `scripts/check/tarball.mjs` | manifest check TGT-NPM-001: 0 `dependencies`, only Node.js built-ins imported outside bundled code; SPDX header scan of the tarball, and of each folder given with `--spdx`, findings under `C002-NFR-801` |
| modify | `package.json` | `smoke:npm` script |

## Preconditions

- C002-T-022 done; C002-T-061 done, so the smoke runs on the tarball with the revised print forms and
  README of the D-004 … D-009 revision.
- C002-T-034 done, so `npm run package` writes `dist/opencode/` and `dist/copilot/` for the `--spdx`
  scan of step 4.
- The Node.js 20 LTS and 22 LTS of step 3 are the adopter floors (C002-NFR-401). The Node.js 22.22.2
  floor of the OpenCode JS SDK binds the eval and replay machine only, not this smoke (scope §5).

## Step outline (no production code)

1. Install from the tarball file into a fresh prefix, with the npm cache isolated in the temporary folder.
2. Run the three probes. Remove the prefix afterwards.
3. Cover the 4 combinations (PowerShell 7 or Git Bash, with Node.js 20 LTS or 22 LTS) in **two
   smoke runs, one per Node.js version**: each run covers both shells (D-013 item 10). Record each
   run in `bench/results/`. The Node.js 22 run is recorded
   (`bench/results/smoke-npm-2026-10-19T07-59-*`); the Node.js 20 run needs Node.js 20 LTS on
   REF-WIN (handoff "Reference machine").
4. Run the tarball check with the two generated target folders, for the C002-DOD-020 evidence.

## Verification

- `npm run smoke:npm`, once with Node.js 20 LTS and once with Node.js 22 LTS active
- `node scripts/check/tarball.mjs dist/architect-sdd-<version>.tgz --spdx dist/opencode --spdx dist/copilot`
  (C002-DOD-020 evidence: TGT-NPM-001 and the SPDX scan of the tarball, `dist/opencode/` and
  `dist/copilot/`)
- `npm run check` (its `tarball` step)

## Done when

- [ ] 2 of 2 smoke runs pass, covering the 4 shell and Node.js combinations; TGT-NPM-001 and the SPDX scan (with both `--spdx` folders) report 0 findings
- [ ] Progress reported: `sdd task set C002-T-023 --status done --commit <sha>`
