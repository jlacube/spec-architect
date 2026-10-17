---
id: C002-T-032
title: "CLI: Copilot hook adapter (hook guard by agent_type, session start, subagent stop)"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-002, C002-T-006, C002-T-010, C002-T-011, C002-T-059]
implements: [C002-REQ-308, C002-REQ-309, C002-REQ-313, C002-REQ-314, C002-REQ-315, C002-REQ-319, C002-REQ-320, C002-NFR-204]
satisfies_ac: [C002-AC-308.1, C002-AC-309.1, C002-AC-313.1, C002-AC-314.1, C002-AC-315.1, C002-AC-319.1, C002-AC-320.1]
verified_by: [C002-TS-311, C002-TS-312, C002-TS-313, C002-TS-314, C002-TS-320, C002-TS-321, C002-TS-322, C002-TS-323, C002-TS-324, C002-TS-333, C002-TS-334, C002-TS-335, C002-TS-337, C002-TS-338, C002-TC-311, C002-TC-312, C002-TC-313, C002-TC-314, C002-TC-320, C002-TC-321, C002-TC-322, C002-TC-323, C002-TC-324, C002-TC-333, C002-TC-334, C002-TC-335, C002-TC-337, C002-TC-338]
components: [C002-COMP-012, C002-COMP-018]
risk_refs: [C002-RISK-003]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-032 — CLI: Copilot hook adapter

## Intent

Add the `--host copilot` hook commands of C002-IF-007 and C002-IF-008 §2–§4 (revised for defect
D-003). `sdd hook guard --host copilot --agents <list> [--classes <file>]` is one plugin-level guard:
it reads the caller from the input's `agent_type` (an `architect:` prefix removed), allows every call
without an Architect `agent_type` without reading the classes file (C002-REQ-320), and decides an
Architect agent's call by its tool class with the path or bash guard core, memory folder off
(C002-REQ-308, C002-REQ-319). It denies on any fault (C002-REQ-309, GUARD-HOOK-001). A deny writes
the deny decision of C002-IF-008 §2 on standard output, the message on standard error and exits 2,
so the deny holds on hosts that report the exit as 1 and fail closed (C002-NFR-204).
`hook session-start --host copilot` emits the brief or nothing (C002-REQ-313, C002-REQ-314);
`hook subagent-stop` refreshes the trace for the author agents in either `agent_type` form and always
exits 0 (C002-REQ-315).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/hooks/copilot.ts` | Copilot input → `HookInput` in the decision order of C002-IF-008 §2 (unreadable input; caller from `agent_type`; Architect-call faults; class); `--classes` default `<cli folder>/../hooks/tool-classes.json`; tool names compared exactly; deny decision JSON on standard output |
| add | `src/cli/hook-cmds.ts` | `hook guard` (`--agents`, optional `--classes`), `hook subagent-stop` rows; `--host` on `hook session-start`; one row each in `COMMANDS` with `sampleArgs` that use a fixture stdin |
| add | `tests/integration/cap03/hook-adapter.test.ts` | the listed scenarios with Copilot-shaped input of the S-08 record (`agent_type` as VS Code and as Copilot CLI report it, `Write`, `Bash`, `Glob`, `tool_search_tool`, `<server>-<tool>`) |

## Preconditions

- C002-T-002 (hook input shape recorded, done), C002-T-006, C002-T-010, C002-T-011 and C002-T-059
  (the `sdd install` row of C002-TS-312) done.

## Step outline (no production code)

1. Parse the input. Empty, non-JSON or non-object input denies whoever calls. A missing, non-string
   or non-Architect `agent_type` allows with nothing on either stream (C002-TS-337, C002-TS-338).
2. For an Architect agent's call, deny a missing or empty `cwd`, a missing `tool_name`, an unclassed
   tool (letter case included, C002-TS-334) and an unreadable classes file with GUARD-HOOK-001; else
   decide with the same cores as Claude Code. No rule is duplicated.
3. Turn every exception into a deny with exit 2; exit 0 with a deny decision is never written.
4. `hook subagent-stop` runs the active-change trace for the four author agents and exits 0 even when
   the trace fails (C002-IF-007 exit codes).
5. Run the tests on the commands of C002-IF-008 §4 with `@CLI_COPY@` replaced by the bundled CLI. Their
   installed form (the command of `<folder>/hooks.json` written by `sdd install copilot`, CAP-03
   fixtures) is added by C002-T-058.

## Verification

- `npm test -- cap03/hook-adapter`, `npm test -- integration/cli` and `npm test -- tests/guards`

## Done when

- [ ] Every fault class gives exit 2 with the deny decision on standard output (C002-DOD-013 hook part)
- [ ] Carried cases listed in the task report: the installed form of the hook-adapter cases to
      C002-T-058; C002-TC-311 to C002-T-033; C002-TC-313, C002-TC-321 and C002-TC-335 (manual) to C002-T-050
- [ ] Progress reported: `sdd task set C002-T-032 --status done --commit <sha>`
