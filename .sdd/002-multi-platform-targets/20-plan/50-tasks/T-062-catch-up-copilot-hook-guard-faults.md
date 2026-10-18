---
id: C002-T-062
title: "Catch-up for revision D-007: Copilot hook guard faults, --host usage fault and duplicate tool classes"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: done
depends_on: [C002-T-032]
implements: [C002-REQ-308, C002-REQ-309, C002-REQ-327, C002-REQ-328, C002-NFR-204]
satisfies_ac: [C002-AC-308.1, C002-AC-309.1, C002-AC-327.1, C002-AC-328.1]
verified_by: [C002-TS-367, C002-TS-368, C002-TS-369, C002-TS-370, C002-TC-367, C002-TC-368, C002-TC-369, C002-TC-370]
components: [C002-COMP-012, C002-COMP-018]
risk_refs: [C002-RISK-032]
estimate: S
report: { commit: 4c1b67c, completed_at: 2026-10-18, notes: "TC-367/368/369/370; shownTool shared in src/hooks/copilot.ts; remaining: option-parser faults (missing --mode value, unknown option, extra argument) still say 'tool call' because that path cannot read the input — minor, for the next spec batch; installed form in T-058" }
---

# C002-T-062 — Catch-up for revision D-007: Copilot hook guard faults, --host usage fault and duplicate tool classes

## Intent

Bring the Copilot hook adapter of C002-T-032, which is done and not reopened, to the decision order
revised for defect D-007 (C002-IF-008 §2 rules 1, 6 and 8; GUARD-HOOK-001 in
`../../10-spec/50-interfaces/errors.md` §6). Most of it is already in `src/hooks/copilot.ts`: the
`no path in the tool input (<pointers>)` fault, the `--agents` name without the `sdd-` prefix, and the
class lookup that tries the most restrictive class first. This task proves those parts with
C002-TS-367, C002-TS-369 and C002-TS-370. It fixes the one known gap: the `--host` usage fault of
`hook guard` always shows `tool call`, where C002-TS-368 wants the input's `tool_name` whenever the
input is readable.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/cli/hook-cmds.ts` › `hookGuard` | a missing `--host` or one other than `copilot` denies with `GUARD-HOOK-001: <tool or "tool call"> denied — hook command usage: --host.`, where `<tool>` is the input's `tool_name` when standard input is a JSON object with a non-empty string `tool_name`; exit 2 with the deny decision, as today |
| modify | `src/hooks/copilot.ts` | only where a new test shows a gap (rule 6 and rule 8 class order `write`, `terminal`, `read_only`; the two rule-8 fault texts) |
| modify | `tests/integration/cap03/hook-adapter.test.ts` | adds C002-TC-367 … C002-TC-370 with the hook commands of C002-IF-008 §4 and `@CLI_COPY@` replaced by the bundled CLI; the classes files with duplicate entries are fixture variants of `pkg-cp` and `pkg-cp-hooks` |

## Preconditions

- C002-T-032 done (hook adapter, fixtures fx-cp and the hook inputs).

## Step outline (no production code)

1. Write the four scenario tests first. Keep each Examples row as its own `test()` whose name starts
   with the TS ID (test plan §1).
2. Read the tool name for the `--host` fault the same way as the other usage faults: from the input
   when it can be read, else `tool call`. A usage fault never becomes a usage error without a deny
   decision (C002-IF-008 §2 rule 1).
3. Run C002-TC-367, C002-TC-369 and C002-TC-370 against the existing code. Change
   `src/hooks/copilot.ts` only for a row that fails, and name that row in the task report.
4. Extend the fault-injection evidence of C002-DOD-013 with the new fault rows: `--host` other than
   `copilot`, a write tool without a path, and an `--agents` name without `sdd-`.
5. Leave the installed form of these cases to C002-T-058, which runs the hook-adapter cases a second
   time through the written hook files.

## Verification

- `npm test -- cap03/hook-adapter`
- `npm test -- tests/guards` and `npm run bench` (the guard cores are reused, not edited)

## Done when

- [ ] C002-TC-367 … C002-TC-370 pass with the bundled CLI; the existing hook-adapter cases are unchanged and pass
- [ ] The task report lists the rows that needed a code change and carries the installed form to C002-T-058
- [ ] Progress reported: `sdd task set C002-T-062 --status done --commit <sha>`
