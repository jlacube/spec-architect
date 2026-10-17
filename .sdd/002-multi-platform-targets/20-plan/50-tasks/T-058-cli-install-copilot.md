---
id: C002-T-058
title: "CLI: Copilot install command (sdd install copilot)"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-005, C002-T-009, C002-T-031, C002-T-033]
implements: [C002-REQ-322, C002-REQ-323, C002-REQ-324, C002-REQ-326]
satisfies_ac: [C002-AC-322.1, C002-AC-323.1, C002-AC-324.1, C002-AC-326.1]
verified_by: [C002-TS-341, C002-TS-342, C002-TS-343, C002-TS-344, C002-TS-345, C002-TS-346, C002-TS-347, C002-TS-348, C002-TS-349, C002-TS-350, C002-TS-354, C002-TS-356, C002-TC-341, C002-TC-342, C002-TC-343, C002-TC-344, C002-TC-345, C002-TC-346, C002-TC-347, C002-TC-348, C002-TC-349, C002-TC-350, C002-TC-354, C002-TC-356]
components: [C002-COMP-018, C002-COMP-004]
risk_refs: [C002-RISK-003, C002-RISK-030]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-058 — CLI: Copilot install command (sdd install copilot)

## Intent

Add `sdd install copilot [--package <dir>]` as C002-IF-007 §Install defines it. P-03 runs it in a
repository; it writes the ten workspace agents to `.github/agents/` (C002-REQ-322), merges the
package's server entries into `.vscode/mcp.json` and keeps every other entry (C002-REQ-323), writes
the package's `hooks.json` from `install/hooks.template.json` with the absolute CLI-copy path in place
of `@CLI_COPY@` (C002-REQ-326), and writes the install record `.github/architect-install.json`. It
refuses before any write when an adopter file or server is in the way (C002-REQ-324, ERR-CLI-021) or
the package cannot be used (ERR-CLI-022).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/cli/install-copilot.ts` | steps 1 … 6 of C002-IF-007 §Install: package resolution (`--package`, else the package that holds the running `scripts/sdd.mjs`), install record, recognition by SHA-256, conflict checks, writes, output lines |
| modify | `src/cli/commands.ts` | one `COMMANDS` row `install` (target `copilot`; any other target ERR-CLI-003), with `sampleArgs` on a fixture package; its "writes" property from the writing-command table of C002-T-009 |
| modify | `src/cli/errors.ts` | ERR-CLI-021, ERR-CLI-022 (C002-IF-007 errors table) |
| modify | `tests/guards/writing-commands.test.ts` | remove the exemption that C002-T-009 gives the `install copilot` row: the row must now name a `COMMANDS` row |
| add | `tests/integration/cap03/install.test.ts` | the listed scenarios on `fx-cp-install` with `pkg-cp` copies (test plan §2) |
| modify | `tests/integration/cap03/hook-adapter.test.ts` | run the hook-adapter cases of C002-T-032 a second time through the installed form: the command of the entry in `<folder>/hooks.json` written by this command (CAP-03 acceptance, fixtures) |

## Preconditions

- C002-T-005 (repository-root rule of C002-IF-008 §1.1 rule 3), C002-T-009 (writing-command table,
  `install copilot` row), C002-T-031 (agents, `install/mcp.json`, `architect-target.json`) and
  C002-T-033 (`install/hooks.template.json`) done.
- C002-T-059 done through C002-T-033's chain (C002-T-032 depends on it), so no Architect agent can run
  the command while it is being built.

## Step outline (no production code)

1. Write the scenario tests first, with the package copied to `C:/fx/pkg-cp` (or a temporary folder
   whose absolute path the tests substitute) and `fx-cp-install` as a fresh git repository per test.
2. Resolve and check the package before reading the repository: manifest target, the source files of
   C002-IF-005 §3, and the characters `"`, `$`, `%`, backtick and control characters in its absolute
   path (ERR-CLI-022; C002-TS-345, C002-TS-356). Nothing is written on a refusal.
3. Read the install record (a record that does not parse counts as absent), then check every target
   before the first write: agent files, `.vscode/mcp.json` as strict JSON (comments and trailing
   commas are conflicts), the `servers` object, and each package server name. A file or entry equal to
   the package's is not a conflict (C002-TS-348); a file or entry edited after an install is the
   adopter's (C002-TS-350). Print one ERR-CLI-021 line per conflict and exit 2.
4. Write through a temporary file and a rename (`src/io/atomic.ts`): the ten agent files, then
   `.vscode/mcp.json` (added or replaced package entries, every other key and entry in place, new
   entries appended in code-point order, two-space indentation, LF, final newline), then
   `<package>/hooks.json`, then the install record. A failed write ends with ERR-CLI-017 (exit 3)
   naming the files already written; a second run completes the install.
5. Print `written`, `unchanged` or `merged` per target, then the `next:` line (C002-TS-341,
   C002-TS-343, C002-TS-346).
6. Read nothing else in the repository and create no `.sdd/` (C002-TS-341: no other file added or
   changed).

## Verification

- `npm test -- cap03/install`, `npm test -- cap03/hook-adapter`, `npm test -- integration/cli` and
  `npm test -- tests/guards`

## Done when

- [ ] The listed scenarios pass; every refusal leaves `.github/`, `.vscode/` and `<package>/hooks.json`
      as they were
- [ ] The hook-adapter cases pass in their installed form
- [ ] Progress reported: `sdd task set C002-T-058 --status done --commit <sha>`
