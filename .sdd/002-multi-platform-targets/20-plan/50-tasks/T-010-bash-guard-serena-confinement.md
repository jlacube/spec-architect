---
id: C002-T-010
title: "Bash guard: Serena commands confined to a data folder outside the repository"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: [C002-T-005, C002-T-009]
implements: [C002-REQ-517, C002-REQ-607]
satisfies_ac: [C002-AC-517.1, C002-AC-607.1]
verified_by: [C002-TS-527, C002-TS-528, C002-TS-537, C002-TS-610]
components: [C002-COMP-012]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-010 — Bash guard: Serena commands confined to a data folder outside the repository

## Intent

Allow `sdd serena-config` and `sdd serena-launch`, in both CLI forms, only with `--user-data` or with
a data folder that resolves outside the current repository (C002-REQ-517, C002-IF-008 §1.1). The
Claude Code doctor and init steps, which pass `${CLAUDE_PLUGIN_DATA}`, must stay allowed
(C002-REQ-623). This rule makes `decideBash` read its own environment for the first time
(blast-radius §3.1).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `tests/guards/bash-corpus.json` | for each Serena subcommand: `--user-data` (allow), a folder outside (allow), a folder inside (deny), the literal `${CLAUDE_PLUGIN_DATA}` with the env stub (allow), an unresolvable word (deny) |
| modify | `src/hooks/guard-bash.ts` | Serena-command detection; data-folder resolution per C002-IF-008 §1.1 with the C002-T-005 helper; `CLAUDE_PLUGIN_DATA` read from the guard's environment |
| modify | `tests/integration/cli/helpers.ts` | an optional environment stub for `runBundled`, additive only (hotspot rank 3) |
| modify | `bench/guards.mjs` | recorded inputs for a Serena command |

## Preconditions

- C002-T-005 and C002-T-009 done (same file, serialised).

## Step outline (no production code)

1. Add the corpus cases with their `env` stub and see them fail.
2. Detect the two subcommands after the CLI prefix. Take the data-folder argument and resolve it:
   the literal variable from the environment, else as a path relative to the `cwd`. A word that
   cannot be resolved is denied.
3. Deny when the resolved folder is inside the repository root.
4. Document in the guard header that the function now depends on its environment.
5. At the end of the milestone, run the doctor eval of regression-set §5 row 1 once, within the
   $0.50 cap. That run checks the C002-TS-537 assumption on the real host.

## Verification

- `npm test -- tests/guards`, `npm test -- cap10` and `npm test -- cap11`
- `npm run bench` (p95 ≤ 300 ms with the new file-system work)
- The milestone eval run: `evals/cap11/doctor-no-ripwire.eval.mjs` (one run)

## Done when

- [ ] Claude Code `.mcp.json` Serena launch and the doctor/init steps still allowed (C002-TS-537)
- [ ] Progress reported: `sdd task set C002-T-010 --status done --commit <sha>`
