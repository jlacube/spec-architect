---
id: C002-T-005
title: "Shared repository-root helper"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: []
implements: []
satisfies_ac: [C002-AC-516.1, C002-AC-517.1, C002-AC-521.1]
verified_by: [C002-TS-525, C002-TS-527, C002-TS-536]
components: [C002-COMP-012, C002-COMP-018]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-005 — Shared repository-root helper

## Intent

Three new rules compare a folder with "the current repository": the Serena data-folder rule
(C002-IF-008 §1.1), the `--cwd` rule (C002-IF-008 §1.2) and ERR-CLI-020 (C002-REQ-516). They need
one root rule in one module: the nearest folder upward with `.git`, else with `.sdd`, else the
working folder. `findWorkspace` stays the workspace rule of `decidePath` (blast-radius §5 question 2).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/io/repo-root.ts` | repository-root resolution and an "inside the repository" test on resolved real paths |
| add | `tests/unit/io/repo-root.test.ts` | `.git` first, `.sdd` fallback, working-folder fallback, letter case, 8.3 names, links and junctions |

## Preconditions

- None.

## Step outline (no production code)

1. Resolve upward from a given folder: the first folder with `.git` (folder or file); else the first
   with `.sdd`; else the start folder.
2. Provide the containment test that the guards and the CLI share. It compares resolved real paths
   with `normalisePath`, `pathKey` and `realPath` of `src/io/paths.ts`; paths.ts itself does not change.
3. Document in the module header that `decidePath` keeps `findWorkspace`.

## Verification

- `npm test -- unit/io`
- `npm run typecheck`

## Done when

- [ ] One module holds the root rule; no other module re-implements it
- [ ] `tests/unit/io/paths.test.ts` unchanged and green
- [ ] Progress reported: `sdd task set C002-T-005 --status done --commit <sha>`
