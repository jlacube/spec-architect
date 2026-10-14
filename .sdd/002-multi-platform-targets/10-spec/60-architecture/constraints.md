---
id: C002-SPEC-CONSTRAINTS
artifact: spec/constraints
change: CHG-002
phase: 10-spec
status: draft
---

# C002 — Architecture constraints

Scope constraints C002-CON-01 … C002-CON-05 are defined in `../10-context/scope.md` §4; CHG-001's
constraints (C001-CON-01 … C001-CON-16) apply unchanged except as C002-CON-12 and C002-CON-13 state
after the review that scope.md §4 asks for. The constraints below bind the architecture.

| ID | Constraint | Source | Affects |
|---|---|---|---|
| C002-CON-06 | The path and bash guard cores are the only decision point for the write/shell boundary of the sdd MCP server, of the Copilot hooks fallback and of the Claude Code hooks; no mechanism re-implements their rules (the Serena-command confinement of C002-IF-008 §1.1 and the `--cwd` confinement of §1.2 included), and the OpenCode permission rules are generated from the same allowlist with no `allow` rule wider than the forms the generated agents send need; a guard rule that a glob cannot follow is a replay difference (C002-IF-001 §6.3) | C002-DEC-001; C002-DEC-005 | C002-COMP-001, C002-COMP-002, C002-COMP-005, C002-COMP-012 |
| C002-CON-07 | The sdd MCP server runs commands without a shell: it executes the words the bash guard core tokenised, applies the pipe-only entries in-process and does not run `.cmd` or `.bat` files | C002-NFR-202; C002-NFR-204 | C002-COMP-005 |
| C002-CON-08 | Every fault in the sdd MCP server or in an agent-scoped guard hook ends in a refusal: an error result that changed nothing, or exit code 2; no error path allows a call | C002-NFR-204; C002-DEC-005 | C002-COMP-005, C002-COMP-012 |
| C002-CON-09 | Generation is deterministic: sorted traversal, LF line endings, UTF-8 without BOM, stable JSON key order, and no time stamp or machine path in any generated file | C002-NFR-301 | C002-COMP-001 |
| C002-CON-10 | Mapping tables and wiring variants live in `plugins/architect/targets/`; no Claude Code agent preloads them, and the Claude Code staging of `npm run package` leaves the folder out | C002-DEC-006; C002-GOAL-05 | C002-COMP-002, C002-COMP-013, C002-COMP-016 |
| C002-CON-11 | `architect-sdd` has no runtime dependency and no install script; its two entries bundle every package they import except Node.js built-ins | C002-NFR-402; constitution, forbidden technologies | C002-COMP-006, C002-COMP-013 |
| C002-CON-12 | Review of C001-CON-02 (one bundled file): the plugin keeps exactly one bundled file, `scripts/sdd.mjs`; `architect-sdd` carries two bundled entries (`sdd`, `sdd-mcp`); the Copilot target package carries a byte copy of the plugin's bundle for its hook commands. C001-CON-02 stays in force for the plugin | C002-DEC-001 (Constitution check); C002-DEC-007 | C002-COMP-004, C002-COMP-006, C002-COMP-013, C002-COMP-017 |
| C002-CON-13 | Review of C001-CON-03 (distribution as a Claude Code plugin): Claude Code stays the source target, distributed as today; the generated target packages and `architect-sdd` are additional distributions written by the same `npm run package` | C002-DEC-006; C002-DEC-007 | C002-COMP-003, C002-COMP-004, C002-COMP-006, C002-COMP-013 |
| C002-CON-14 | Copilot hook commands call the CLI copy inside the Copilot target package (`node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" …`), never a PATH lookup, so that a missing Node.js is the only start failure left to a guard hook | C002-NFR-204; C002-DEC-005 | C002-COMP-004, C002-COMP-012 |
| C002-CON-15 | One sdd MCP server process serves one repository, fixed at initialisation; writes to any other `.sdd/` folder, including those of the other folders of a multi-root VS Code workspace, are refused | C002-DEC-001; C001-CON-11 | C002-COMP-005 |
| C002-CON-16 | One version per packaging run: the source plugin version is the version of both target packages and of `architect-sdd` | C002-DEC-007; C002-NFR-501 | C002-COMP-001, C002-COMP-006, C002-COMP-013 |
