---
id: C001-T-003
title: "Spike S-02: Serena read-only on Windows"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-1
status: done
depends_on: [C001-T-001]
implements: []
satisfies_ac: [C001-AC-1006.1, C001-AC-1007.1]
verified_by: [C001-TS-1007, C001-TS-1008, C001-TC-1007, C001-TC-1008]
components: [C001-COMP-02, C001-COMP-11]
risk_refs: [C001-RISK-004]
estimate: S
report: { commit: 56293ce, completed_at: 2026-10-10, notes: "Verdict works-with-caveats (docs/spikes/S-02-serena.md). serena-agent 1.7.0 installs via uv in 19 s; references correct 10/10 on bolt.diy and crawl4ai. Launch command for C001-REQ-1006 not confirmed: spec defects D-S02-1 (planning mode not read-only), D-S02-2 (find_file/list_dir/search_for_pattern absent under claude-code), D-S02-3 (Serena writes <repo>/.serena/) opened. Working read-only launch verified (custom mode file + --project-from-cwd + dashboard off). C001-TC-1007/1008 belong to C001-T-060." }
---

# C001-T-003 — Spike S-02: Serena read-only on Windows

## Intent

Confirm Serena installs via uv on Windows, starts with the claude-code context and planning mode, exposes only read tools, and resolves references in TypeScript and Python.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/spikes/S-02-serena.md` | install steps, exact launch command and flags, tool list observed, reference-lookup results |

## Preconditions

- uv installed
- Dependencies done: C001-T-001

## Step outline (no production code)

1. `uv tool install -p 3.13 serena-agent`; locate the MCP launch command and its context/mode flags.
2. Start it from a scratch .mcp.json in a test project; list tools; confirm editing and shell tools are absent.
3. Run find_symbol and find_referencing_symbols on the two spike repositories.
4. Record the exact launch arguments to use in plugin .mcp.json (C001-REQ-1006).

## Verification

- Report lists the tool names exposed in planning mode and the launch command
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Launch command for C001-REQ-1006 confirmed or a spec defect raised
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-003 --status done --commit <sha>` (or frontmatter fallback before T-026)
