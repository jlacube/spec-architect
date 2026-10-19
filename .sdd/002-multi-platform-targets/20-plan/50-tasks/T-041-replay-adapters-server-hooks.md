---
id: C002-T-041
title: "Replay adapters: sdd MCP server and Copilot guard hooks"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: in-progress
depends_on: [C002-T-020, C002-T-022, C002-T-033, C002-T-040, C002-T-063]
implements: [C002-REQ-606, C002-NFR-201, C002-NFR-202]
satisfies_ac: [C002-AC-606.1]
verified_by: [C002-TS-608, C002-TS-609, C002-TS-661, C002-TS-662, C002-TS-663, C002-TC-608, C002-TC-609, C002-TC-661, C002-TC-662, C002-TC-663]
components: [C002-COMP-008, C002-COMP-005, C002-COMP-012]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: "Adapters 5b4392b. sdd-mcp-server 10 differing (copilot, opencode), copilot-hooks 1 differing, all spec mapping/expectation gaps (D-014). Done after the D-014 revision re-baselines the expectations." }
---

# C002-T-041 — Replay adapters: sdd MCP server and Copilot guard hooks

## Intent

Feed every applicable corpus case to the `sdd-mcp-server` mechanism, using the server of the packed
tarball, and to the `copilot-hooks` mechanism, using the PreToolUse command of the fallback package
(`sdd hook guard --host copilot --mode copilot-hooks --agents …`, C002-IF-008 §2). Each case's input
follows C002-IF-009 §2.2, and the decision is read per §2.3. Shell cases replay in their own dialect.
The rules that decide by caller identity and repository (C002-IF-008 §2 rules 3, 4 and 6, the
subagent guard) are tested by the scenarios of C002-T-032, not by the replay (C002-REQ-626).

**After the D-010 … D-014 revision.** The development run of commit 5b4392b differed only where the
spec had no per-mechanism expectation (D-014). The revised §2.1 rows (write-tool shell cases, the
unexpanded `${CLAUDE_PLUGIN_DATA}` literal and the linked `cwd`) and ERR-MCP-003 read as `allow`
(§2.3) are put into `tests/replay/expect.ts` and the server adapter by C002-T-063, which also
regenerates the reports under `docs/releases/`. This task owns the Copilot hook tool names (`Write`,
`Bash`, `Glob`, §2.2) in its Copilot-hooks adapter. It then proves the revised rows with C002-TS-661, C002-TS-662 and C002-TS-663 and the two new planted rows of
C002-TS-609, and closes with 0 differing decisions.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `tests/replay/adapters/sdd-mcp-server.ts` | starts `sdd-mcp` from an install of the tarball; one session per profile; `dialect` per case |
| add | `tests/replay/adapters/copilot-hooks.ts` | Copilot-shaped input from the S-08 record, with the playing generated agent in `agent_type` as VS Code reports it (`sdd-spec-writer`) and the hook `tool_name` of the case's class, by the Copilot hook tool names of C002-IF-009 §2.2 (the seven non-shell tools of the shell corpus: Write, Edit, MultiEdit and NotebookEdit as `Write`, Read, Glob and Grep as their `read_only` hook tool); the installed copy of the fallback package run without `--classes`, its classes file rewritten per case with the case's dialect in every `terminal` entry and the case's `env` set for the hook process (§2.2 "Copilot classes copy per case", critic CR-46); decision per §2.3: exit 2 with the deny decision on standard output is a deny, exit 0 with empty standard output an allow, anything else no decision. Used only under `copilot-hooks`; the signed-off S-08 record gives `sdd-mcp-server`, so its release replay is not applicable at the tested versions |
| add | `tests/unit/replay/adapters.test.ts` | a sample of cases per adapter on a fixture (unit, not mapped to a TS) |
| add | `tests/integration/cap06/copilot-hook-names.test.ts` | C002-TC-663: the hook `tool_name` and `tool_input` fields of each corpus tool, read from the classes file of the generated hooks-fallback package (pkg-cp-hooks); an integration case, so not in the unit file (critic CR-34) |
| modify | `tests/replay/scenarios/suite.test.ts` | C002-TC-661 (the rows of C002-TS-661, per mechanism, with the corpus files unchanged) and C002-TC-662 (PG-048: ERR-MCP-003 in `detail`, decision `allow`, not differing) |

## Preconditions

- C002-T-020, C002-T-022, C002-T-033 and C002-T-040 done.
- C002-T-063 done: the revised expectations, `ERR-MCP-003` in the server adapter's allowed refusals,
  the schema copy and the regenerated reports.

## Step outline (no production code)

1. Map each corpus case to a tool call (server) or a hook input (Copilot), with the case's own `cwd`.
2. Run the full corpora with both adapters under PowerShell 7 and Git Bash. Fix differences in the
   product code, never in the expectations.
3. Write C002-TC-661 … C002-TC-663 and run C002-TC-609 with its two new planted rows: a write-tool
   shell case into `.sdd/` and an ERR-MCP-003 allow on a `deny` case are both reported as differing.
   C002-TC-661's OpenCode row (`@mode-native`) runs through the adapter of C002-T-042.

## Verification

- `npm run replay -- --mechanism sdd-mcp-server` and `npm run replay -- --mechanism copilot-hooks`,
  each under PowerShell 7 and Git Bash
- `npm run replay -- suite`, `npm test -- unit/replay`, `npm test -- cap06/copilot-hook-names`

## Done when

- [ ] 0 differing decisions for both mechanisms on REF-WIN, under PowerShell 7 and Git Bash, against the expectations of C002-IF-009 §2.1 and §2.3 as revised for D-014 (development run; release runs are C002-T-049 and C002-T-054); every replayed case records the `expected_source` of its §2.1 row
- [ ] C002-TC-609 (all four planted rows), C002-TC-661, C002-TC-662 and C002-TC-663 pass
- [ ] Progress reported: `sdd task set C002-T-041 --status done --commit <sha>`
