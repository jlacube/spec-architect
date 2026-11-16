# Revision digest — defects D-010 … D-014 (CHG-002)

Working list for the batched spec/plan revision of 2026-10-19 (gate record 10-spec revise). Source:
the defects in `change.md` and the task report notes of C002-T-026 … T-058. Each item names the owner
specialist (SW spec-writer, AR architect, TD test-designer, PL planner). Implementation already done
is stated; the spec must follow the code unless marked "decide".

## P-01 decision

- **D-012 / C002-REQ-510, C002-TS-516** — P-01 (AskUserQuestion, 2026-10-19): **"ok + caveat
  (Recommended)"**: the Copilot doctor hooks row is `ok` when `chat.useHooks` is on; its text says
  Workspace Trust and organisation policy were not read; the manual VS Code checklist (C002-T-050)
  confirms them. `disabled (<source>)` / unknown stay `error`. (SW REQ-510; AR IF-006 doctor row; TD
  TS-516 rows; PL T-038 follow-up code change, T-046 checklist items.)

## D-010 (C002-IF-001 and others)

1. AR — OpenCode mapping needs the `task` tool in `agent_start` (closed tool map `"*": false` otherwise
   switches it off; IF-001 §2 does not list it). Already in the table (T-026).
2. AR — option-parser faults of `sdd hook guard` (missing `--mode` value, unknown option, extra
   argument) print "tool call": that path cannot read the input. Accept as the fault text.
3. TD — C002-TS-502 assumes the new change is 002 though fx-bootstrap already holds 002.
4. AR — three wiring anchors used by the code but not in IF-001: gate-protocol wiring line, doctor
   task-tools block, doctor probe/report blocks. Frontmatter mentions of Claude (doctor description,
   conductor description "claude --agent") are not covered by body variants — decide: description
   variants per target, or accepted.
5. AR — guard header comment says `serena-launch` needs `--read-only`; code and BG-381 allow it
   without. Spec text (IF-008 §1.1) must say which; code follows BG-381 (allowed without).
6. AR/PL — install-notes path: IF-005 §5 / target-packages.md §5 say `targets/<t>/wiring/install-notes.md`;
   the code uses `targets/<t>/install.md` → package-root `INSTALL.md`. Follow the code. The README link
   (C002-T-039) does not resolve inside the Claude Code package (targets/ excluded) — state that the
   README link is for the repository copy.

## D-011 (C002-TS-226 and others)

1. TD — TS-226 assumes OpenCode built-in commands `/new` and `/init` clash; OpenCode 1.18.31 built-ins
   are init, review, customize-opencode (no `new`).
2. AR — IF-009 §2.2 has no mapping for shell-corpus cases whose tool is not a shell (BG-268…270);
   implemented as the command fed as that tool's argument (BG-268 Write → deny on every mechanism).
   Decide the expectation (see D-014).
3. AR — OpenCode tries to download ripgrep from GitHub at start: add to IF-010 §4 start-up conditions.

## D-012 (C002-REQ-510, doctor)

- P-01 decision above.
- TD — TS-509 (Claude Code, no sdd) expects "completed", but on Claude Code the Context7 and DeepWiki
  rows are always `unreachable` (neither conductor nor cartographer holds their tools) → "completed
  with warnings".
- TD — TS-509 (OpenCode, no sdd) and TS-515 assume a PATH `sdd`; under `sdd-mcp-server` the command
  tool runs the server's own CLI. Cases now use native-permissions mode.
- AR — new wiring token `{{host_version_arg}}` (opencode | vscode-insiders | vscode) missing from
  IF-001 §4 token table.
- AR — the `.cmd`-shim rule is printed in every mode (variants cannot vary by mode).

## D-013 (C002-IF-005 and others)

1. AR — `copilot.json` `plugin-root` detector excludes `/scripts/sdd.mjs` and `cli-invocation` matches
   only the `CLAUDE_` form, so `${PLUGIN_ROOT}/scripts/sdd.mjs` escapes the table detectors and the
   generator (TGT-PORT-001 checks both root tokens directly). Fix the table detectors in spec.
