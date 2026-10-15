---
id: C002-T-032
title: "CLI: Copilot hook adapter (hook guard, session start, subagent stop)"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-002, C002-T-006, C002-T-010, C002-T-011]
implements: [C002-REQ-308, C002-REQ-309, C002-REQ-313, C002-REQ-314, C002-REQ-315, C002-REQ-319, C002-NFR-204]
satisfies_ac: [C002-AC-308.1, C002-AC-309.1, C002-AC-313.1, C002-AC-314.1, C002-AC-315.1, C002-AC-319.1]
verified_by: [C002-TS-311, C002-TS-312, C002-TS-313, C002-TS-314, C002-TS-320, C002-TS-321, C002-TS-322, C002-TS-323, C002-TS-324, C002-TS-333, C002-TS-334, C002-TS-335]
components: [C002-COMP-012, C002-COMP-018]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-032 — CLI: Copilot hook adapter

## Intent

Add the `--host copilot` hook commands of C002-IF-007 and C002-IF-008 §2–§4. `hook guard` classes the
tool through the tool classes file and runs the path or bash guard core, memory folder off
(C002-REQ-308). It allows `read_only` tools (C002-REQ-319) and denies with exit 2 on any fault
(C002-REQ-309, GUARD-HOOK-001). `hook session-start --host copilot` emits the brief or nothing
(C002-REQ-313, C002-REQ-314), and `hook subagent-stop` refreshes the trace and always exits 0
(C002-REQ-315).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/hooks/copilot.ts` | Copilot input → `HookInput`; identity from `--agent`; tool classes; fail closed |
| add | `src/cli/hook-cmds.ts` | `hook guard`, `hook subagent-stop` rows; `--host` on `hook session-start`; one row each in `COMMANDS` with `sampleArgs` that use a fixture stdin |
| add | `tests/integration/cap03/hook-adapter.test.ts` | the listed scenarios with Copilot-shaped input from the S-08 record |

## Preconditions

- C002-T-002 (hook input shape recorded), C002-T-006, C002-T-010 and C002-T-011 done.

## Step outline (no production code)

1. Parse the Copilot input as S-08 recorded it. An unreadable input, an unclassed tool or an
   unreadable classes file is denied with exit 2.
2. Decide with the same cores as Claude Code. No rule is duplicated.
3. `hook subagent-stop` runs the active-change trace for the four author agents and exits 0 even when
   the trace fails (C002-IF-007 exit codes).

## Verification

- `npm test -- cap03`, `npm test -- integration/cli` and `npm test -- tests/guards`

## Done when

- [ ] Every fault class gives exit 2 (C002-DOD-013 hook part)
- [ ] Progress reported: `sdd task set C002-T-032 --status done --commit <sha>`
