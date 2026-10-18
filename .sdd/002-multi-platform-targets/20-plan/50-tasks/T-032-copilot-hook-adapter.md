---
id: C002-T-032
title: "CLI: Copilot hook adapter (hook guard by agent_type and mode, subagent guard, session start, subagent stop)"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-002, C002-T-006, C002-T-010, C002-T-011, C002-T-059]
implements: [C002-REQ-308, C002-REQ-309, C002-REQ-313, C002-REQ-314, C002-REQ-315, C002-REQ-319, C002-REQ-320, C002-REQ-327, C002-REQ-328, C002-REQ-329, C002-REQ-330, C002-NFR-204]
satisfies_ac: [C002-AC-308.1, C002-AC-309.1, C002-AC-313.1, C002-AC-314.1, C002-AC-315.1, C002-AC-319.1, C002-AC-320.1, C002-AC-327.1, C002-AC-328.1, C002-AC-329.1, C002-AC-330.1]
verified_by: [C002-TS-311, C002-TS-312, C002-TS-313, C002-TS-314, C002-TS-320, C002-TS-321, C002-TS-322, C002-TS-323, C002-TS-324, C002-TS-333, C002-TS-334, C002-TS-335, C002-TS-337, C002-TS-338, C002-TS-357, C002-TS-362, C002-TS-363, C002-TS-364, C002-TS-365, C002-TS-366, C002-TC-311, C002-TC-312, C002-TC-313, C002-TC-314, C002-TC-320, C002-TC-321, C002-TC-322, C002-TC-323, C002-TC-324, C002-TC-333, C002-TC-334, C002-TC-335, C002-TC-337, C002-TC-338, C002-TC-357, C002-TC-362, C002-TC-363, C002-TC-364, C002-TC-365, C002-TC-366]
components: [C002-COMP-012, C002-COMP-018]
risk_refs: [C002-RISK-003, C002-RISK-032, C002-RISK-033]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-032 — CLI: Copilot hook adapter

## Intent

