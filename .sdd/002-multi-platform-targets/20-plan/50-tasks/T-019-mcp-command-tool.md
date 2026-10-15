---
id: C002-T-019
title: "sdd MCP server: run_command without a shell"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-03
status: todo
depends_on: [C002-T-008, C002-T-010, C002-T-016]
implements: [C002-REQ-405, C002-REQ-406, C002-REQ-407]
satisfies_ac: [C002-AC-405.1, C002-AC-406.1, C002-AC-407.1]
verified_by: [C002-TS-406, C002-TS-407, C002-TS-408, C002-TS-409, C002-TS-641, C002-TS-642]
components: [C002-COMP-005, C002-COMP-012]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-019 — sdd MCP server: run_command without a shell

## Intent

Implement the `shell` profile's command tool (C002-IF-002 §4). The bash guard core decides each call
(C002-REQ-405), in the dialect the call names (`bash` by default, or `powershell`). An allowed
command runs **without a shell**, from the guard tokeniser's words. `sdd` runs as the server's own
package CLI (C002-REQ-407), and the result returns the exit code, standard output and standard error
(C002-REQ-406).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/mcp/tools/shell.ts` | decision, word list from `tokenise`, spawn without shell, pipe-only filters in process, output caps, timeout |
| modify | `src/hooks/guard-bash.ts` | export the dialect selection used by `decideBash`, if not already reachable; no rule change |
| add | `tests/integration/mcp/shell.test.ts` | allowed, refused (GUARD-BASH-001 and GUARD-BASH-002), non-zero exit not an error, `.cmd` refused (ERR-MCP-006), own CLI version, PowerShell dialect |

## Preconditions

- C002-T-008 and C002-T-010 (guard rules final for this change) and C002-T-016 done.

## Step outline (no production code)

1. Decide with `decideBash` for an Architect agent, `cwd` = session root. A deny starts no process.
2. Take the words from `tokenise`. A first word `sdd` runs `node <package>/scripts/sdd.mjs`, the
   bundle beside the server. Any other allowlisted executable is resolved from PATH, and a `.cmd`
   or `.bat` match is refused.
3. Apply the pipe-only filters (`head -n`, `tail -n`, `wc -l`, `sort`, `uniq`) in process.
4. Enforce the output caps and the timeout of C002-IF-002 §4.

## Verification

- `npm test -- integration/mcp` and `npm test -- tests/guards`

## Done when

- [ ] No code path of the server starts a shell (C002-CON-07), checked by a test that stubs `child_process` options
- [ ] Progress reported: `sdd task set C002-T-019 --status done --commit <sha>`
