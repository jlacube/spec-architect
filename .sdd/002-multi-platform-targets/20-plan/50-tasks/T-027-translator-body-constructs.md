---
id: C002-T-027
title: "Translator: body constructs, templates, plugin data and question tool"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-025]
implements: [C002-REQ-103, C002-REQ-104, C002-REQ-115, C002-REQ-116, C002-REQ-118]
satisfies_ac: [C002-AC-103.1, C002-AC-104.1, C002-AC-115.1, C002-AC-116.1, C002-AC-118.1]
verified_by: [C002-TS-106, C002-TS-107, C002-TS-108, C002-TS-127, C002-TS-128, C002-TS-131, C002-TS-132, C002-TS-134, C002-TC-106, C002-TC-107, C002-TC-108, C002-TC-127, C002-TC-128, C002-TC-131, C002-TC-132, C002-TC-134]
components: [C002-COMP-001]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-027 — Translator: body constructs, templates, plugin data and question tool

## Intent

Replace each Claude Code construct in agent, command and skill bodies with the target's table entry
(C002-REQ-103). Stop on any construct that has no entry, naming the file, line, construct and target
(C002-REQ-104). The three body constructs that the CLI side serves are template paths, which become
`sdd template show` (C002-REQ-115); `${CLAUDE_PLUGIN_DATA}` arguments, which become `--user-data`
(C002-REQ-116); and AskUserQuestion, which becomes the host question tool (C002-REQ-118).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/generate/translate/constructs.ts` | detectors from the table; replacement; MCP tool-name forms from `mcp_tool_names` (bodies: `<server>_<tool>` on OpenCode, `<server>-<tool>` on Copilot; Copilot `tools` lists take `grant_pattern` or `<server>/*`, C002-IF-001 §5, S-08 fact F-7), the same form in every agent body that inlines the skill (C002-TS-134); AskUserQuestion → `ask_user` and ToolSearch → `tool_search_tool` on Copilot; unmapped construct → ERR-GEN with file, line, construct, target |
| add | `tests/integration/cap01/constructs.test.ts` | the listed integration scenarios; a planted unmapped construct stops generation with no package written |
| add | `evals/targets/generator/TS-132.eval.mjs` | case file of C002-TC-132 on fx-gate (ready to archive; fixture builder of C002-T-037) through the existing case API; run by C002-T-056 |

## Preconditions

- C002-T-025 done.

## Step outline (no production code)

1. Run the detectors on bodies after the wiring variants replace their anchors (processing order of
   C002-IF-001 §3; C002-T-028 adds the variant pass before this one).
2. Report all diagnostics of a run, not only the first one, then exit non-zero.

## Verification

- `npm test -- cap01`

## Done when

- [ ] The listed integration scenarios pass; the real source plugin generates with 0 unmapped constructs once C002-T-028 is done
- [ ] C002-TC-132 (eval) listed in the task report as carried to C002-T-056; the inlined-body clause
      of C002-TC-134 as carried to C002-T-028
- [ ] Progress reported: `sdd task set C002-T-027 --status done --commit <sha>`
