---
id: C001-T-001
title: "Repository scaffolding and toolchain"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-1
status: todo
depends_on: []
implements: [C001-REQ-1112]
satisfies_ac: [C001-AC-1112.1]
verified_by: [C001-TS-1113, C001-TC-1113]
components: [C001-COMP-11, C001-COMP-12]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-001 — Repository scaffolding and toolchain

## Intent

Create the repository skeleton every later task builds on: Node/TypeScript toolchain (C001-ADR-002), the plugin folder under plugins/architect/ (C001-CON-16), the MIT license (Spec-Q2), and a minimal local marketplace manifest so the plugin can be installed for spikes S-05 and evals.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `package.json` | private package; scripts build, test, check, bench; devDependencies typescript, esbuild, yaml, @types/node; engines node >=20 |
| add | `tsconfig.json` | strict, ES2022, moduleResolution bundler, outDir build/ |
| add | `scripts/build.mjs` | esbuild bundle src/cli.ts -> plugins/architect/scripts/sdd.mjs (platform node, format esm, banner with version) |
| add | `src/cli.ts` | placeholder entry printing `architect-plugin@<version>` for `version` |
| add | `plugins/architect/.claude-plugin/plugin.json` | name architect, version 0.0.1, license MIT |
| add | `.claude-plugin/marketplace.json` | marketplace architect-local listing ./plugins/architect |
| add | `LICENSE and plugins/architect/LICENSE` | MIT, year 2026, copyright holder name |
| modify | `.gitignore` | add node_modules/, build/, coverage/ (keep .sdd/metrics/) |
| add | `tests/smoke.test.ts` | node:test smoke test for `version` |

## Preconditions

- Node >= 20 and git installed on REF-WIN
- Dependencies done: none

## Step outline (no production code)

1. Create package.json and tsconfig.json; install dev dependencies.
2. Write scripts/build.mjs producing a single ESM bundle; verify `node plugins/architect/scripts/sdd.mjs version`.
3. Create the plugin skeleton folders listed in C001-IF-08 §1 (empty placeholders allowed).
4. Add LICENSE files and plugin.json/marketplace.json with the fields of C001-IF-08 §2.
5. Add the smoke test and an `npm test` script using `node --test`.

## Verification

- `npm run build` then `node plugins/architect/scripts/sdd.mjs version` prints architect-plugin@0.0.1
- `npm test` passes
- C001-TC-1113: LICENSE contains "MIT License", "2026" and the holder name
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Build produces exactly one file plugins/architect/scripts/sdd.mjs
- [ ] LICENSE present in repo root and plugin root
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-001 --status done --commit <sha>` (or frontmatter fallback before T-026)
