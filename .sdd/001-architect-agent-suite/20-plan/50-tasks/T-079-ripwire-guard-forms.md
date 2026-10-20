---
id: C001-T-079
title: "Bash guard: ripwire verb and bounded default-map forms (D-012)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: todo
depends_on: [C001-T-051]
implements: [C001-REQ-1106]
satisfies_ac: [C001-AC-1106.1]
verified_by: [C001-TS-1107, C001-TS-1125, C001-TC-1107, C001-TC-1125]
components: [C001-COMP-08]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-079 — Bash guard: ripwire verb and bounded default-map forms (D-012)

## Intent

Close defect D-012: the bash guard admits the two ripwire forms of C001-IF-07 §3.1. These are the
verb form, where `--test-gate=<file>` now counts as a verb, and the bounded default map with no verb.
Every other ripwire command stays denied. This task follows C001-T-051, which stays `done`. The
exported verb lists stay as they are, so the OpenCode rules that CHG-002 generates from them do not
change. CHG-002 defect D-024 owns those rules.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/hooks/guard-bash.ts › ripwire` | word classes and allow rule of C001-IF-07 §3.1: `--test-gate=<non-empty>` counted as a verb by a check local to the function (bare `--test-gate` stays a flag verb); `--max-tokens=N` with digits-only N is the only map bound; `--token-budget=N` with digits-only N is an other-bound word (allowed in the verb form and next to `--max-tokens=N`, but it never admits a verb-less map on its own, so `ripwire . --token-budget=4000` is denied); allowed when path words ≤ 1 and (verbs = 1, or verbs = 0 and `--max-tokens=N` words ≥ 1); docstring names both forms and cites C001-IF-07 §3.1 |
| modify | `tests/guards/bash-corpus.json` | 18 cases, category `ripwire`, one per Examples row of C001-TS-1125 (next free IDs after BG-435), with tool, expectation and rule `GUARD-BASH-001` for the deny rows |
| modify | `tests/integration/cap11/TS-1107.test.ts` | the three Examples rows that C001-TS-1107 gained (`ripwire . --max-tokens=4000` → 0, `ripwire . --test-gate=src/checkout/payments.ts --limit=50` → 0, `ripwire .` → 2) |
| add | `tests/integration/cap11/TS-1125.test.ts` | C001-TC-1125: the 18 rows through the bundled `sdd guard-bash` as in TS-1107.test.ts (PowerShell row with `tool_name` PowerShell); exit code and stderr (empty, or containing `GUARD-BASH-001`); plus a check that each row appears in the corpus with the same expectation |
| modify | `plugins/architect/skills/code-discovery/SKILL.md` (optional) | "Claude Code wiring" bullet (line 114): "`ripwire` read verbs" becomes read verbs (file of `--test-gate` as `--test-gate=<file>`) and the default map with `--max-tokens=N` |
| modify | `plugins/architect/scripts/sdd.mjs` | rebuilt bundle (`node scripts/build.mjs`) |

## Preconditions

- C001-T-051 done (the guard, its corpus and C001-TC-1107 exist).
- C001-IF-07 §3.1 (revision D-012) and the Examples of C001-TS-1107 and C001-TS-1125 are approved at G2.
- Keep these unchanged, because CHG-002 reads them (defect D-024): the exported `RIPWIRE_VALUE_VERBS`
  and `RIPWIRE_FLAG_VERBS` (`--test-gate` is not added to the value list), the deny summary string,
  and the target wiring files `plugins/architect/targets/*/wiring/code-discovery.md`.

## Step outline (no production code)

1. Add the 18 corpus cases and the C001-TC-1107 and C001-TC-1125 tests. Confirm that the rows
   expected to be allowed are denied before the fix (test first).
2. Change `ripwire()` to follow the class table of C001-IF-07 §3.1. Do not change the word loop's
   fail-closed default: a word that fits no class denies the command. A bound needs `=N` with
   digits only. `--max-tokens=N` is the only map bound: it alone admits the default-map form.
   `--token-budget=N` is an other-bound word: allowed in the verb form and next to `--max-tokens=N`,
   but a command with no verb and only `--token-budget=N` is denied. `--test-gate=` with an empty value fits no class. Bare
   `--test-gate <file>` stays a flag verb with the file as the path word, so
   `ripwire --test-gate src/a.ts` (no directory word) is allowed and
   `ripwire . --test-gate src/a.ts …` (file as a second path word) is denied.
3. Check that no existing corpus case changes its decision. In particular BG-080, BG-081 and BG-090
   stay deny.
4. Optionally change the skill wording. Then run the structure checks, which include the skill
   size budget of C001-NFR-105.
5. Rebuild the bundle and run `npm run check`.
6. Suppose a CHG-002 replay test that reads the full corpus fails on the new cases under the
   OpenCode native-permissions mechanism. Record that failure against CHG-002 D-024 and do not
   change the corpus.
7. Hand over to CHG-002: once this task is done, C002-T-048 reruns C001-TS-1004. It also reruns
   C001-TS-1014 if that eval's transcript contains a `--test-gate` command the guard denied. Both
   reruns are spent under CHG-002, not this task.

## Verification

- `npm test -- cap11/TS-1107 cap11/TS-1125 guards/bash-corpus` (builds the tests, then runs the matching files through `scripts/test.mjs`, C001-ADR-006)
- `node scripts/build.mjs` then `npm run check` (green)
- `node plugins/architect/scripts/sdd.mjs lint`

## Done when

- [ ] Corpus 100% correct, including the 18 new cases. No previous case changes its decision.
- [ ] C001-TC-1107 and C001-TC-1125 pass on Node 20 and 22.
- [ ] `RIPWIRE_VALUE_VERBS`, `RIPWIRE_FLAG_VERBS` and the deny summary are unchanged (diff shows only `ripwire()` and its docstring in `src/hooks/guard-bash.ts`).
- [ ] `plugins/architect/scripts/sdd.mjs` rebuilt; `npm run check` green.
- [ ] C002-T-048 told that the C001-TS-1004 rerun (and C001-TS-1014 if affected) can run.
- [ ] Progress reported: `sdd task set C001-T-079 --status done --commit <sha>` (the commit is the resolution evidence for closing D-012).
