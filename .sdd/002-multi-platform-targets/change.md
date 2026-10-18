---
id: "CHG-002"
title: "Multi-platform targets"
kind: "brownfield"
profile: "full"
status: active
phase: 10-spec
phases:
  00-ideation: { status: approved, approved_hash: "sha256:9770ce05ad4ecb704e4ad27cc4acbc3045b73317b1c2d10462d7c21f56e83de1", approved_at: 2026-10-14, approved_by: jerome.lacube }
  10-spec: { status: in-revision, approved_hash: "sha256:4cef873754b83b3b87d2cc92802e314540c9da4514ce0805f8fef50145a40a33", approved_at: 2026-10-18, approved_by: jerome.lacube }
  20-plan: { status: stale, approved_hash: "sha256:99a70b123a9a926a0f809bdea298f20ce045d794a400ea44e7e4b59fbe653efd", approved_at: 2026-10-18, approved_by: jerome.lacube }
implementation: { status: not-started }
stopped: null
owners: []
defects:
  - { id: D-001, ref: C002-DOD-001, summary: "DoD items C002-DOD-001, 002, 003, 006, 007 require @eval scenarios to pass 9 of 10 runs (~880 paid sessions, ~$130), beyond the eval budget; P-01 chose dev tier only with a $25 budget (Q-evalbudget-01)", reporter: jerome.lacube, date: 2026-10-16, status: closed, resolution: "Revised: dev-tier eval rule in C002-DOD-001/002/003/006/007/022; DOD-G-01 9-of-10 clause waived for CHG-002 (Q-evalbudget-01/02); G2 re-approved 08d6356", closed_at: 2026-10-16 }
  - { id: D-002, ref: C002-DOD-001, summary: "70-dod.md (DOD-G-01 note) fixes the CHG-002 eval budget at 25 USD; P-01 raised it to 40 USD (Q-evalbudget-03) — the spec should point to the plan's budget instead of a figure", reporter: jerome.lacube, date: 2026-10-16, status: closed, resolution: "Revised: the DoD's DOD-G-01 note points at the plan's eval budget (20-plan/60-test-plan.md §4.1, 40 USD per Q-evalbudget-03) instead of 25 USD; G2 re-approved", closed_at: 2026-10-16 }
  - { id: D-003, ref: C002-REQ-301, summary: "Spike S-08 (docs/spikes/S-08-copilot-vscode.md §5, F-1…F-7): in VS Code the specialists must be workspace agents and the sdd MCP server a workspace MCP server (plugin agents are not offered as subagents, plugin MCP servers are not started); ${PLUGIN_ROOT} is not expanded in hook commands on Windows; agent-scoped hooks do not run but plugin-level hooks carry agent_type; question tool ask_user; Copilot CLI exit-code and <plugin>:<agent> naming; MCP tools deferred, named <server>-<tool>. P-01: one spec revision.", reporter: jerome.lacube, date: 2026-10-17, status: closed, resolution: "Revised per spike S-08 (F-1…F-7), Q-safety-06/07 subagent guard, eval auth switch; G2 re-approved", closed_at: 2026-10-18 }
  - { id: D-004, ref: C002-IF-003, summary: "Found in C002-T-012: (1) architect-sdd-package.md:35 says the npm sdd uses its own templates only 'when CLAUDE_PLUGIN_ROOT is not set'; implemented: it prefers the templates/ folder above its own bundle and falls back to CLAUDE_PLUGIN_ROOT (same folder on Claude Code; prevents the npm CLI reading another package's templates). (2) ERR-CLI-019 message in errors.md contains the editorial note '(the profile and the path as given)', printed verbatim by the CLI. Batch into the next spec revision.", reporter: jerome.lacube, date: 2026-10-18, status: open, resolution: null, closed_at: null }
  - { id: D-005, ref: C002-IF-005, summary: "Found in C002-T-004: the structure check PLG-VER-001 (root package.json version differs from plugin.json, C002-ADR-004) is implemented but named in no errors.md / check catalogue. Batch with D-004.", reporter: jerome.lacube, date: 2026-10-18, status: open, resolution: null, closed_at: null }
  - { id: D-006, ref: C002-IF-002, summary: "Found in C002-T-019: (1) the literal 'node ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs' passes the guard but is not expanded without a shell, so run_command fails with a non-zero exit — the spec is silent (generated agents use bare sdd); (2) ERR-MCP-006 gets a third reason 'not found beside the server' (sdd.mjs missing next to sdd-mcp) that errors.md does not list. Batch with D-004/D-005.", reporter: jerome.lacube, date: 2026-10-18, status: open, resolution: null, closed_at: null }
  - { id: D-007, ref: C002-IF-008, summary: "Found in C002-T-032: (1) a write-class call with no path in its input is denied with the fault text 'no path in the tool input' that errors.md does not list under GUARD-HOOK-001; (2) three fail-closed denies the spec does not list: --host other than copilot, an --agents name without the sdd- prefix under the hooks fallback, and a tool in several classes treated as its most restrictive class. Batch with D-004…D-006.", reporter: jerome.lacube, date: 2026-10-18, status: open, resolution: null, closed_at: null }
  - { id: D-008, ref: C002-TS-502, summary: "Found in C002-T-022: (1) TS-502 asks for 'the same files' as the bundled CLI, but REQ-518 rewrites the hand-off CLI lines in the npm templates — test checks same list and text apart from those lines; (2) ERR-BLD-002 printed with a 'ERR-BLD-002: ' prefix (TS-530 needs the code) while errors.md shows the message without it; (3) the npm README has no repository URL in the spec (https://github.com/jlacube/spec-architect). Batch with D-004…D-007.", reporter: jerome.lacube, date: 2026-10-18, status: open, resolution: null, closed_at: null }
  - { id: D-009, ref: C002-IF-001, summary: "Spike S-07 (docs/spikes/S-07-opencode.md §9, F-1…F-10; OpenCode 1.18.31 tested): mapping-table OpenCode tool names list/todoread/lsp/websearch absent by default; IF-001 §6.3 gap table lacks rows for links (junctions inside the project), redirections, trailing ';', $((…)) and pipe position; edit checks its text before permissions (replay Edit cases need matching fixture text); question tool off by default for SDK sessions; PATH resolves an npm .cmd shim and the shared DB is version-migrated (harness pins the binary and its own OPENCODE_DB); model catalog from models.opencode.ai; SDK 1.18.31 needs Node >= 22.22.2. P-01: one spec revision with D-004…D-008.", reporter: jerome.lacube, date: 2026-10-18, status: open, resolution: null, closed_at: null }
