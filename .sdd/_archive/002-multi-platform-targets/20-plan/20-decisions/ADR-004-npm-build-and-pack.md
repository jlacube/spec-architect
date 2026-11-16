---
id: C002-ADR-004
artifact: plan/adr
change: CHG-002
phase: 20-plan
status: accepted
---

# C002-ADR-004 — One CLI bundle in three places; `architect-sdd` packed by npm through Node

## Context and problem

C002-IF-003 fixes the content, manifest, template translation and staging of `architect-sdd`.
C002-REQ-502 and C002-IF-003 have P-01 publish it by hand. C002-CON-12 and C002-CON-16 fix the bundle
counts and the single version. All of these are cited, not re-decided.

Three points are open:

- whether the npm `sdd` entry is its own bundle or the plugin's (C002-REQ-501, C002-TS-501,
  C002-TS-502);
- which file is the single version source;
- how `npm pack` runs on Windows, where `npm` is a `.cmd` shim that Node 20.12 and later refuse to
  spawn without a shell.

Without a decision, three copies of the CLI could drift. The CLI's `__SDD_VERSION__` (read today from
the root `package.json`) could also differ from the package version that the doctor compares exactly
(C002-REQ-509, Q-cli-03).

## Considered options

C002-OA-008 (`OA-008-npm-build-and-pack.md`) scores five pipelines and presents three:

- **A — One build, copies, `npm pack` through Node** (recommended, 4.65).
- **C — One build, own tar writer** (3.80).
- **B — Separate bundles per destination** (3.75).

Rejected:

- an npm workspace, because it moves the staging out of `dist/npm/architect-sdd/`;
- CI publication, because it contradicts P-01's manual publication and the CI is dormant.

## Decision outcome

**A.**

- **Bundles.** `scripts/build.mjs` bundles `src/cli.ts` and `src/mcp/server.ts` in one esbuild run.
  Both get a `#!/usr/bin/env node` first line, then the existing banner. `__SDD_VERSION__` comes from
  `plugins/architect/.claude-plugin/plugin.json`, the single version source (C002-CON-16).
- **Licence check.** The check of `scripts/licenses.mjs` runs over the union of both metafiles
  (ERR-BLD-001, C002-REQ-413). The plugin's `THIRD_PARTY_NOTICES.md` keeps listing only what
  `scripts/sdd.mjs` bundles. The staging's `THIRD_PARTY_NOTICES.md` lists the union (C002-REQ-414).
- **One CLI bundle, three places.** The plugin's `scripts/sdd.mjs` is the `sdd` output, as today.
  `package.mjs` copies it byte for byte to `dist/npm/architect-sdd/scripts/sdd.mjs`, and the generator
  copies it to `dist/copilot/scripts/sdd.mjs` (C002-CON-12, C002-CON-14). This is compatible with
  C002-IF-003 §1: each entry is still an esbuild bundle of the same source tree and version.
- **Staging and pack.** `package.mjs` stages `dist/npm/architect-sdd/` as C002-IF-003 §1 describes,
  with the template translation and scan (ERR-BLD-002). It then runs
  `npm pack dist/npm/architect-sdd --pack-destination dist` as a child process of the Node executable
  with npm's JavaScript entry. That entry is `npm_execpath` under `npm run`, else
  `node_modules/npm/bin/npm-cli.js` beside the Node executable. If neither exists, packaging fails
  with a message naming both. There is no shell fallback.

## Consequences

- Good:
  - C002-TS-501/502 hold by construction;
  - the doctor's exact version check compares two values that come from one file;
  - the tarball is npm's own;
  - there is no new dependency and no shell (constitution, Windows first).
- The root `package.json` version is no longer read by the build. A plugin structure check (or the
  `npm run check` step of C002-COMP-007) fails when it differs from `plugin.json`, so the two cannot
  disagree silently.
- The plugin bundle gains a shebang first line. The implementing task checks that no CHG-001 check
  or test reads line 1 of `scripts/sdd.mjs` (for example the banner).
- Publication stays manual (cited). P-01 runs `npm publish dist/architect-sdd-<version>.tgz` from
  their own npm account. The order of the `architect-sdd` publication and the target releases (the
  doctor requires the exact version, C002-REQ-509) belongs to the rollout plan.
- Affects: C002-COMP-004, C002-COMP-006, C002-COMP-013, C002-COMP-018; constraints C002-CON-11,
  C002-CON-12, C002-CON-14, C002-CON-16.
