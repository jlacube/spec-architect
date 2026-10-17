---
id: C002-T-059
title: "Bash guard: sdd install denied in every form"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: [C002-T-009, C002-T-010]
implements: [C002-REQ-325]
satisfies_ac: [C002-AC-325.1, C002-AC-607.1]
verified_by: [C002-TS-351, C002-TS-353, C002-TS-610, C002-TS-636, C002-TC-351, C002-TC-353, C002-TC-610, C002-TC-636]
components: [C002-COMP-012, C002-COMP-018]
risk_refs: [C002-RISK-001]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-059 — Bash guard: sdd install denied in every form

## Intent

Deny the subcommand `install` of the sdd CLI to every Architect agent, in the bare and the script
form and whatever words follow it, with GUARD-BASH-001 and the reason `sdd install writes outside
.sdd/; P-03 runs it in their own terminal` (C002-REQ-325, C002-IF-008 §1.2). The `Allowed:` summary
gains `not install;` (C002-IF-008 §1). No decision of an existing command changes (C002-TS-353,
C002-GOAL-05). The sdd MCP server command tool (C002-T-019) and the Copilot guard hook (C002-T-032)
reuse the same core, so they deny it too.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `tests/guards/bash-corpus.json` | the `install` rows of C002-TS-351 (bare, script form, `--package`, `--cwd` inside the root, `install` alone, another target, `--help`, PowerShell) as `deny`; the rows of C002-TS-353 (`sdd lint install` and the other allowed commands) as `allow`; the `install copilot` rows of C002-TS-610 and C002-TS-636 |
| modify | `src/cli/writing-commands.ts` | the `install copilot` row of C002-IF-008 §1.2, marked as denied in every form; a first word `install` selects it whatever the second word is |
| modify | `src/hooks/guard-bash.ts` | after the CLI prefix is recognised, a first word `install` denies with the reason above, before the `--cwd` rule of C002-T-009; the `Allowed:` summary text of C002-IF-008 §1 |

## Preconditions

- C002-T-009 (writing-command table, `--cwd` rule) and C002-T-010 (last edit of `guard-bash.ts`
  before this one; one guard rule per task, serialised on the same file) done.

## Step outline (no production code)

1. Add the corpus cases and see the deny cases fail.
2. Add the row to the writing-command table. Until C002-T-058 registers the `install` command, the
   consistency test of C002-T-009 exempts this row from "names a `COMMANDS` row"; C002-T-058 removes
   the exemption.
3. Add the rule: the word after the CLI prefix (`sdd`, or `node <path>/sdd.mjs`) is `install` → deny.
   A later word `install` (`sdd lint install`) is not the subcommand and keeps its decision.
4. Change the `Allowed:` summary; check that `TS-1107:31` still matches its shape (one line ending in
   a period, regression-set §3) and record the text change as a C002-REQ-325 expectation change for
   C002-TS-626 (C002-REQ-623).

## Verification

- `npm test -- tests/guards`, `npm test -- cap11` and `npm test -- integration/cli`
- `npm run bench`

## Done when

- [ ] Every install case denies with the reason; every existing corpus case keeps its expectation
- [ ] Guard p95 ≤ 300 ms in `npm run bench`
- [ ] Progress reported: `sdd task set C002-T-059 --status done --commit <sha>`
