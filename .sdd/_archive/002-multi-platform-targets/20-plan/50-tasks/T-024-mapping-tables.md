---
id: C002-T-024
title: "Mapping tables, their schema copy and loader"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: done
depends_on: [C002-T-001, C002-T-002, C002-T-006, C002-T-015]
implements: []
satisfies_ac: [C002-AC-103.1, C002-AC-105.1]
verified_by: [C002-TS-106, C002-TS-109, C002-TS-110, C002-TC-106, C002-TC-109, C002-TC-110]
components: [C002-COMP-002]
risk_refs: []
estimate: M
report: { commit: 141b0fe, completed_at: 2026-10-18, notes: "Mapping tables for OpenCode and Copilot in plugins/architect/targets/; both sdd-mcp-server (OpenCode provisional until T-043); Serena ide (OpenCode) / vscode (Copilot, from Serena 1.7.0 contexts — T-050 confirms); Copilot model ids added from P-01's /model list (S-08 addendum); Copilot tools todo/usages and read/edit hook names from the spec, not S-08; plugin_manifest install/plugin.json per IF-005; variants empty until T-028; TC-106/109/110 carried to T-026/T-027" }
---

# C002-T-024 — Mapping tables, their schema copy and loader

## Intent

Create `plugins/architect/targets/` with the one in-repository copy of `mapping-table.schema.json`
(C002-ADR-002) and the two tables `opencode.json` and `copilot.json` (C002-IF-001). Their values come
from the spike records: enforcement mode, tested versions, model identifier per tier, tool grants, MCP
servers with the Serena entry, construct detectors, and `effort` and `color` handling. The loader
validates the tables with Ajv and is shared by the generator, the structure checks and the release
check.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/targets/mapping-table.schema.json` | copy of the spec contract; its pair is added to the C002-T-006 equality test |
| add | `plugins/architect/targets/opencode.json`, `plugins/architect/targets/copilot.json` | tables per C002-IF-001, values cited from `docs/spikes/S-07-opencode.md` and `docs/spikes/S-08-copilot-vscode.md` |
| add | `scripts/generate/tables.ts` | load, validate (Ajv 2020-12, `date` format registered), messages from `instancePath` and `message` |
| add | `tests/integration/cap01/tables.test.ts` | both tables valid; a broken table fails with the path of the error |

## Preconditions

- C002-T-001 and C002-T-002 done (records signed off); C002-T-006 (equality test); C002-T-015
  (staging filter in place).

## Step outline (no production code)

1. Copy the schema and register the pair in the equality test.
2. Fill each table from its spike record. A value that the record does not give is a defect against
   the record, not a guess.
3. Copilot table from the signed-off S-08 record (`enforcement_mode: sdd-mcp-server`; `10-strategy.md`
   §4) and C002-IF-001 as revised for defect D-003: `tested_versions.vscode` from `vscode-insiders`
   (`1.142.0-insider`) and `copilot-chat` `0.35.3` from the record, which P-01 confirmed as the
   Copilot Chat of the tested Insiders build (Q-versions-02, `questions-log.md` round 7; assumption
   of C002-IF-009 §3 settled);
   `mcp_tool_names` `{server}-{tool}` with `grant_pattern` `{server}/{tool}`, `grant` per-server and
   `deferred` true; `placement` with `plugin_manifest` `plugin.json`, `config_file`
   `install/mcp.json`, `hooks_file` `install/hooks.template.json` and `cli_copy` `scripts/sdd.mjs`;
   `ask_user` as the question tool; `plugin-root` (`${CLAUDE_PLUGIN_ROOT}` and `${PLUGIN_ROOT}`)
   accepted in no context; `sdd-files` and `sdd-shell` declared in both Copilot modes; terminal
   dialect `powershell` and `cmd_shims` empty; `hook_tool_classes` for both modes (C002-REQ-318).
4. **Serena `--context` for Copilot VS Code** (not in the S-08 record; C002-IF-001 §6.2; P-01's
   answer to Q-serena-ctx-01: decided in this task, `questions-log.md` round 7): list the contexts
   that the tested Serena version (1.7.x on E-SER) ships, with the Serena context-list command or its
   `contexts/` folder; take the context that Serena provides for VS Code or a generic IDE agent; when
   none of that kind exists, take the context the OpenCode table uses. Write it into the Copilot
   table and record in the task report the Serena version, the listed contexts and the reason for the
   choice. C002-T-050 confirms that Serena starts with it (C002-T-046 assumption step); a Serena that
   does not start is a defect against this table value, not a spec defect.
5. Check that PLG-PATH-001 passes: no machine path in any table.

## Verification

- `npm test -- cap01` and `npm test -- contracts`
- `npm run check`

## Done when

- [ ] Both tables validate; every value traces to a spike record line, except the Copilot Serena
      context, which traces to the step 4 record in the task report
- [ ] Fixture tables fx-tables written; C002-TC-106, 109 and 110 (translator tests that read them) listed in the task report as carried to C002-T-026 and C002-T-027
- [ ] Progress reported: `sdd task set C002-T-024 --status done --commit <sha>`
