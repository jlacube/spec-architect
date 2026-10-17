---
id: C002-T-014
title: "CLI: host-version command"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: [C002-T-006]
implements: [C002-REQ-508]
satisfies_ac: [C002-AC-508.1]
verified_by: [C002-TS-513, C002-TS-514, C002-TC-513, C002-TC-514]
components: [C002-COMP-018]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-014 — CLI: host-version command

## Intent

The doctor on a generated target reads host versions through `sdd host-version`, without widening the
allowlist (architecture §6.2; C002-IF-007). This task adds the CLI side. The doctor rows that compare
the versions with the tested versions are C002-T-038.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/cli/host-version.ts` | `host-version opencode`, `host-version vscode` and `host-version vscode-insiders` (VS Code or VS Code Insiders through `code-insiders`, and the Copilot Chat version) as C002-IF-007 defines them; fixed command lines only |
| modify | `src/cli/commands.ts` | one `COMMANDS` row, with `sampleArgs` that do not call a real host |
| add | `tests/integration/cli/host-version.test.ts` | fake `opencode`, `code` and `code-insiders` shims under `tests/fixtures/cfg-*/bin`, missing host, `.cmd` shim on Windows |

## Preconditions

- C002-T-006 done.

## Step outline (no production code)

1. Run the host's version command with a fixed argument list. The platform shell may be used only for
   fixed command lines (architecture §6.1 Portability).
2. Print the parsed versions in the shape of C002-IF-007, or the "not found" outcome with its exit code.

## Verification

- `npm test -- integration/cli`

## Done when

- [ ] Shim tests pass on PowerShell 7 and Git Bash
- [ ] Progress reported: `sdd task set C002-T-014 --status done --commit <sha>`