2. PL — TGT-AGENT-001, TGT-MODE-001, TGT-MEM-001, TGT-SERENA-001 have no owning task (done in
   C002-T-035); TGT-NPM-001 done in C002-T-023 (tarball check, `npm run check` step "tarball").
3. AR — IF-005 says "the 14 existing checks are unchanged"; there were 15 (PLG-VER-001), now 16
   (PLG-VAR-001).
4. PL/TD — TC-121 location (test plan: package-staging.test.ts; code: cap06/structure-checks.test.ts).
5. AR/TD — TS-606 does not define which host tool sets contain generic tools (code assumes edit,
   execute, new, runCommands, runTasks, vscode).
6. TD/PL — no TC row for C002-NFR-301 (determinism, `tests/integration/cap01/determinism.test.ts`) or
   C002-NFR-103 (generate bench `bench/generate.mjs`, p95 777 ms). SW — NFR-103 "excludes build"
   wording vs ADR-003 (generator's own bundling counts): say `scripts/build.mjs` is excluded.
7. SW/AR — under the Claude desktop app (MSIX package) writes under `%LOCALAPPDATA%` are redirected to
   `%LOCALAPPDATA%\Packages\<pkg>\LocalCache\Local\…`, so a `--user-data` folder written from a session
   started by Claude desktop is not the one OpenCode/Copilot started outside the package see. Record as
   a known platform condition (REQ-515/516 rationale, install notes, doctor remedy?) — no code change.
8. AR — `sdd install copilot` (C002-T-058) details: ERR-CLI-021 reason for a `.vscode/mcp.json` whose
   top level or `servers` is not an object; agent list taken from the manifest's `files`; extra
   ERR-CLI-022 reasons (folder missing, no package_version, no agent file listed, install/mcp.json no
   servers/unparsable, hooks template unparsable/no PreToolUse); `scripts/sdd.mjs` is not a required
   source file (hooks then fail closed) — decide: make it required (safer); ERR-CLI-017 already-written
   list inside `<file>`; output line for a new `.vscode/mcp.json` is `written`.
9. AR — tarball check: SPDX scan has no finding code (code uses C002-NFR-801); DoD-020 scan of
   `dist/opencode`, `dist/copilot` only with `--spdx` flags.
10. PL — T-023 runs: each smoke run covers both shells, so the four shell × Node combinations are two
    runs (one per Node version).

## D-014 (C002-IF-009, replay)

Replay on REF-WIN (C002-T-041): `sdd-mcp-server` 665 replayed / 26 n/a / 10 differing (both targets);
`copilot-hooks` 665 / 26 / 1. Expectations need per-mechanism entries (IF-009 §2.1) or mappings:

1. BG-268 (shell corpus, tool Write, `rm -rf src`, expected allow): no §2.2 row; fed as a write path →
   deny on every mechanism (OpenCode too).
2. PG-135 (cwd through a junction `{repolink}`): §2.2 runs the server at `{repo}` with the absolute
   path as given → deny (Copilot hooks carry the case cwd and pass).
3. PG-048 (trailing separator): guard allows, write fails ERR-MCP-003, §2.3 counts ERR-MCP-003 as
   `error`; ERR-MCP-003 only follows an allow — count as allow like ERR-MCP-004…006?
4. BG-374, 379, 384, 389, 402, 403, 404 (`${CLAUDE_PLUGIN_DATA}` literal): `run_command` runs without a
   shell, so the server's guard call no longer expands the literal and denies it (code fix 5b4392b,
   `decideBash(..., { expands: false })`; before, the CLI created a folder named `${CLAUDE_PLUGIN_DATA}`
   in the repository). Corpus expects allow (shell semantics) → expectation per mechanism: deny for
   `sdd-mcp-server`. Spec text of sdd-mcp-server.md §5 / IF-008 §1.1 should say the literal is not
   expanded by the server.
5. Copilot hook tool names: Read/Glob/Grep fed as `Glob`, Edit/NotebookEdit as `Write` (S-08 does not
   record the read tool's hook name).

After the revision C002-T-041 must reach "0 differing" against the revised expectations.
