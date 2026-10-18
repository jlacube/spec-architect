---
id: C002-T-031
title: "Copilot emitter: plugin part, agents, prompt files, skills, workspace MCP configuration and install notes"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-021, C002-T-026, C002-T-028]
implements: [C002-REQ-114, C002-REQ-301, C002-REQ-303, C002-REQ-304, C002-REQ-306, C002-REQ-307, C002-REQ-317, C002-REQ-321]
satisfies_ac: [C002-AC-114.1, C002-AC-301.1, C002-AC-303.1, C002-AC-304.1, C002-AC-306.1, C002-AC-307.1, C002-AC-317.1, C002-AC-321.1]
verified_by: [C002-TS-301, C002-TS-302, C002-TS-305, C002-TS-306, C002-TS-308, C002-TS-309, C002-TS-310, C002-TS-327, C002-TS-328, C002-TS-329, C002-TS-339, C002-TC-301, C002-TC-302, C002-TC-305, C002-TC-306, C002-TC-308, C002-TC-309, C002-TC-310, C002-TC-327, C002-TC-328, C002-TC-329, C002-TC-339]
components: [C002-COMP-001, C002-COMP-004]
risk_refs: [C002-RISK-031, C002-RISK-033]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-031 — Copilot emitter: plugin part, agents, prompt files, skills, workspace MCP configuration and install notes

## Intent

Write `dist/copilot/` as C002-IF-005 §3 (revised for defect D-003 and after the critic's D-003
review) defines it (C002-REQ-301): the plugin part (`agents/<agent name>.agent.md`,
`prompts/<name>.prompt.md` bound to the conductor, skills in the Agent Skills format) and the install
sources that the install command of C002-T-058 writes: `install/plugin.json` (the manifest named
`architect`, copied to the package root by the install), `install/mcp.json` in the VS Code `servers`
form. The package also holds the byte copy `scripts/sdd.mjs`, `architect-target.json` and
`INSTALL.md` (C002-REQ-304), and no `.mcp.json`, no `hooks.json` and no `plugin.json` at its root
(C002-REQ-307): until the install the folder is no plugin, so no Architect agent or prompt file runs
before its guard hook exists (C002-IF-005 §3). Every agent has a `tools` list; under server mode none
grants a generic edit or terminal tool (C002-REQ-306), and under the hooks fallback the conductor and
every prompt file still hold the server profiles instead (C002-REQ-321).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/generate/emit/copilot.ts` | layout of C002-IF-005 §3 (`placement.plugin_manifest` written as `install/plugin.json`, `config_file` = `install/mcp.json`, `cli_copy`); agent frontmatter (`name` = file name, `tools` always present, `agents` of the conductor by bare name, `user-invocable: false` on the nine specialists, `ask_user` and the todo tool on the conductor); prompt-file frontmatter (`agent: sdd-conductor`, `tools`); skills; `install/mcp.json` with `servers` entries in sorted key order (`type: stdio` for the local servers); CLI copy; install notes |
| add | `plugins/architect/targets/copilot/install.md` | install-notes source in the order of C002-IF-005 §5: unpack outside the repository; `sdd install copilot --package <folder>` in P-03's own terminal, again per repository and after a move or update, with the files it writes (`.github/agents/`, `.github/hooks/architect-guard.json`, `.github/architect-install.json`, `.vscode/mcp.json`) kept together, all in version control or none, and the fail-closed clone without the package path (C002-REQ-322); the three VS Code settings after the install step, and the window reload after a later install; the Local session type with `sdd-conductor` selected; workspace MCP servers start after the first message; in a repository with `.sdd/`, while hooks are enabled, non-Architect subagents (host built-in agents, the adopter's own) call only read-only tools (item 6 of C002-IF-005 §5; C002-REQ-304, C002-REQ-327) |
| add | `tests/integration/cap03/package.test.ts` | the listed structure scenarios on the generated package, both modes |

## Preconditions

- C002-T-021 (plugin bundle), C002-T-026 and C002-T-028 done; the Copilot table of C002-T-024 holds
  the signed-off S-08 values (`enforcement_mode: sdd-mcp-server`).

## Step outline (no production code)

1. Emit from the translated model with the Copilot table. MCP tool names in bodies are already in the
   `<server>-<tool>` call form (C002-T-027); `tools` lists use the grant form `<server>/*`.
2. Under `copilot-hooks`, give the nine specialists the table's generic edit and terminal tools and
   give the conductor and every prompt file the `sdd-mcp-server` mapping of Write, Edit and Bash
   (C002-IF-001 §5; C002-REQ-321). `sdd-files` and `sdd-shell` stay in `install/mcp.json` in both modes.
3. Copy `plugins/architect/scripts/sdd.mjs` byte for byte (C002-ADR-004).
4. Hooks and the tool classes file are C002-T-033; this task writes no hook declaration.
5. Write the manifest only as `install/plugin.json`, never at the package root (C002-TS-301: no
   `.mcp.json`, `hooks.json` or `plugin.json` at the root).
6. Keep the agent files under `agents/`. The fallback location `install/agents/` of C002-IF-005 §3
   is used only if the fresh-install step of the checklist (C002-T-050) refutes the same-name
   assumption or the assumption that VS Code loads nothing from a registered folder without
   `plugin.json`; that is a plan change, not a choice of this task.

## Verification

- `npm test -- cap03/package` and `npm run generate -- --target copilot --out <tmp>`

## Done when

- [ ] The listed structure scenarios pass in both modes
- [ ] Carried cases listed in the task report: C002-TC-309 and C002-TC-329 (manual) to C002-T-050;
      C002-TC-306 timing to C002-T-057; the TGT-GRANT-001 clause of C002-TC-339 to C002-T-035; the
      `install/hooks.template.json` clauses and rows of C002-TC-301 and C002-TC-302 to C002-T-033;
      C002-TC-125 and C002-TC-126 to C002-T-029 and C002-T-035 (ownership move of critic CR-5, test plan)
- [ ] Progress reported: `sdd task set C002-T-031 --status done --commit <sha>`
