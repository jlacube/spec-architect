---
id: "CHG-002"
title: "Multi-platform targets"
kind: "brownfield"
profile: "full"
status: active
phase: 20-plan
phases:
  00-ideation: { status: approved, approved_hash: "sha256:9770ce05ad4ecb704e4ad27cc4acbc3045b73317b1c2d10462d7c21f56e83de1", approved_at: 2026-10-14, approved_by: jerome.lacube }
  10-spec: { status: approved, approved_hash: "sha256:f2a0f5faba7804f5e01175fb515270af3c4587f4c6b291afcfae330f936a8b17", approved_at: 2026-10-20, approved_by: jerome.lacube }
  20-plan: { status: approved, approved_hash: "sha256:1608b15bb2ca73c30575decd64f38b3c8347b7a798b48f20f75418166d47ce54", approved_at: 2026-10-20, approved_by: jerome.lacube }
implementation: { status: not-started }
stopped: null
owners: []
defects:
  - { id: D-001, ref: C002-DOD-001, summary: "DoD items C002-DOD-001, 002, 003, 006, 007 require @eval scenarios to pass 9 of 10 runs (~880 paid sessions, ~$130), beyond the eval budget; P-01 chose dev tier only with a $25 budget (Q-evalbudget-01)", reporter: jerome.lacube, date: 2026-10-16, status: closed, resolution: "Revised: dev-tier eval rule in C002-DOD-001/002/003/006/007/022; DOD-G-01 9-of-10 clause waived for CHG-002 (Q-evalbudget-01/02); G2 re-approved 08d6356", closed_at: 2026-10-16 }
  - { id: D-002, ref: C002-DOD-001, summary: "70-dod.md (DOD-G-01 note) fixes the CHG-002 eval budget at 25 USD; P-01 raised it to 40 USD (Q-evalbudget-03) — the spec should point to the plan's budget instead of a figure", reporter: jerome.lacube, date: 2026-10-16, status: closed, resolution: "Revised: the DoD's DOD-G-01 note points at the plan's eval budget (20-plan/60-test-plan.md §4.1, 40 USD per Q-evalbudget-03) instead of 25 USD; G2 re-approved", closed_at: 2026-10-16 }
  - { id: D-003, ref: C002-REQ-301, summary: "Spike S-08 (docs/spikes/S-08-copilot-vscode.md §5, F-1…F-7): in VS Code the specialists must be workspace agents and the sdd MCP server a workspace MCP server (plugin agents are not offered as subagents, plugin MCP servers are not started); ${PLUGIN_ROOT} is not expanded in hook commands on Windows; agent-scoped hooks do not run but plugin-level hooks carry agent_type; question tool ask_user; Copilot CLI exit-code and <plugin>:<agent> naming; MCP tools deferred, named <server>-<tool>. P-01: one spec revision.", reporter: jerome.lacube, date: 2026-10-17, status: closed, resolution: "Revised per spike S-08 (F-1…F-7), Q-safety-06/07 subagent guard, eval auth switch; G2 re-approved", closed_at: 2026-10-18 }
  - { id: D-004, ref: C002-IF-003, summary: "Found in C002-T-012: (1) architect-sdd-package.md:35 says the npm sdd uses its own templates only 'when CLAUDE_PLUGIN_ROOT is not set'; implemented: it prefers the templates/ folder above its own bundle and falls back to CLAUDE_PLUGIN_ROOT (same folder on Claude Code; prevents the npm CLI reading another package's templates). (2) ERR-CLI-019 message in errors.md contains the editorial note '(the profile and the path as given)', printed verbatim by the CLI. Batch into the next spec revision.", reporter: jerome.lacube, date: 2026-10-18, status: closed, resolution: "Resolved in the batched spec revision D-004…D-009 (G2 re-approved 2026-10-18); code catch-up in C002-T-061/T-062", closed_at: 2026-10-18 }
  - { id: D-005, ref: C002-IF-005, summary: "Found in C002-T-004: the structure check PLG-VER-001 (root package.json version differs from plugin.json, C002-ADR-004) is implemented but named in no errors.md / check catalogue. Batch with D-004.", reporter: jerome.lacube, date: 2026-10-18, status: closed, resolution: "Resolved in the batched spec revision D-004…D-009 (G2 re-approved 2026-10-18); code catch-up in C002-T-061/T-062", closed_at: 2026-10-18 }
  - { id: D-006, ref: C002-IF-002, summary: "Found in C002-T-019: (1) the literal 'node ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs' passes the guard but is not expanded without a shell, so run_command fails with a non-zero exit — the spec is silent (generated agents use bare sdd); (2) ERR-MCP-006 gets a third reason 'not found beside the server' (sdd.mjs missing next to sdd-mcp) that errors.md does not list. Batch with D-004/D-005.", reporter: jerome.lacube, date: 2026-10-18, status: closed, resolution: "Resolved in the batched spec revision D-004…D-009 (G2 re-approved 2026-10-18); code catch-up in C002-T-061/T-062", closed_at: 2026-10-18 }
  - { id: D-007, ref: C002-IF-008, summary: "Found in C002-T-032: (1) a write-class call with no path in its input is denied with the fault text 'no path in the tool input' that errors.md does not list under GUARD-HOOK-001; (2) three fail-closed denies the spec does not list: --host other than copilot, an --agents name without the sdd- prefix under the hooks fallback, and a tool in several classes treated as its most restrictive class. Batch with D-004…D-006.", reporter: jerome.lacube, date: 2026-10-18, status: closed, resolution: "Resolved in the batched spec revision D-004…D-009 (G2 re-approved 2026-10-18); code catch-up in C002-T-061/T-062", closed_at: 2026-10-18 }
  - { id: D-008, ref: C002-TS-502, summary: "Found in C002-T-022: (1) TS-502 asks for 'the same files' as the bundled CLI, but REQ-518 rewrites the hand-off CLI lines in the npm templates — test checks same list and text apart from those lines; (2) ERR-BLD-002 printed with a 'ERR-BLD-002: ' prefix (TS-530 needs the code) while errors.md shows the message without it; (3) the npm README has no repository URL in the spec (https://github.com/jlacube/spec-architect). Batch with D-004…D-007.", reporter: jerome.lacube, date: 2026-10-18, status: closed, resolution: "Resolved in the batched spec revision D-004…D-009 (G2 re-approved 2026-10-18); code catch-up in C002-T-061/T-062", closed_at: 2026-10-18 }
  - { id: D-009, ref: C002-IF-001, summary: "Spike S-07 (docs/spikes/S-07-opencode.md §9, F-1…F-10; OpenCode 1.18.31 tested): mapping-table OpenCode tool names list/todoread/lsp/websearch absent by default; IF-001 §6.3 gap table lacks rows for links (junctions inside the project), redirections, trailing ';', $((…)) and pipe position; edit checks its text before permissions (replay Edit cases need matching fixture text); question tool off by default for SDK sessions; PATH resolves an npm .cmd shim and the shared DB is version-migrated (harness pins the binary and its own OPENCODE_DB); model catalog from models.opencode.ai; SDK 1.18.31 needs Node >= 22.22.2. P-01: one spec revision with D-004…D-008.", reporter: jerome.lacube, date: 2026-10-18, status: closed, resolution: "Resolved in the batched spec revision D-004…D-009 (G2 re-approved 2026-10-18); code catch-up in C002-T-061/T-062", closed_at: 2026-10-18 }
  - { id: D-010, ref: C002-IF-001, summary: "Found in C002-T-026: (1) the OpenCode mapping needs the 'task' tool in agent_start — the conductor's closed tool map (\"*\": false) switches it off otherwise, and the conductor could not start specialists; IF-001 §2 does not list it. (2) Option-parser faults of hook guard (missing --mode value, unknown option, extra argument) still print 'tool call' (C002-T-062). (3) TS-502 assumes the new change is 002 though fx-bootstrap already holds change 002 (C002-T-061). Batch for the next revision.", reporter: jerome.lacube, date: 2026-10-18, status: closed, resolution: "Batched revision D-010…D-014 (2026-10-19): spec 9439c8d…df0d9e6, plan f3e288e…a940f58, G2 6cc55ef, G3 5cbe7ee; code follow-ups in C002-T-063", closed_at: 2026-10-19 }
  - { id: D-011, ref: C002-TS-226, summary: "Found in C002-T-042: (1) TS-226 assumes OpenCode built-in commands /new and /init clash with the plugin's; OpenCode 1.18.31 lists built-ins init, review, customize-opencode — no 'new'; (2) IF-009 §2.2 gives no mapping for shell-corpus cases whose tool is not a shell (BG-268…270) — implemented as the command fed as that tool's argument (BG-268 Write reads deny); (3) OpenCode tries to download ripgrep from GitHub at start (blocked by the closed proxy) — record in IF-010 §4 start-up conditions. Batch with D-010.", reporter: jerome.lacube, date: 2026-10-19, status: closed, resolution: "Batched revision D-010…D-014 (2026-10-19): spec 9439c8d…df0d9e6, plan f3e288e…a940f58, G2 6cc55ef, G3 5cbe7ee; code follow-ups in C002-T-063", closed_at: 2026-10-19 }
  - { id: D-012, ref: C002-REQ-510, summary: "Found in C002-T-038: sdd host-version reads only chat.useHooks, never Workspace Trust or organisation policy, so the Copilot doctor hooks row can never be ok (TS-516 ok rows, @manual-vscode, cannot pass). Decide: read trust/policy (where?) or change REQ-510/TS-516 (e.g. ok when chat.useHooks on, with a note that trust/policy are not read). Also from T-038: TS-509 Claude Code expects 'completed' but Context7/DeepWiki rows are always unreachable on Claude Code; TS-509/TS-515 OpenCode assume a PATH sdd, which server mode never uses; new wiring token {{host_version_arg}} missing from IF-001 §4; doctor command description still names Claude Code (frontmatter not an anchor). Must be settled before C002-T-046.", reporter: jerome.lacube, date: 2026-10-19, status: closed, resolution: "Batched revision D-010…D-014 (2026-10-19): spec 9439c8d…df0d9e6, plan f3e288e…a940f58, G2 6cc55ef, G3 5cbe7ee; code follow-ups in C002-T-063", closed_at: 2026-10-19 }
  - { id: D-013, ref: C002-IF-005, summary: "Found in C002-T-035/T-036/T-039: (1) copilot.json plugin-root detector excludes /scripts/sdd.mjs and cli-invocation matches only the CLAUDE_ form, so ${PLUGIN_ROOT}/scripts/sdd.mjs escapes the table detectors and the generator (TGT-PORT-001 checks it directly); (2) TGT-AGENT-001, TGT-MODE-001, TGT-MEM-001, TGT-SERENA-001 and TGT-NPM-001 have no owning task; (3) IF-005 says '14 existing checks', there were 15 (PLG-VER-001); (4) TC-121 location in the test plan vs structure-checks.test.ts; (5) TS-606 does not define which host tool sets contain generic tools; (6) no TC row for C002-NFR-301 / C002-NFR-103 (determinism test, generate bench); NFR-103 'build' wording vs ADR-003 bundling; (7) README links targets/<t>/install.md which target-packages.md §5 calls targets/<t>/wiring/install-notes.md, and the link does not resolve inside the Claude Code package (targets/ excluded); (8) under Claude desktop (MSIX) %LOCALAPPDATA% writes are redirected to the package LocalCache, so --user-data data written there is not seen by hosts started outside the package. Batch with D-010/D-011.", reporter: jerome.lacube, date: 2026-10-19, status: closed, resolution: "Batched revision D-010…D-014 (2026-10-19): spec 9439c8d…df0d9e6, plan f3e288e…a940f58, G2 6cc55ef, G3 5cbe7ee; code follow-ups in C002-T-063", closed_at: 2026-10-19 }
  - { id: D-014, ref: C002-IF-009, summary: "Found in C002-T-041 (blocks its done criterion '0 differing'): sdd-mcp-server replay 665 replayed, 10 differing on both targets; copilot-hooks 1. (1) BG-268 (shell corpus, tool Write, 'rm -rf src', expected allow): §2.2 has no mapping for shell-corpus cases of non-shell tools, fed as a write path -> deny on both mechanisms (OpenCode too); (2) PG-135 cwd through a junction: §2.2 runs the server at {repo} and uses the absolute path as given -> deny; (3) PG-048 trailing separator: guard allows, write fails ERR-MCP-003, §2.3 counts it as error (ERR-MCP-003 only happens after an allow; count as allow like ERR-MCP-004..006?); (4) BG-374, 379, 384, 389, 402, 403, 404: ${CLAUDE_PLUGIN_DATA} literal — run_command runs without a shell (no expansion) so the guard now denies it (code fix 5b4392b; before, the guard expanded it and the CLI created a folder named ${CLAUDE_PLUGIN_DATA} inside the repo); the corpus expectation is allow (shell semantics) — needs a per-mechanism expectation; (5) Copilot tool-name mapping for hooks: Read/Glob/Grep fed as Glob, Edit/NotebookEdit as Write, since S-08 does not record the read tool's hook name.", reporter: jerome.lacube, date: 2026-10-19, status: closed, resolution: "Batched revision D-010…D-014 (2026-10-19): spec 9439c8d…df0d9e6, plan f3e288e…a940f58, G2 6cc55ef, G3 5cbe7ee; code follow-ups in C002-T-063", closed_at: 2026-10-19 }
  - { id: D-015, ref: C002-IF-010, summary: "Found in C002-T-044/T-046: (1) IF-010 §3 reports tool calls by Claude Code names, but the T-037/T-038 case files expect OpenCode names for host opencode cases (runner: OpenCode names when host is opencode); (2) IF-010 §2 option 'answers' vs the case API's 'answer' function; (3) T-044 verification names evals/targets/opencode-host/, which T-056 never writes; (4) T-044, IF-010 §4 and E-OCE say the key comes from the user's credential store — P-01 replaced it by the key file with isolated data folders; (5) allowTools cannot gate tools OpenCode runs without asking (sdd MCP tools); (6) no eval-dispatcher relay on OpenCode (relay: direct); (7) doctor case rows without a host field also run under --host opencode; (8) T-046: TS-358 tagged @mode-server only vs IF-009 §4 both modes; REQ-614 MCP boundary step makes sense only in sdd-mcp-server mode; record 'each step once' vs rerun rule; TS-516 /doctor in restricted mode may be blocked by VS Code. Batch for the next revision.", reporter: jerome.lacube, date: 2026-10-19, status: open, resolution: null, closed_at: null }
  - { id: D-016, ref: C002-IF-009, summary: "Found in C002-T-047: (1) --dry-run and --root are not in the IF-009 §5 command line (needed by the task's verification); (2) fewer than 20 injection cases has no code of its own (reported ERR-REL-009 'injection summary (n cases, at least 20 required)'); (3) a report citing corpora whose SHA-256 differs from the release commit's has no ERR-REL-012 problem text (reported ERR-REL-009); (4) checklist steps of the package's mode missing or not-applicable reported ERR-REL-004 'is not recorded'/'is not-applicable' — REQ-615 'every step once' vs TS-633 row 3 allowed without injection steps; (5) mechanisms required per mode read from REQ-606 (sdd-mcp-server mode: sdd-mcp-server replay only); (6) the generator stamps architect-target.json package_version from the CLI build constant, not the source plugin.json — harmless while both are 0.0.1, wrong for a 0.3.0 fixture; (7) cases limited by platforms: no ERR-REL-012 problem text. Batch with D-015.", reporter: jerome.lacube, date: 2026-10-19, status: open, resolution: null, closed_at: null }
  - { id: D-017, ref: C002-IF-002, summary: "Found in C002-T-056 (TS-507 on OpenCode 1.18.31): IF-002 §3 has a failed or refused tools/call return structuredContent of $defs/errorResult with isError true, but tools/list advertises only the success outputSchema; OpenCode's MCP client validates error results against it and turns every refused/failed run_command (ERR-MCP-006 not found/.cmd shim, guard refusals) into 'MCP error -32602 structured content does not match the output schema'. The doctor then reports missing tools as error. Fix options: outputSchema as a union with errorResult, or no structuredContent on error results (text content only). Blocks TS-507, TS-509-opencode-bare, TS-639 on OpenCode; owner C002-T-019.", reporter: jerome.lacube, date: 2026-10-20, status: open, resolution: null, closed_at: null }
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
  - { item: C002-REQ-211, gate: 10-spec, date: 2026-10-19, note: "Approve with waivers" }
  - { item: C002-REQ-212, gate: 10-spec, date: 2026-10-19, note: "Approve with waivers" }
  - { item: C002-REQ-213, gate: 10-spec, date: 2026-10-19, note: "Approve with waivers" }
  - { item: C002-REQ-503, gate: 10-spec, date: 2026-10-19, note: "Approve with waivers" }
  - { item: C002-REQ-504, gate: 10-spec, date: 2026-10-19, note: "Approve with waivers" }
  - { item: C002-REQ-505, gate: 10-spec, date: 2026-10-19, note: "Approve with waivers" }
  - { item: C002-REQ-506, gate: 10-spec, date: 2026-10-19, note: "Approve with waivers" }
  - { item: C002-REQ-507, gate: 10-spec, date: 2026-10-19, note: "Approve with waivers" }
  - { item: C002-REQ-601, gate: 10-spec, date: 2026-10-19, note: "Approve with waivers" }
  - { item: C002-DOD-G-01, gate: 10-spec, date: 2026-10-19, note: "Approve with waivers" }
  - { item: C002-REQ-211, gate: 10-spec, date: 2026-10-20, note: "Approve with waivers" }
  - { item: C002-REQ-212, gate: 10-spec, date: 2026-10-20, note: "Approve with waivers" }
  - { item: C002-REQ-213, gate: 10-spec, date: 2026-10-20, note: "Approve with waivers" }
  - { item: C002-REQ-503, gate: 10-spec, date: 2026-10-20, note: "Approve with waivers" }
  - { item: C002-REQ-504, gate: 10-spec, date: 2026-10-20, note: "Approve with waivers" }
  - { item: C002-REQ-505, gate: 10-spec, date: 2026-10-20, note: "Approve with waivers" }
  - { item: C002-REQ-506, gate: 10-spec, date: 2026-10-20, note: "Approve with waivers" }
  - { item: C002-REQ-507, gate: 10-spec, date: 2026-10-20, note: "Approve with waivers" }
  - { item: C002-REQ-601, gate: 10-spec, date: 2026-10-20, note: "Approve with waivers" }
  - { item: C002-DOD-G-01, gate: 10-spec, date: 2026-10-20, note: "Approve with waivers" }
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
| 2026-10-18 | G2 (spec) | **Approved with waivers** | "Approve with waivers" | C002-REQ-211, C002-REQ-212, C002-REQ-213, C002-REQ-503, C002-REQ-504, C002-REQ-505, C002-REQ-506, C002-REQ-507, C002-REQ-601, DOD-G-01 | unavailable |
| 2026-10-18 | G3 (plan) | **Approved** | "Approve" | none | unavailable |
| 2026-10-19 | G2 (spec) | **Revise** | "Batched revision for spec defects D-010, D-011, D-012, D-013, D-014 (implementation findings of C002-T-026…T-058); D-012 decided by P-01: ok + caveat" | none | unavailable |
| 2026-10-19 | G2 (spec) | **Approved with waivers** | "Approve with waivers" | C002-REQ-211, C002-REQ-212, C002-REQ-213, C002-REQ-503, C002-REQ-504, C002-REQ-505, C002-REQ-506, C002-REQ-507, C002-REQ-601, C002-DOD-G-01 | unavailable |
| 2026-10-19 | G3 (plan) | **Approved** | "Approve" | none | unavailable |
| 2026-10-20 | G2 (spec) | **Revise** | "Revision for D-015, D-016, D-017 (eval runner, checklist and release-check findings; MCP error results: P-01 'No structured error (Recommended)')" | none | unavailable |
| 2026-10-20 | G2 (spec) | **Approved with waivers** | "Approve with waivers" | C002-REQ-211, C002-REQ-212, C002-REQ-213, C002-REQ-503, C002-REQ-504, C002-REQ-505, C002-REQ-506, C002-REQ-507, C002-REQ-601, C002-DOD-G-01 | unavailable |
| 2026-10-20 | G3 (plan) | **Approved** | "Approve" | none | unavailable |