waivers:
  - { item: C002-REQ-211, gate: 10-spec, date: 2026-10-15, note: "Approve with waivers" }
  - { item: C002-REQ-212, gate: 10-spec, date: 2026-10-15, note: "Approve with waivers" }
  - { item: C002-REQ-213, gate: 10-spec, date: 2026-10-15, note: "Approve with waivers" }
  - { item: C002-REQ-503, gate: 10-spec, date: 2026-10-15, note: "Approve with waivers" }
  - { item: C002-REQ-504, gate: 10-spec, date: 2026-10-15, note: "Approve with waivers" }
  - { item: C002-REQ-505, gate: 10-spec, date: 2026-10-15, note: "Approve with waivers" }
  - { item: C002-REQ-506, gate: 10-spec, date: 2026-10-15, note: "Approve with waivers" }
  - { item: C002-REQ-507, gate: 10-spec, date: 2026-10-15, note: "Approve with waivers" }
  - { item: C002-REQ-601, gate: 10-spec, date: 2026-10-15, note: "Approve with waivers" }
  - { item: C002-REQ-211, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-212, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-213, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-503, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-504, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-505, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-506, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-507, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-601, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: DOD-G-01, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-211, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-212, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-213, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-503, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-504, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-505, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-506, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-507, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-601, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: DOD-G-01, gate: 10-spec, date: 2026-10-16, note: "Approve with waivers" }
  - { item: C002-REQ-211, gate: 10-spec, date: 2026-10-18, note: "Approve with waivers" }
  - { item: C002-REQ-212, gate: 10-spec, date: 2026-10-18, note: "Approve with waivers" }
  - { item: C002-REQ-213, gate: 10-spec, date: 2026-10-18, note: "Approve with waivers" }
  - { item: C002-REQ-503, gate: 10-spec, date: 2026-10-18, note: "Approve with waivers" }
  - { item: C002-REQ-504, gate: 10-spec, date: 2026-10-18, note: "Approve with waivers" }
  - { item: C002-REQ-505, gate: 10-spec, date: 2026-10-18, note: "Approve with waivers" }
  - { item: C002-REQ-506, gate: 10-spec, date: 2026-10-18, note: "Approve with waivers" }
  - { item: C002-REQ-507, gate: 10-spec, date: 2026-10-18, note: "Approve with waivers" }
  - { item: C002-REQ-601, gate: 10-spec, date: 2026-10-18, note: "Approve with waivers" }
  - { item: DOD-G-01, gate: 10-spec, date: 2026-10-18, note: "Approve with waivers" }
