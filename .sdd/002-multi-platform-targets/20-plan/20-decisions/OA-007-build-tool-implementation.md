---
id: C002-OA-007
artifact: plan/option-analysis
change: CHG-002
phase: 20-plan
status: draft
title: "Implementation and invocation of the generator and the release check"
---

# C002-OA-007 — Implementation and invocation of the generator and the release check

## Problem

The target generator (C002-COMP-001) and the release check (C002-COMP-010) are build-time tools. The
spec fixes their entries and behaviour:

- `node scripts/generate.mjs` and `npm run generate`, with the options, run semantics and exit codes
  of C002-IF-004;
- `scripts/release-check.mjs` (C002-COMP-010), with the refusal rules of C002-IF-009 §5;
- the generator modules under `scripts/generate/` (source reader, translator, two emitters, writer);
- `npm run package` runs the generator after the build, and `npm run check` runs it into a temporary
  folder (C002-REQ-101, C002-REQ-601, C002-TS-603).

The spec leaves open the language of these modules and how they are run. Several things bear on it:

- They parse the same Markdown frontmatter as the CLI (`src/model/frontmatter.ts`, through `yaml`).
- They need deterministic I/O (C002-CON-09) and SHA-256 manifests.
- They carry the 37 scenarios of CAP-01 and CAP-06, plus the CAP-02 and CAP-03 scenarios that
  inspect generated files, all tested with `node:test` (C001-ADR-006).
- The constitution asks for TypeScript strict in `src/` and Node 20 as the minimum.
- Today's `scripts/*.mjs` are plain JavaScript that does not import `src/`.

The target structure checks (C002-COMP-007, `scripts/check/targets/*.mjs`) stay plain JavaScript like
their sibling checks. They call the generator through its CLI with `--json` and `--out`.

## Criteria

| Criterion | Weight |
|---|---|
| Reuse of the CLI's tested modules | 25% |
| Type safety under the constitution | 20% |
| Toolchain fit | 20% |
| Test integration | 20% |
| Invocation simplicity | 15% |

- **Reuse of the CLI's tested modules:** frontmatter parsing, path handling and hashing come from
  `src/`, with no second implementation.
- **Type safety under the constitution:** strict TypeScript, typechecked by `npm run typecheck`.
- **Toolchain fit:** no new dependency, and it runs on Node 20 with the existing esbuild.
- **Test integration:** the tests import the modules as `scripts/test.mjs` builds them, one file per
  scenario, and the run path equals the tested path.
- **Invocation simplicity:** `npm run generate`, `package` and `check` need no extra step, and the
  exit codes of C002-IF-004 hold.

## Candidates

- **A — TypeScript bundled at invocation:** TypeScript modules under `scripts/generate/` (and
  `scripts/release/`), included in `tsconfig.json`. The `.mjs` entry bundles them with esbuild into
  `build/` and runs the result.
- **B — Plain JavaScript:** ESM JavaScript in `scripts/generate/`, like `scripts/check/`, with its own
  frontmatter parsing through `yaml`.
- **C — TypeScript through a loader:** the same TypeScript modules, run through `tsx` added as a
  devDependency.
- **D — Node type stripping:** the TypeScript modules run directly by Node's built-in type
  stripping, unflagged from Node 22.18.
- **E — Subcommand of the shipped CLI:** `sdd generate` and `sdd release-check` inside
  `scripts/sdd.mjs`.

## Scores

| Candidate | Reuse of the CLI's tested modules | Type safety under the constitution | Toolchain fit | Test integration | Invocation simplicity | Weighted |
|---|---|---|---|---|---|---|
| A — TypeScript bundled at invocation | 5 | 5 | 5 | 5 | 4 | 4.85 |
| B — Plain JavaScript | 2 | 2 | 5 | 4 | 5 | 3.45 |
| C — TypeScript through a loader | 5 | 5 | 2 | 4 | 5 | 4.20 |
| D — Node type stripping | 4 | 5 | 1 | 3 | 3 | 3.25 |
| E — Subcommand of the shipped CLI | 5 | 5 | 4 | 5 | 3 | 4.50 |

- **A:**
  - *Reuse 5:* `src/` modules import directly. `src/` already uses `.ts` import specifiers, which
    esbuild resolves.
  - *Toolchain 5:* uses the esbuild already used by `build.mjs` and `test.mjs`.
  - *Tests 5:* the tests bundle the same modules the entry bundles.
  - *Invocation 4:* each run adds a bundling step of a fraction of a second, which counts towards
    C002-NFR-103 (5 s).
- **B:**
  - *Reuse 2:* cannot import `src/` without a build, so frontmatter parsing and hashing are written
    twice.
  - *Type safety 2:* JSDoc at best, outside `npm run typecheck`.
- **C:**
  - *Toolchain 2:* a new devDependency that does the same job as esbuild.
  - *Tests 4:* the tool runs through `tsx` while the tests run through esbuild bundles.
- **D:**
  - *Toolchain 1:* needs Node 22.18 or later on the maintainer machine, while the repository supports
    Node 20 (constitution).
  - *Tests 3:* esbuild `define` values such as `__SDD_VERSION__` do not exist under type stripping,
    and only erasable syntax is allowed.
  - *Invocation 3.*
- **E:**
  - *Invocation 3:* the tools would ship to every adopter inside the plugin bundle and
    `architect-sdd`.

## Sensitivity

A leads E by 0.35 and C by 0.65. E is excluded whatever the weights (Rejected).

Against C, A loses only if "Toolchain fit" falls below about 4% while "Invocation simplicity" takes
the difference (about 31%). That would ignore the constitution's minimal toolchain, so it is implausible.

## Presented

1. A — TypeScript bundled at invocation (Recommended)
2. C — TypeScript through a loader

## Recommendation

**A — TypeScript bundled at invocation.** It reuses the CLI's tested modules under strict typing with
the toolchain the repository already has, and the entries keep the paths and exit codes of
C002-IF-004.

## Rejected

- B — Plain JavaScript: duplicates the frontmatter parser and hashing, and leaves the logic behind
  dozens of scenarios untyped.
- D — Node type stripping: needs Node 22.18 or later for maintainers and only erasable syntax, against
  the Node 20 minimum.
- E — Subcommand of the shipped CLI: contradicts C002-IF-004 ("a build script of the repository, not
  part of the shipped CLI"). It would also ship the generator, the tables' reader and the release
  rules to every adopter, inside the plugin bundle and `architect-sdd`.
