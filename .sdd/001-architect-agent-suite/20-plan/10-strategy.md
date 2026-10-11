---
id: C001-PLAN-STRATEGY
artifact: plan/strategy
change: CHG-001
phase: 20-plan
status: approved
---

# CHG-001 — Strategy

## 1. Approach

The suite is built **from the deterministic core outwards** (C001-ADR-001):

1. Remove the unknowns first. Six verification spikes settle the platform behaviours the spec
   could only assume (C001-AS-09 … 12; critic CR-2).
2. Build the `sdd` CLI next: workspace, lint, trace, gate and tracking. From the end of M-2 it
   checks this repository's own `.sdd/`, so every later artifact, including agent outputs, is
   produced under an objective safety net.
3. Add agents in the order of the phases they serve: conductor and ideation/spec specialists
   (M-3), then cartographer, architect and planner (M-4).
4. Enforce the boundaries (guards, hooks) and close the loop (archive) in M-5. Agents exist by
   then, so the guards can be tested against real agent behaviour.
5. Package, document and measure (M-6). Release and prove the suite on two real changes (M-7).

## 2. Sequencing rationale

| Decision | Reason | Source |
|---|---|---|
| Spikes before anything design-dependent | S-05 (AskUserQuestion in a plugin main-session agent) and S-04 (hook agent identity) can each change a design (C001-REQ-201, C001-REQ-1103/1105) | CR-2, RISK-001, RISK-002 |
| CLI before agents | Agents' outputs are validated by the lint; building agents without it means rework | Q-plan-01 |
| `sdd task set` / `defect` in M-2 (not M-5) | Implementers of this plan (C001-ADR-004) report progress with the real protocol from M-3 onward | C001-REQ-901, C001-ADR-004 |
| Eval harness first in M-3 | Every M-3/M-4 agent task is verified by eval-level test cases | C001-ADR-003 |
| Guards in M-5, not M-1 | Guard decisions depend on S-04 and must be tested against real Architect agents | RISK-002 |
| Archify outputs for CHG-001 in M-7 | Deferred by Spec-Q3; done via a revision of 60-architecture to dogfood `/architect:revise`. Dropped 2026-10-10: Archify is unusable on Windows 11 (spike S-03) | T-071 (dropped) |
| Constitution for this repo in M-7 | The constitution interview needs the conductor (M-3) and doctor (M-4) | CR-9, T-070 |

## 3. Milestones

| ID | Name | Goal | Exit criterion | Tasks |
|---|---|---|---|---|
| C001-M-1 | Verification spikes and scaffolding | Unknown platform behaviours resolved before design-dependent work starts | All six spike reports have a verdict; resulting spec defects raised and triaged | C001-T-001 … C001-T-007 |
| C001-M-2 | Deterministic CLI core, dogfooded | A working `sdd` CLI that validates this repository | `sdd lint` exits 0 on this repository; G1/G2 hashes reproduce; prototypes retired; all M-2 test cases pass | C001-T-010 … C001-T-028 |
| C001-M-3 | Conductor and ideation/spec agents | Ideation and specification phases run end to end with interview, critic and gates | All M-3 eval test cases pass at milestone tier (3 runs); a toy change reaches G2; eval metrics report (tokens by type, agent and model; timings by session, subagent and tool call) produced, and P-01 decides the release eval budget from it | C001-T-029 … C001-T-039 |
| C001-M-4 | Code intelligence, architecture and planning agents | Brownfield grounding and the plan phase run end to end | All M-4 test cases pass at milestone tier; a toy change reaches G3 on cfg-full and cfg-bare | C001-T-041 … C001-T-044 |
| C001-M-5 | Hooks, guards and archive | The write/shell boundary is enforced and the archive loop works | Guard corpora 100%; injection evals 0 failures; archive test cases pass | C001-T-050 … C001-T-054 |
| C001-M-6 | Packaging and quality gates | Installable, documented, measured plugin | `npm run check` green; routing ≥ 90%; NFR results recorded | C001-T-060 … C001-T-065, C001-T-076, C001-T-077 |
| C001-M-7 | Release and dogfood | v0.1.0 released locally and proven on two real changes | Release evidence complete; dogfood logs recorded; CHG-001 archived | C001-T-070 … C001-T-075 |

Task numbers leave gaps between milestones (008–009, 040, 045–049, 055–059, 066–069) so the
numbering stays readable; gaps are not tombstones because they were never allocated.

## 4. Spike outcome handling

Each spike ends with a verdict (`works`, `works-with-caveats`, `fallback-only`). Any verdict
other than `works` that contradicts the approved spec is reported as a **spec defect**
(C001-REQ-907) against the affected REQ/IF, which triggers `/architect:revise spec`
(C001-REQ-812). Re-approval of G2 covers only the changed IDs (C001-REQ-813). The plan then
marks itself stale (C001-REQ-810) and the affected tasks are revised. Known contingencies:

| Spike | If negative | Contingency already specified |
|---|---|---|
| S-04 hook identity | Agent identity absent in hook input | Fallback guard scope (C001-REQ-1105) |
| S-05 AskUserQuestion in plugin `--agent` | Not available | AS-11: conductor runs as a skill-driven main session; spec revision of CAP-02 needed |
| S-01 ripwire Windows | Unstable | Fallback ladder (C001-REQ-1001); README marks ripwire optional |
| S-02 Serena Windows | Install or LSP failures | Serena optional; LSP/grep layers |
| S-03 Archify | License not permissive or headless failure | Mermaid-only (C001-REQ-507); T-071 dropped with a waiver |
| S-06 tool names / skill cost | Names differ; cost too high | Update C001-IF-09 names; reduce preloads, move content to `references/` |

Outcomes (2026-10-10, reports in `docs/spikes/`), applied by the G2/G3 revisions of 2026-10-10:

| Spike | Verdict | Effect on spec and plan |
|---|---|---|
| S-01 ripwire | works-with-caveats | bounding flag per verb family, answer exit codes (C001-REQ-1003, 1010, C001-IF-14 §2) |
| S-02 Serena | works-with-caveats | read-only launch with a plugin mode file, symbol tools only, data outside the repository (C001-REQ-1006, 1007, 1013, C001-IF-14 §4) |
| S-03 Archify | fallback-only | Mermaid only; C001-REQ-504…506, 517 deferred; T-071 dropped with a waiver |
| S-04 hook identity | works | primary guard design; fallback C001-REQ-1105 replaced by minimum Claude Code version C001-REQ-1123 |
| S-05 plugin agent | works-with-caveats | AS-11 holds (no fallback needed); qualified `Agent(...)` names; interview evals need an interactive or SDK harness (T-029) |
| S-06 skills and MCP | works-with-caveats | plugin-scoped MCP tool names with `ToolSearch`; skill budget in characters (C001-NFR-105) |

## 5. Ways of working for implementers

- One task per session where possible. Read `handoff.md`, then the task file, then the REQ,
  AC and TS IDs it lists.
- Test-first: write the test cases listed in `verified_by` before the implementation.
- Report with `sdd task set` once T-026 is done; before that, edit the task frontmatter
  `status` and `report` fields (C001-REQ-905 fallback).
- Never edit an approved spec artifact directly. Raise a defect instead (C001-REQ-907).
- Commit per task. Never push. Pushing and remote CI stay off until P-01 decides otherwise
  (Spec-Q4).
