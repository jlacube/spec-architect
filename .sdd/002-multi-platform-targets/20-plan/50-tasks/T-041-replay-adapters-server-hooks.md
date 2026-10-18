---
id: C002-T-041
title: "Replay adapters: sdd MCP server and Copilot guard hooks"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-020, C002-T-022, C002-T-033, C002-T-040]
implements: [C002-REQ-606, C002-NFR-201, C002-NFR-202]
satisfies_ac: [C002-AC-606.1]
verified_by: [C002-TS-608, C002-TS-609, C002-TC-608, C002-TC-609]
components: [C002-COMP-008, C002-COMP-005, C002-COMP-012]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-041 — Replay adapters: sdd MCP server and Copilot guard hooks

## Intent

Feed every applicable corpus case to the `sdd-mcp-server` mechanism, using the server of the packed
tarball, and to the `copilot-hooks` mechanism, using the PreToolUse command of the fallback package
(`sdd hook guard --host copilot --mode copilot-hooks --agents …`, C002-IF-008 §2). Each case's input
follows C002-IF-009 §2.2, and the decision is read per §2.3. Shell cases replay in their own dialect.
The rules that decide by caller identity and repository (C002-IF-008 §2 rules 3, 4 and 6, the
subagent guard) are tested by the scenarios of C002-T-032, not by the replay (C002-REQ-626).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `tests/replay/adapters/sdd-mcp-server.ts` | starts `sdd-mcp` from an install of the tarball; one session per profile; `dialect` per case |
| add | `tests/replay/adapters/copilot-hooks.ts` | Copilot-shaped input from the S-08 record, with the playing generated agent in `agent_type` as VS Code reports it (`sdd-spec-writer`) and the hook `tool_name` of the case's class (C002-IF-009 §2.2); decision per §2.3: exit 2 with the deny decision on standard output is a deny, exit 0 with empty standard output an allow, anything else no decision. Used only under `copilot-hooks`; the signed-off S-08 record gives `sdd-mcp-server`, so its release replay is not applicable at the tested versions |
| add | `tests/unit/replay/adapters.test.ts` | a sample of cases per adapter on a fixture |

## Preconditions

- C002-T-020, C002-T-022, C002-T-033 and C002-T-040 done.

## Step outline (no production code)

1. Map each corpus case to a tool call (server) or a hook input (Copilot), with the case's own `cwd`.
2. Run the full corpora with both adapters under PowerShell 7 and Git Bash. Fix differences in the
   product code, never in the expectations.

## Verification

- `npm run replay -- --mechanism sdd-mcp-server` and `npm run replay -- --mechanism copilot-hooks`

## Done when

- [ ] 0 differing decisions for both mechanisms on REF-WIN (development run; release runs are C002-T-049)
- [ ] Progress reported: `sdd task set C002-T-041 --status done --commit <sha>`
