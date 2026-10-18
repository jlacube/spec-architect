---
id: C002-T-017
title: "sdd MCP server: write_file and replace_text"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-03
status: done
depends_on: [C002-T-011, C002-T-016]
implements: [C002-REQ-401, C002-REQ-402, C002-REQ-403, C002-REQ-404]
satisfies_ac: [C002-AC-401.1, C002-AC-402.1, C002-AC-403.1, C002-AC-404.1]
verified_by: [C002-TS-401, C002-TS-402, C002-TS-403, C002-TS-404, C002-TS-405, C002-TC-401, C002-TC-402, C002-TC-403, C002-TC-404, C002-TC-405]
components: [C002-COMP-005, C002-COMP-012]
risk_refs: []
estimate: M
report: { commit: 7e47b35, completed_at: 2026-10-18, notes: "write_file/replace_text; TS-401 (7 rows), 402, 403, 404, 405 pass; TC-401 tarball run waits for T-022; writes return findings_unavailable (WARN-MCP-001) until T-018; new src/mcp/results.ts" }
---

# C002-T-017 — sdd MCP server: write_file and replace_text

## Intent

Implement the two write tools of the `files` profile (C002-REQ-403). Each call is decided by the path
guard core for an Architect agent with the memory folder off (C002-REQ-401). The file is written
atomically or left unchanged (C002-REQ-402), and an ambiguous span is refused with its count
(C002-REQ-404).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/mcp/tools/files.ts` | argument validation (ERR-MCP-001), guard decision, temporary file then rename, error results (ERR-MCP-003) |
| add | `tests/integration/mcp/files.test.ts` | the `fx-srv` fixture of the CAP-04 acceptance file; the outlines of C002-TS-401 … C002-TS-405 |

## Preconditions

- C002-T-011 (memory option) and C002-T-016 (server) done.

## Step outline (no production code)

1. Validate arguments against the tool schema. Fail before any guard or I/O call.
2. Call `decidePath` with the session root as `cwd` and the memory folder off. A deny gives
   GUARD-PATH-001 and the file stays untouched.
3. Write to a temporary file in the target folder, then rename. On an I/O error, remove the temporary
   file and return the error result. The previous content stays.
4. `replace_text`: count the occurrences. Anything other than one is refused with the count.

## Verification

- `npm test -- integration/mcp`

## Done when

- [ ] Every row of the C002-TS-401 and C002-TS-402 outlines passes
- [ ] Progress reported: `sdd task set C002-T-017 --status done --commit <sha>`
