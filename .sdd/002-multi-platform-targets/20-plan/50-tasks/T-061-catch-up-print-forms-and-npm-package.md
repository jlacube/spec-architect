---
id: C002-T-061
title: "Catch-up for revision D-004 … D-009: build and server print forms, ERR-MCP-006 cases, npm README and own templates"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-03
status: todo
depends_on: [C002-T-016, C002-T-019, C002-T-021, C002-T-022]
implements: [C002-REQ-406, C002-REQ-407, C002-REQ-413, C002-REQ-415, C002-REQ-501, C002-REQ-513]
satisfies_ac: [C002-AC-406.1, C002-AC-407.1, C002-AC-413.1, C002-AC-415.1, C002-AC-501.1, C002-AC-513.1]
verified_by: [C002-TS-418, C002-TS-422, C002-TS-423, C002-TS-424, C002-TS-502, C002-TS-538, C002-TC-418, C002-TC-422, C002-TC-423, C002-TC-424, C002-TC-502, C002-TC-538]
components: [C002-COMP-005, C002-COMP-006, C002-COMP-013, C002-COMP-018]
risk_refs: [C002-RISK-007]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-061 — Catch-up for revision D-004 … D-009: build and server print forms, ERR-MCP-006 cases, npm README and own templates

## Intent

The spec revision for defects D-004 … D-009 changed interfaces that done tasks already implemented
(C002-T-016, C002-T-019, C002-T-021, C002-T-022). Done tasks are not reopened, so this task brings
their code and tests to the revised contracts. It covers the print form `<code>: <message>` of
ERR-BLD-001 and of ERR-MCP-007 after the `sdd-mcp: ` prefix (`../../10-spec/50-interfaces/errors.md`
"Print form", §2, §4; C002-IF-002 §1). It adds the ERR-MCP-006 cases `not found beside the server`
and literal variables, the repository URL in the npm README (C002-IF-003 §1), and the template
lookup of the npm `sdd` in a Claude Code session (C002-IF-003 §1, defect D-004).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `scripts/licenses.mjs` › ERR-BLD-001 message builder | each line starts with `ERR-BLD-001: `, followed by the Message text of errors.md §4 unchanged |
| modify | `src/mcp/server.ts` › usage-error output | the line `sdd-mcp: ERR-MCP-007: <message>`, the message being the errors.md §2 text (`usage: … [--root <dir>]: <detail>`); today the colon after the code is missing |
| modify | `scripts/package.mjs` › npm README text | names the repository URL `https://github.com/jlacube/spec-architect`, whose README is the full guide (C002-IF-003 §1 tree) |
| modify | `tests/integration/bundles/notices-union.test.ts` | C002-TC-418 reads the code and message from the line, as C002-TS-418 now states |
| modify | `tests/integration/mcp/protocol.test.ts` | C002-TC-422 checks the start of the standard-error line |
| modify | `tests/integration/mcp/shell.test.ts` | adds C002-TC-423 (own CLI deleted beside the server) and C002-TC-424 (`${CLAUDE_PLUGIN_ROOT}` reaches `node` as literal text) |
| modify | `tests/integration/npm-build/npm-staging.test.ts` | C002-TC-502 compares the two change folders as the revised C002-TS-502 states (same file list; equal lines except the translated CLI lines of `20-plan/handoff.md`); a unit assertion on the README URL |
| modify | `tests/integration/cli/template.test.ts` | adds C002-TC-538 against the installed tarball (fx-tgz), with `CLAUDE_PLUGIN_ROOT` set to a fixture plugin root |

## Preconditions

- C002-T-016, C002-T-019, C002-T-021 and C002-T-022 done.
- The CLI catalogue mirror of ERR-CLI-019 and ERR-CLI-020 already follows the revised errors.md §5
  (conductor commit 6bb6135); this task does not touch `src/cli/errors.ts`.
- PLG-VER-001 (errors.md §7, defect D-005) is already implemented by C002-T-004 and needs no work here.

## Step outline (no production code)

1. Write or adjust the six test cases first, and watch C002-TC-418, C002-TC-422 and C002-TC-502 fail
   on the current code.
2. Prefix the ERR-BLD-001 line with its code. The ERR-BLD-002 lines of
   `scripts/template-cli-lines.mjs` already start with their code; leave them unchanged.
3. Put the colon after `ERR-MCP-007` in the server's usage line. The exit code 2 and the empty standard
   output stay as they are (C002-IF-002 §1).
4. Check the ERR-MCP-006 reasons of `src/mcp/tools/shell.ts` against errors.md §2: `not found on PATH`,
   `only a .cmd or .bat shim was found`, `not found beside the server (<path>)` with the absolute
   path, and the operating system's error text. The reasons are already in the code. C002-TC-423 and
   C002-TC-424 prove them, and code changes only where a test shows a different text.
5. Add the repository URL line to the npm README.
6. Run C002-TC-538. The lookup order (the templates beside the bundle first, `CLAUDE_PLUGIN_ROOT`
   only when that folder is absent) is already in `src/workspace/templates.ts`. Change it only if the
   test fails, and then report what changed.
7. Re-pack and re-run the staging tests, so that C002-T-023 smoke-tests the final tarball.

## Verification

- `npm test -- bundles/notices-union`, `npm test -- mcp/protocol`, `npm test -- mcp/shell`
- `npm test -- npm-build/npm-staging`, `npm test -- cli/template`
- `npm run check`

## Done when

- [ ] C002-TC-418, 422, 423, 424, 502 and 538 pass; no other test of `tests/integration/mcp/` or `tests/integration/build/` changes its expectation
- [ ] The task report lists which of the ERR-MCP-006 reasons and the template lookup needed no code change
- [ ] Progress reported: `sdd task set C002-T-061 --status done --commit <sha>`