Add the `--host copilot` hook commands of C002-IF-007 and C002-IF-008 §2–§4 (revised for defect
D-003 and after the critic's D-003 review, Q-safety-06). `sdd hook guard --host copilot --mode
<mode> --agents <list> [--classes <file>]` is the one PreToolUse hook command of the Copilot package
in both enforcement modes. It reads the caller from the input's `agent_type` (caller table of
C002-IF-008 §2) and decides by the eight rules of its decision order:
- the session agent's calls pass in both modes (C002-REQ-320, C002-REQ-330);
- an Architect agent's calls pass under `sdd-mcp-server` (C002-REQ-330) and are decided by tool class
  with the path or bash guard core, memory folder off, under `copilot-hooks` (C002-REQ-308,
  C002-REQ-319);
- a non-Architect subagent's call, in both modes, is the Copilot subagent guard: in a repository with
  `.sdd/` a `write` or `terminal` tool is denied with GUARD-HOOK-002 (C002-REQ-327), a `read_only`
  tool passes and an unclassed tool is denied (C002-REQ-328, C002-REQ-329); outside such a repository
  the call passes without reading the classes file (C002-REQ-329).

Any fault, a missing or unknown `--mode` or a missing `--agents` included, denies with GUARD-HOOK-001
(C002-REQ-309, C002-REQ-328). A deny writes the deny decision of C002-IF-008 §2 on standard output,
the message on standard error and exits 2, so the deny holds on hosts that report the exit as 1 and
fail closed (C002-NFR-204). `hook session-start --host copilot` emits the brief or nothing
(C002-REQ-313, C002-REQ-314); `hook subagent-stop` refreshes the trace for the author agents in
either `agent_type` form and always exits 0 (C002-REQ-315).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/hooks/copilot.ts` | Copilot input → caller (C002-IF-008 §2 caller table) → rules 1 … 8 of the decision order; workspace lookup from `cwd` with the nearest-`.sdd/` rule of `src/workspace/find.ts` (a `.sdd/` above the repository root counts as found) for rule 6; `--classes` default `<cli folder>/../hooks/tool-classes.json`; tool names compared exactly; the GUARD-HOOK-001 and GUARD-HOOK-002 messages of C002-IF-008 §2 and the errors catalogue (`10-spec/50-interfaces/errors.md`); deny decision JSON on standard output |
| add | `src/cli/hook-cmds.ts` | `hook guard` (`--mode`, `--agents`, optional `--classes`; a missing or unknown `--mode` or a missing `--agents` is a GUARD-HOOK-001 deny, not a usage error), `hook subagent-stop` rows; `--host` on `hook session-start`; one row each in `COMMANDS` with `sampleArgs` that use a fixture stdin |
| add | `tests/integration/cap03/hook-adapter.test.ts` | the listed scenarios with Copilot-shaped input of the S-08 record (`agent_type` as VS Code and as Copilot CLI report it, host built-in agent names, adopter names, absent, `null` and non-string values; `Write`, `Bash`, `Glob`, `tool_search_tool`, `<server>-<tool>`, the sdd MCP server tools), in both modes |

## Preconditions

- C002-T-002 (hook input shape recorded, done), C002-T-006, C002-T-010, C002-T-011 and C002-T-059
  (the `sdd install` row of C002-TS-312) done.

## Step outline (no production code)

1. Check the command's own arguments first (rule 1): `--mode` one of `sdd-mcp-server` and
   `copilot-hooks`, `--agents` present and not empty; otherwise deny whatever the input
   (C002-TS-362 rows 1 … 3).
2. Parse the input. Empty, non-JSON or non-object input denies whoever calls (rule 2). No
   `agent_type` key allows with nothing on either stream, without reading the classes file or the
   file system (rule 3; C002-TS-337, C002-TS-365).
3. Classify the caller: a string that, with any `architect:` prefix removed, is in `--agents` is an
   Architect agent; every other value (another string, the empty string, `null`, a number) is a
   non-Architect subagent (C002-TS-357 rows with `42` and `null`, `architect:my-reviewer`,
   `sdd-unknown`).
4. Architect agent under `sdd-mcp-server`: allow without reading the classes file (rule 4;
   C002-TS-365, C002-TS-366).
5. Non-Architect subagent, both modes (rule 6): deny a missing or empty `cwd`; look up `.sdd/` from
   `cwd` and allow when none is found, without reading the classes file (C002-TS-363 `fx-cp-install`
   rows, C002-TS-364); deny a failed lookup, a missing `tool_name` and an unreadable classes file
   with GUARD-HOOK-001; then decide by class: `write` or `terminal` → GUARD-HOOK-002 naming the tool
   and the `agent_type` as given (C002-TS-357), `read_only` → allow (C002-TS-363), unclassed (the
   `edit`, `write`, `Agent` and adopter MCP tools) → GUARD-HOOK-001 (C002-TS-362).
6. Architect agent under `copilot-hooks` (rules 7 and 8): deny a missing or empty `cwd`, a missing
   `tool_name`, an unclassed tool (letter case included, C002-TS-334) and an unreadable classes file
   with GUARD-HOOK-001; else decide with the same cores as Claude Code. No rule is duplicated.
7. Turn every exception, in the lookup and in the decision, into a deny with exit 2 (C002-TS-362
   fault-injection rows); exit 0 with a deny decision is never written.
8. `hook subagent-stop` runs the active-change trace for the four author agents and exits 0 even when
   the trace fails (C002-IF-007 exit codes).
9. Run the tests on the commands of C002-IF-008 §4 with `@CLI_COPY@` replaced by the bundled CLI,
   for `pkg-cp` (`--mode sdd-mcp-server`) and `pkg-cp-hooks` (`--mode copilot-hooks`). Their
   installed form (the command of `<folder>/hooks.json` and of `.github/hooks/architect-guard.json`
   written by `sdd install copilot`, CAP-03 fixtures) is added by C002-T-058.

## Verification

- `npm test -- cap03/hook-adapter`, `npm test -- integration/cli` and `npm test -- tests/guards`

## Done when

- [ ] Every fault class gives exit 2 with the deny decision on standard output (C002-DOD-013 hook part)
- [ ] Rules 1 … 8 each covered by at least one listed scenario row in each mode they apply to
- [ ] Carried cases listed in the task report: the installed form of the hook-adapter cases
      (C002-TC-357 and C002-TC-362 … C002-TC-366 included) to C002-T-058; C002-TC-311 to C002-T-033;
      C002-TC-313, C002-TC-321 and C002-TC-335 (manual) to C002-T-050
- [ ] Progress reported: `sdd task set C002-T-032 --status done --commit <sha>`
