---
id: C002-T-011
title: "Path guard core: memory-folder option"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: []
implements: []
satisfies_ac: [C002-AC-401.1, C002-AC-625.1]
verified_by: [C002-TS-401, C002-TS-628, C002-TC-401, C002-TC-628]
components: [C002-COMP-012]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-011 — Path guard core: memory-folder option

## Intent

The generated targets have no agent memory (C002-REQ-106), so the sdd MCP server and the Copilot hook
adapter call the path guard core with the memory folder off (C002-IF-008 §5). Claude Code keeps the
default, memory folder on, so the 256-case path corpus does not change.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/hooks/guard-path.ts` | `decidePath` takes an options object with `memoryFolder` (default on); the deny message for memory-off follows C002-IF-008 §5 |
| modify | `tests/guards/path-corpus.test.ts` | a second run of the memory-category cases with the option off, all expected `deny` |

## Preconditions

- None.

## Step outline (no production code)

1. Add the option with default on. `guardPath` (Claude Code) passes nothing.
2. With the option off, a write into `.claude/agent-memory/…` is denied with GUARD-PATH-001.
3. Keep the memory-off wording out of the default deny message (`TS-1103` … `TS-1105` pin it).

## Verification

- `npm test -- tests/guards` and `npm test -- cap11`

## Done when

- [ ] Path corpus unchanged and green; memory-off run green
- [ ] Carried cases listed in the task report: C002-TC-401 (needs the server and tarball) to C002-T-017; C002-TC-628 (replay) to C002-T-040
- [ ] Progress reported: `sdd task set C002-T-011 --status done --commit <sha>`
