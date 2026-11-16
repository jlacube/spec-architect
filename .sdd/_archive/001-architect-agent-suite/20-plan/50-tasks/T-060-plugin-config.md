---
id: C001-T-060
title: "Plugin manifests, marketplace, .mcp.json and agent tool contract"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: done
depends_on: [C001-T-041, C001-T-042, C001-T-043, C001-T-035, C001-T-036, C001-T-039, C001-T-052]
implements: [C001-REQ-1101, C001-REQ-1102, C001-REQ-1108, C001-REQ-1109, C001-REQ-1005, C001-REQ-1006, C001-REQ-1007, C001-REQ-1008, C001-REQ-218]
satisfies_ac: [C001-AC-1101.1, C001-AC-1102.1, C001-AC-1108.1, C001-AC-1109.1, C001-AC-1005.1, C001-AC-1006.1, C001-AC-1007.1, C001-AC-1008.1, C001-AC-218.1]
verified_by: [C001-TS-1101, C001-TS-1102, C001-TS-1109, C001-TS-1110, C001-TS-1006, C001-TS-1007, C001-TS-1008, C001-TS-1009, C001-TS-220, C001-TC-1101, C001-TC-1102, C001-TC-1109, C001-TC-1110, C001-TC-1006, C001-TC-1007, C001-TC-1008, C001-TC-1009, C001-TC-220]
components: [C001-COMP-11]
risk_refs: [C001-RISK-008]
estimate: M
report: { commit: def3514, completed_at: 2026-10-12, notes: "plugin validate passes; live Serena lists only the 7 read-only tools in a git repo; D-008 open (non-git folders); TC-1102 is a manual procedure to run at release" }
---

# C001-T-060 — Plugin manifests, marketplace, .mcp.json and agent tool contract

## Intent

Finalise the installable plugin: manifests, .mcp.json (context7, deepwiki, serena read-only), and verified least-privilege tools for all ten agents.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/.claude-plugin/plugin.json` | version, description, author |
| add | `plugins/architect/.mcp.json` | servers per C001-REQ-1108; Serena entry per C001-IF-14 §4 (launch arguments, `SERENA_HOME=${CLAUDE_PLUGIN_DATA}/serena`) |
| add | `plugins/architect/serena/architect-read-only.yml` | Serena read-only mode file per C001-IF-14 §4 |
| modify | `plugins/architect/agents/*.md` | tools exactly per C001-IF-09 (plugin-qualified `Agent(...)` names, `mcp__plugin_architect_<server>__<tool>`, `ToolSearch` for MCP agents; spikes S-05, S-06) |

## Preconditions

- All agents exist
- Dependencies done: C001-T-041, C001-T-042, C001-T-043, C001-T-035, C001-T-036, C001-T-039, C001-T-052

## Step outline (no production code)

1. Write .mcp.json.
2. Align all agent tool lists.
3. Run `claude plugin validate`.

## Verification

- C001-TC-1101, 1102 (smoke on REF-WIN), 1006…1009, 1109, 1110, 220 pass
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] PLG-TOOLS-001 and PLG-MCP-001 clean
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-060 --status done --commit <sha>` (or frontmatter fallback before T-026)