---
# CHG-002 — Multi-platform targets

## Index
- `00-ideation/` — ideation (gate G1)
- `10-spec/` — specification (gate G2)
- `20-plan/` — plan (gate G3; implementers start at `20-plan/handoff.md`)

## Gate log
| Date | Gate | Decision | Words of approver | Waivers | Usage |
|---|---|---|---|---|---|
| 2026-10-14 | G1 (ideation) | **Approved** | "Approve" | none | unavailable |
| 2026-10-15 | G2 (spec) | **Approved with waivers** | "Approve with waivers" | C002-REQ-211, C002-REQ-212, C002-REQ-213, C002-REQ-503, C002-REQ-504, C002-REQ-505, C002-REQ-506, C002-REQ-507, C002-REQ-601 | unavailable |
| 2026-10-16 | G2 (spec) | **Revise** | "D-001: P-01 chose eval option A (dev tier only, $25 budget) in Q-evalbudget-01; revise the 9-of-10-runs rule out of C002-DOD-001, 002, 003, 006, 007" | none | unavailable |
| 2026-10-16 | G2 (spec) | **Approved with waivers** | "Approve with waivers" | C002-REQ-211, C002-REQ-212, C002-REQ-213, C002-REQ-503, C002-REQ-504, C002-REQ-505, C002-REQ-506, C002-REQ-507, C002-REQ-601, DOD-G-01 | unavailable |
| 2026-10-16 | G2 (spec) | **Revise** | "D-002: the DoD names a 25 USD eval budget; P-01 set 40 USD in Q-evalbudget-03; point the DoD at the plan's budget (20-plan/60-test-plan.md §4.1)" | none | unavailable |
| 2026-10-16 | G2 (spec) | **Approved with waivers** | "Approve with waivers" | C002-REQ-211, C002-REQ-212, C002-REQ-213, C002-REQ-503, C002-REQ-504, C002-REQ-505, C002-REQ-506, C002-REQ-507, C002-REQ-601, DOD-G-01 | unavailable |
| 2026-10-16 | G3 (plan) | **Approved** | "Approve" | none | unavailable |
| 2026-10-16 | G3 (plan) | **Revise** | "P-01 (2026-10-16): Copilot bills AI Credits (1 credit = 0.01 USD, per token at model API rates), not requests; P-01's plan has 1,500 included credits per month and additional usage enabled with a 50 USD budget. Record the AI-Credit estimate in the test plan and run the Copilot spike C002-T-002 first; OpenCode inference goes through OpenRouter, to be discussed before C002-T-001" | none | unavailable |
| 2026-10-16 | G3 (plan) | **Approved** | "Approve" | none | unavailable |
| 2026-10-17 | G2 (spec) | **Revise** | "D-003: spike S-08 facts F-1…F-7 (docs/spikes/S-08-copilot-vscode.md §5); P-01: one spec revision" | none | unavailable |
| 2026-10-18 | G2 (spec) | **Approved with waivers** | "Approve with waivers" | C002-REQ-211, C002-REQ-212, C002-REQ-213, C002-REQ-503, C002-REQ-504, C002-REQ-505, C002-REQ-506, C002-REQ-507, C002-REQ-601, DOD-G-01 | unavailable |
| 2026-10-18 | G3 (plan) | **Approved** | "Approve" | none | unavailable |
| 2026-10-18 | G3 (plan) | **Revise** | "Q-opencode-01 answered: OpenCode eval sessions bill P-01's OpenRouter account (Claude tiers via OpenRouter), stop at 40 USD; Claude Code evals on the Max subscription (T-060), so the prepaid API key top-up is no longer needed" | none | unavailable |
| 2026-10-18 | G3 (plan) | **Approved** | "Approve" | none | unavailable |
| 2026-10-18 | G2 (spec) | **Revise** | "D-004…D-009: implementation findings (template root precedence, catalogue texts, PLG-VER-001, run_command plugin-root literal, hook-adapter extra denies, TS-502/ERR-BLD-002/README URL) and spike S-07 facts F-1…F-10 (OpenCode 1.18.31); P-01: one spec revision" | none | unavailable |
