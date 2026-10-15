---
id: C002-T-022
title: "architect-sdd: staging, template CLI lines and npm pack"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-03
status: todo
depends_on: [C002-T-003, C002-T-012, C002-T-013, C002-T-021]
implements: [C002-REQ-412, C002-REQ-501, C002-REQ-502, C002-REQ-512, C002-REQ-518, C002-REQ-519]
satisfies_ac: [C002-AC-412.1, C002-AC-501.1, C002-AC-502.1, C002-AC-512.1, C002-AC-518.1, C002-AC-519.1]
verified_by: [C002-TS-417, C002-TS-501, C002-TS-502, C002-TS-503, C002-TS-519, C002-TS-529, C002-TS-530, C002-TS-534, C002-TS-535]
components: [C002-COMP-006, C002-COMP-013]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-022 — architect-sdd: staging, template CLI lines and npm pack

## Intent

`npm run package` stages `dist/npm/architect-sdd/` as C002-IF-003 §1 lays it out, then packs it with
`npm pack` into `dist/architect-sdd-<version>.tgz` (C002-REQ-502, C002-ADR-004). The package carries
`sdd` and `sdd-mcp` (C002-REQ-412, C002-REQ-501), the templates with their CLI lines written as `sdd`
(C002-REQ-518), and the Serena read-only mode file (C002-REQ-512). A plugin path left in a staged
template stops the build (C002-REQ-519, ERR-BLD-002).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `scripts/package.mjs` | npm staging step after the Claude Code staging: manifest, byte copy of `plugins/architect/scripts/sdd.mjs`, `build/npm/sdd-mcp.mjs`, templates, `serena/` mode file, `LICENSE`, union notices; `npm pack` into `dist/` |
| add | `scripts/npm-manifest.mjs` | writes the staged `package.json`: name `architect-sdd` (unscoped), version from `plugin.json`, `bin` for `sdd` and `sdd-mcp`, no `dependencies`, `files` list |
| add | `scripts/template-cli-lines.mjs` | rewrites `node <plugin-root>/scripts/sdd.mjs …` to `sdd …` in staged templates, then scans for `<plugin-root>/scripts/sdd.mjs` and `${CLAUDE_PLUGIN_ROOT}` (ERR-BLD-002 with template, line, construct) |
| add | `tests/integration/build/npm-staging.test.ts` | layout of C002-IF-003 §1, `templates/<profile>/` beside `scripts/` (blast-radius §3.3), byte equality of `sdd.mjs`, version, translated lines, failing scan |

## Preconditions

- C002-T-003 (name confirmed), C002-T-012 (template layout), C002-T-013 (mode-file path) and
  C002-T-021 (bundles) done.

## Step outline (no production code)

1. Stage, with the source tree left untouched (C002-REQ-102 applies to the generator; the staging
   writes only under `dist/`).
2. Translate and scan the staged templates. The scan runs after the translation.
3. Run `npm pack` through `execFile` (no shell), with `dist/` as the destination.

## Verification

- `npm run package`, then `npm test -- build`

## Done when

- [ ] The tarball has the name, version and two executables; the scan fails a planted plugin path
- [ ] Progress reported: `sdd task set C002-T-022 --status done --commit <sha>`
