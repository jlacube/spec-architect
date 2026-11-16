---
id: C002-ADR-003
artifact: plan/adr
change: CHG-002
phase: 20-plan
status: accepted
---

# C002-ADR-003 — Generator and release check in TypeScript, bundled by their entry scripts

## Context and problem

C002-IF-004 fixes the generator's entry, options, run semantics and exit codes. C002-COMP-010 fixes
`scripts/release-check.mjs`. The spec does not say in which language their modules are written or how
they are run.

Both tools need the CLI's frontmatter parser, path handling and hashing (`src/`). Both carry many
`node:test` scenarios (C001-ADR-006). Both must be deterministic (C002-CON-09, C002-NFR-301) and run on
the Node 20 baseline of the constitution.

Without a decision, the generator could duplicate the CLI's parser in plain JavaScript, or add a
second TypeScript toolchain.

## Considered options

C002-OA-007 (`OA-007-build-tool-implementation.md`) scores five approaches and presents two:

- **A — TypeScript bundled at invocation** (recommended, 4.85).
- **C — TypeScript through a loader** (`tsx`; 4.20).

Rejected:

- plain JavaScript (duplicates the parser);
- Node type stripping (Node 22.18 or later);
- a subcommand of the shipped CLI (contradicts C002-IF-004).

## Decision outcome

**A.** The modules are TypeScript, under `scripts/generate/` (source reader, translator, emitters,
writer) and `scripts/release/`. `tsconfig.json` includes both folders, so `npm run typecheck` covers
them.

`scripts/generate.mjs` and `scripts/release-check.mjs` are thin entries. Each bundles its `main.ts`
with esbuild into `build/` and runs it, with its arguments and exit code passed through. `src/`
modules are imported, never copied.

How the scripts call the generator:

- `scripts/package.mjs` adds a `generate` step after the build and the plugin checks, as a child
  process of `scripts/generate.mjs` (exit code ≠ 0 stops packaging, C002-TS-103).
- `scripts/check.mjs` adds a step that runs the generator with `--out` set to a fresh temporary
  folder, runs `scripts/check/targets/*.mjs` on it, and deletes it (C002-TS-603).
- The target checks call the generator through its CLI (`--json`) and stay plain JavaScript, like
  their sibling checks.

The release check regenerates the packages through the generator's modules (C002-NFR-501).

## Consequences

- Good:
  - one parser and one hashing routine for the CLI, the generator and the release check;
  - strict typing;
  - no new dependency;
  - the tests (`tests/integration/cap01/…`, `cap06/…`) import the same modules the entries bundle.
- The bundling step of each run counts towards C002-NFR-103 (5 s). The bench of C002-NFR-103 measures
  the whole `node scripts/generate.mjs` run, so the step is included.
- `build/` holds the bundled tools, next to `build/tests/`. Neither is shipped (C002-CON-10 and
  C002-CON-12 unaffected).
- `__SDD_VERSION__` and any other esbuild `define` are set by the entries in the same way as by
  `build.mjs`. The version comes from `plugin.json` (C002-ADR-004, C002-CON-16).
- Affects: C002-COMP-001, C002-COMP-007, C002-COMP-010, C002-COMP-013; constraints C002-CON-09,
  C002-CON-16.
