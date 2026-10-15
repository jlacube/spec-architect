---
id: C002-OA-008
artifact: plan/option-analysis
change: CHG-002
phase: 20-plan
status: draft
title: "Building, staging and packing architect-sdd"
---

# C002-OA-008 — Building, staging and packing `architect-sdd`

## Problem

C002-IF-003 fixes what `architect-sdd` contains: the files, the manifest, the CLI-line translation of
the templates with its scan (ERR-BLD-002), the tarball `dist/architect-sdd-<version>.tgz` as
"npm pack of the staging folder" `dist/npm/architect-sdd/` (C002-COMP-006), and P-01 publishing by
hand (C002-REQ-502). C002-CON-12 fixes one bundled file in the plugin, two entries in `architect-sdd`
and a byte copy of the plugin bundle in the Copilot package. C002-CON-16 fixes one version per run,
the source plugin's.

Three points are left open:

1. **Where the `sdd` entry comes from.** It can be a separate bundle or the plugin's bundle. C002-REQ-501
   and C002-TS-501/502 ask for the same source and version, with the same output.
2. **Where the version comes from.** Today `build.mjs` reads it from the root `package.json` and
   `package.mjs` from `plugin.json`. Both are 0.0.1 now, but C002-CON-16 and C002-INV-11 need one
   source.
3. **How `npm pack` runs on Windows.** `npm` is a `.cmd` shim there, and Node 20.12 and later refuse
   to spawn a `.cmd` file without a shell.

Out of scope: the publication step, which P-01 does by hand (cited), and the release order of
`architect-sdd` and the target packages (rollout).

## Criteria

| Criterion | Weight |
|---|---|
| Same-source guarantee | 30% |
| Windows robustness without a shell | 20% |
| Tarball fidelity to npm's rules | 20% |
| Fit with the existing build and package scripts | 15% |
| Low implementation effort | 15% |

- **Same-source guarantee:** the plugin's `scripts/sdd.mjs`, the npm `sdd` and the Copilot copy cannot
  diverge in code or version.
- **Windows robustness without a shell:** runs on REF-WIN under PowerShell 7 and Git Bash without
  `shell: true`.
- **Tarball fidelity to npm's rules:** the tarball holds exactly what `npm publish` of that tarball
  would publish (`files`, the `LICENSE`/`README`/`package.json` added automatically, path
  normalisation).
- **Fit with the existing build and package scripts:** extends `build.mjs`, `licenses.mjs` and
  `package.mjs` instead of adding parallel pipelines (C001-CON-02 reviewed by C002-CON-12).
- **Low implementation effort:** code to write and test.

## Candidates

- **A — One build, copies, `npm pack` through Node:** `build.mjs` bundles `src/cli.ts` and
  `src/mcp/server.ts` in one esbuild run. Both get a shebang banner, the version from `plugin.json`
  and one licence check over the union of inputs. The plugin's `scripts/sdd.mjs` is the `sdd` output,
  copied byte for byte to the npm staging and to the Copilot package. `package.mjs` stages
  `dist/npm/architect-sdd/` and runs `npm pack` with Node and npm's own JavaScript entry.
- **B — Separate bundles per destination:** the plugin bundle as today. A new `build-npm.mjs` bundles
  both npm entries with their own banner and metafile, and packs as in A.
- **C — One build, own tar writer:** as A, but the tarball is written by an in-repository tar and gzip
  writer instead of `npm pack`.
- **D — npm workspace:** a committed `packages/architect-sdd/` with its own manifest, built in place
  and packed with `npm pack -w`.
- **E — CI publication:** build, pack and publish from CI with npm trusted publishing and provenance.

## Scores

| Candidate | Same-source guarantee | Windows robustness without a shell | Tarball fidelity to npm's rules | Fit with the existing build and package scripts | Low implementation effort | Weighted |
|---|---|---|---|---|---|---|
| A — One build, copies, npm pack through Node | 5 | 4 | 5 | 5 | 4 | 4.65 |
| B — Separate bundles per destination | 3 | 4 | 5 | 4 | 3 | 3.75 |
| C — One build, own tar writer | 5 | 5 | 2 | 4 | 2 | 3.80 |
| D — npm workspace | 4 | 4 | 5 | 2 | 3 | 3.75 |
| E — CI publication | 5 | 5 | 5 | 2 | 2 | 4.10 |

- **A:**
  - *Same source 5:* one bundle, three copies, so C002-TS-501/502 hold by construction. A shebang
    first line is harmless for `node <path>/sdd.mjs`.
  - *Windows 4:* npm's JavaScript entry comes from `npm_execpath` under `npm run`, else from the npm
    folder beside the Node executable, else the step fails with a message. There is no shell fallback.
  - *Fidelity 5:* npm itself packs.
  - *Effort 4.*
- **B:**
  - *Same source 3:* two builds of one source can differ in banner, `define` or esbuild options, and
    only the C002-TS-501/502 output comparison catches it.
  - *Effort 3:* a second pipeline and a second metafile.
- **C:**
  - *Windows 5:* no child process.
  - *Fidelity 2:* npm's file selection and normalisation have to be re-implemented, and a divergence
    shows only at publish time.
  - *Effort 2.*
- **D:**
  - *Fit 2:* changes the root install (`workspaces`) and moves staging out of `dist/`.
- **E:**
  - *Fit 2* and *effort 2:* the CI is dormant (C001-REQ-1119) and would need publishing credentials.

## Sensitivity

A leads E by 0.55, but E is excluded whatever the weights (Rejected).

Among the presentable candidates, A leads C by 0.85. Even with "Tarball fidelity" at 0%, C overtakes A
only when "Windows robustness" carries more than 45%. That is implausible, because the tarball is what
adopters install.

A score change would close the gap: if npm's JavaScript entry cannot be found reliably on REF-WIN,
A's Windows score drops to 2 (total 4.25), and A still leads.

## Presented

1. A — One build, copies, `npm pack` through Node (Recommended)
2. C — One build, own tar writer
3. B — Separate bundles per destination

## Recommendation

**A — One build, copies, `npm pack` through Node.** One bundle in three places makes the same-source
requirement structural, and npm's own packer guarantees the tarball is what npm publishes.

## Rejected

- D — npm workspace: moves the staging folder out of `dist/npm/architect-sdd/` (C002-COMP-006,
  C002-IF-003 §1) and changes the root install.
- E — CI publication: contradicts P-01's manual publication (C002-REQ-502, C002-IF-003), and the CI
  is dormant (C001-REQ-1119).
