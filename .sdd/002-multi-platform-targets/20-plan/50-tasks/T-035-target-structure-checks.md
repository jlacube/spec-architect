---
id: C002-T-035
title: "Target structure checks and the npm run check step"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: done
depends_on: [C002-T-022, C002-T-030, C002-T-033]
implements: [C002-REQ-110, C002-REQ-113, C002-REQ-217, C002-REQ-321, C002-REQ-326, C002-REQ-601, C002-REQ-602, C002-REQ-603, C002-REQ-604, C002-REQ-605, C002-NFR-104]
satisfies_ac: [C002-AC-110.1, C002-AC-113.1, C002-AC-217.1, C002-AC-321.1, C002-AC-326.1, C002-AC-601.1, C002-AC-602.1, C002-AC-603.1, C002-AC-604.1, C002-AC-605.1]
verified_by: [C002-TS-116, C002-TS-121, C002-TS-122, C002-TS-126, C002-TS-229, C002-TS-340, C002-TS-355, C002-TS-601, C002-TS-602, C002-TS-603, C002-TS-604, C002-TS-605, C002-TS-606, C002-TS-607, C002-TS-640, C002-TC-116, C002-TC-121, C002-TC-122, C002-TC-126, C002-TC-229, C002-TC-340, C002-TC-355, C002-TC-601, C002-TC-602, C002-TC-603, C002-TC-604, C002-TC-605, C002-TC-606, C002-TC-607, C002-TC-640]
components: [C002-COMP-007, C002-COMP-013]
risk_refs: []
estimate: L
report: { commit: c4eb00f, completed_at: 2026-10-19, notes: "cap06 98/98 (54 new); targets step ~1.3 s. TGT-NPM-001 not in scope (no owning task). Candidate defects: copilot.json detectors miss ${PLUGIN_ROOT}/scripts/sdd.mjs (TGT-PORT-001 checks it directly); TGT-AGENT/MODE/MEM/SERENA/NPM have no owning task; IF-005 '14 existing checks' is 15; TC-121 location; TS-606 tool sets undefined." }
---

# C002-T-035 — Target structure checks and the npm run check step

## Intent

Add the check family of C002-IF-005 §6 (revised for defect D-003). TGT-* checks compare each
generated package with its contract (C002-REQ-603): on Copilot the plugin part and the install
sources (`install/plugin.json`, `install/mcp.json`, `install/hooks.template.json`,
`hooks/tool-classes.json`), and no `.mcp.json`, `hooks.json` or `plugin.json` at the package root
(TGT-LAYOUT-001, TGT-MCP-001). They report untranslated constructs, with `${CLAUDE_PLUGIN_ROOT}` and
`${PLUGIN_ROOT}` accepted in no Copilot context (C002-REQ-602, C002-REQ-326, TGT-PORT-001), Copilot
generic grants and agents without a `tools` list, and under the hooks fallback a generic grant of
the conductor or a prompt file (C002-REQ-604, C002-REQ-321, TGT-GRANT-001), the hook-command form
and, in both modes, exactly one PreToolUse entry with `--mode` equal to the table's mode and the ten
agents in `--agents` (TGT-HOOK-001; C002-REQ-302, C002-REQ-327), the inlining budget (C002-REQ-110,
C002-NFR-104), the Serena declaration and the tool classes in both modes, the sdd MCP server tools
and the generic `Write` and `Bash` included (TGT-CLASS-001). On OpenCode, TGT-PERM-001 also checks the
per-agent `question` rule: `allow` for the conductor, `deny` for each specialist; the finding names the
agent and its value or the missing key (C002-REQ-217, C002-TS-229). PLG-VAR-001 runs on the source plugin with the Copilot
host-only names `ask_user` and `tool_search_tool` (C002-REQ-113). No check reads a change folder by
a fixed path (C002-REQ-605). `npm run check` generates into a fresh temporary folder and runs them
(C002-REQ-601).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/check/targets/*.mjs` | TGT-* checks with their own `ctx` (generated output), never the plugin `ctx` |
| add | `scripts/check/variants.mjs` | PLG-VAR-001 over `agents/`, `commands/`, `skills/` |
| modify | `scripts/check.mjs` | new step `targets` (not part of `structure`, so `TS-1118.test.ts` is unaffected) |
| add | `tests/integration/cap06/structure-checks.test.ts` | the listed scenarios with planted faults |

## Preconditions

- C002-T-022 (tarball), C002-T-030 and C002-T-033 (complete packages) done.

## Step outline (no production code)

1. Build the target `ctx` from a temporary `--out`, so the repository's `dist/` is not read.
2. Measure the inlined size per skill and per agent. Name the skills concerned when a budget is
   exceeded.
3. Read the contract values from the mapping tables and from the C002 interface files through the
   locator, never by a fixed change-folder path.
4. Copilot: scan `install/mcp.json` and `install/hooks.template.json` as configuration and hook files
   (contexts `mcp-config` and `hook-command`); a `.mcp.json`, `hooks.json` or `plugin.json` at the
   root of the generated package is a layout error, and a server declared there is also a TGT-MCP-001 finding (C002-TS-327,
   C002-TS-605).

## Verification

- `npm run check` and `npm test -- cap06`

## Done when

- [ ] `npm run check` green on the real packages; every planted fault reported with its code
- [ ] Progress reported: `sdd task set C002-T-035 --status done --commit <sha>`
