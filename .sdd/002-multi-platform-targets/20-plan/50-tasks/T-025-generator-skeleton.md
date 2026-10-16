---
id: C002-T-025
title: "Generator: entry, source reader, writer and manifest"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-004, C002-T-024]
implements: [C002-REQ-102, C002-NFR-301]
satisfies_ac: [C002-AC-102.1]
verified_by: [C002-TS-104, C002-TS-105, C002-TC-104, C002-TC-105]
components: [C002-COMP-001]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-025 — Generator: entry, source reader, writer and manifest

## Intent

Build the generator frame of C002-IF-004 and C002-ADR-003. A thin `scripts/generate.mjs` bundles
`scripts/generate/main.ts` into `build/` and runs it. The source reader loads the plugin once,
read-only, into the neutral model (C002-REQ-102). The writer stages every selected package and
publishes all of them or none (C002-INV-02), each with a generation manifest. Output is
byte-deterministic (C002-NFR-301).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/generate.mjs` | thin entry: esbuild bundle of `main.ts` into `build/`, arguments and exit code passed through |
| add | `scripts/generate/main.ts`, `reader.ts`, `model.ts`, `writer.ts`, `diagnostics.ts` | options `--out`, `--target`; ERR-GEN codes; staging folder, rename on success; manifest with `source_digest` and file hashes |
| modify | `tsconfig.json` | `include` adds `scripts/generate` and `scripts/release` |
| modify | `package.json` | `generate` script |
| add | `tests/integration/cap01/generator-frame.test.ts` | source tree unchanged (hash before and after), all-or-nothing on a planted error, stable file order, LF line endings |

## Preconditions

- C002-T-004 (version define) and C002-T-024 (tables) done.

## Step outline (no production code)

1. Import the `src/` frontmatter parser and hashing; never copy them.
2. Read agents, commands, skills, hooks and MCP servers into the model. Never open a source file for writing.
3. Write to `dist/.staging-<target>` and rename over `dist/<target>` only when no diagnostic exists.
4. Sort files and keys and use LF line endings, so two runs produce identical bytes.

## Verification

- `npm run generate -- --out <tmp>` twice, then compare the trees
- `npm test -- cap01` and `npm run typecheck`

## Done when

- [ ] C002-TS-104 and C002-TS-105 pass; source hash unchanged after a run
- [ ] Progress reported: `sdd task set C002-T-025 --status done --commit <sha>`
