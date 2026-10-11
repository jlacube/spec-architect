---
id: CHG-001
title: Architect agent suite
kind: greenfield
phase: 20-plan
phases:
  00-ideation: { status: approved, approved_hash: "sha256:8e70677254ad4df16d565e311d5518e4c1d08c73550b6a2fd3a6f7f9d51cc0a6", approved_at: 2026-10-11, approved_by: jerome.lacube }
  10-spec: { status: approved, approved_hash: "sha256:5bbceb152be57d3879b37c11890a26e31a7ff63ba6d43bd6eb68043a2d12564c", approved_at: 2026-10-11, approved_by: jerome.lacube }
  20-plan: { status: approved, approved_hash: "sha256:adb86d74bcaea656732c6d6b25b125f65d8bc98f4461818bad7b25f1fde278e1", approved_at: 2026-10-11, approved_by: jerome.lacube }
implementation: { status: not-started, tasks_total: 58 }
owners: [jerome.lacube]
defects:
  - { id: D-001, ref: C001-REQ-219, summary: "TodoWrite (granted to the conductor by C001-IF-09 A0 and assumed by C001-TS-221) is absent on Opus 5.x in Claude Code >= 2.1.268; TaskCreate/TaskUpdate/TaskList replace it and appear only when the session sets CLAUDE_CODE_ENABLE_TODO_TOOLS=1 (verified 2.1.295, C001-T-030)", reporter: implementer, date: 2026-10-11, status: closed, resolution: "C001-REQ-219, C001-TS-221, C001-IF-09 A0 and C001-IF-10 section 3 revised for the task tools (G2/G3 re-approved 2026-10-11)", closed_at: 2026-10-11 }
  - { id: D-002, ref: C001-REQ-206, summary: "C001-REQ-206/TS-207 require 2-3 options with the first labelled (Recommended) for every optioned question, but C001-REQ-802/TS-802 require the gate question to offer exactly Approve, Approve with waivers, Revise and Stop; the gate question needs an explicit exception (four fixed options, no recommendation) (found in C001-T-034)", reporter: implementer, date: 2026-10-11, status: open, resolution: null, closed_at: null }
  - { id: D-003, ref: C001-REQ-602, summary: "C001-TS-602, 611, 615, 617, 619 and 620 say 'the lint checks/parses' plan artifacts (task file shape, TC fields, risk fields, rollout content, handoff headings, ordered task list) but C001-IF errors catalogue defines no rule codes for them; verified for now by structure checks in the integration tests (found in C001-T-043)", reporter: implementer, date: 2026-10-11, status: open, resolution: null, closed_at: null }
  - { id: D-004, ref: C001-REQ-1013, summary: "C001-REQ-1013 has the conductor write serena/serena_config.yml in ${CLAUDE_PLUGIN_DATA}, but the conductor's write scope and the path guard (C001-REQ-1101, GUARD-PATH-001) allow writes only under .sdd/; implemented as a named exception for that one file (found in C001-T-044)", reporter: implementer, date: 2026-10-11, status: open, resolution: null, closed_at: null }
  - { id: D-005, ref: C001-REQ-813, summary: "C001-REQ-813 needs the IDs added, modified and removed since the last approval and their downstream references, but C001-IF-01/IF-13 define no CLI output for it; implemented as an Impact block of sdd gate show for phases in revision (found in C001-T-044)", reporter: implementer, date: 2026-10-11, status: open, resolution: null, closed_at: null }
---
# CHG-001 — Architect agent suite

## Index
- `00-ideation/ideation.md` — ideation document v0.2.0 (approved, G1)
- `10-spec/` — specification (approved, G2; revised after spikes S-01 … S-06; start at `10-spec/00-index.md`)
- `20-plan/` — plan (approved, G3; revised after spikes S-01 … S-06; implementers start at `20-plan/handoff.md`)

## Gate log
| Date | Gate | Decision | Words of approver | Waivers | Usage |
|---|---|---|---|---|---|
| 2026-10-10 | G1 (ideation) | **Approved** | "before approving I forgot to say yes for OQ-04 DeepWiki MCP addition. please add it — then I validate and you can continue" (OQ-04 applied in v0.2.0 before recording) | none | unavailable |
| 2026-10-10 | G2 (spec) | **Approved** | "1. approve 2. ok for one groupe of requirements, no need to split" (CR-3 resolved by documenting the singularity rule in C001-IF-04 §3.1 before hashing) | none | unavailable |
| 2026-10-10 | G3 (plan) | **Approved** | "1. approved 2. ok let's see after M-3, which means we need to have detailed metrics of token consumption + timings 3. looks good" (applied before hashing: T-029 detailed token/timing metrics, M-3 exit budget decision, ADR-003 updated; greenfield dogfood target confirmed, brownfield repository still to be named) | none | unavailable |
| 2026-10-10 | G2 (spec) | **Revision opened** (`10-spec` → in-revision, `20-plan` → stale) | "ok revise the impacted specs and update accordingly, fix everything that need fixing" | Reason: spike S-01 (C001-T-002, `docs/spikes/S-01-ripwire.md`) — ripwire 0.6.5 rejects the budget flags of C001-REQ-1003 on graph/list verbs, `--test-gate` exits 4 on success (C001-REQ-1010), the doctor probe `ripwire --doctor` needs a directory, and the Bash allowlist (C001-IF-07 §3) would block `--limit`/`--max-tokens` | none | unavailable |
| 2026-10-10 | G2 (spec) | **Approved** (revision S-01) | "Approve" | Changed IDs: added C001-TS-1014; modified C001-REQ-1003, C001-REQ-1010, C001-AC-1003.1, C001-AC-1010.1, C001-AC-1106.1, C001-TS-1004, C001-TS-1107; interfaces C001-IF-14 (§2 added), C001-IF-07 §3, commands.md §3 (ripwire row); hash sha256:f526ffff560ceb19699568c323640a2ad35683df6ae3b7faf1c0152390b8ed10 | none | unavailable |
| 2026-10-10 | G3 (plan) | **Approved** (revision S-01) | "Approve" | Changed IDs: modified C001-T-041, C001-T-044, C001-T-051, C001-T-062, C001-RISK-003; test plan row C001-TC-1014 added; handoff defect D-S01-1 resolved; hash sha256:29844efdd04b0ca9657a250ecd4958c6855cda0827834fbb4cacf121d4b57725 | none | unavailable |
| 2026-10-10 | G2 (spec) | **Revision opened** (`10-spec` → in-revision, `20-plan` → stale) | "Do task C001-T-007 next, then the single combined revision right after it, before any M-2 work starts. The revision covers spec and plan, with one G2 and one G3 re-approval." | Reason: spec defects D-S02-1…3, D-S03-1…2, D-S04-1, D-S05-1, D-S06-1…3 and plan defect D-S05-2 from spikes S-02 … S-06 (`docs/spikes/`), with the P-01 decisions recorded in `20-plan/handoff.md` | none | unavailable |
| 2026-10-10 | G2 (spec) | **Approved** (revision S-02 … S-06) | "Approve" | Added C001-REQ-1013, C001-REQ-1123 (+ AC-1013.1, AC-1123.1, TS-1015, TS-1124); tombstoned C001-REQ-504, 505, 506, 517, 1105 with their ACs and TSs; 41 IDs modified; interfaces C001-IF-07, 08, 09, 10, 14; hash sha256:1b861c673c78dd87cf5d84cbcfa3866ac634ccab330a218f6cc8fcd8b769a40b | none | unavailable |
| 2026-10-10 | G3 (plan) | **Approved** (revision S-02 … S-06) | "Approve" | Modified C001-T-029, 030, 041, 042, 044, 050, 060, 061, 062, 072 and C001-RISK-001, 002, 004, 005, 009; C001-T-071 dropped with a waiver (no Archify outputs in CHG-001); test plan 233 TCs; 11 handoff defects resolved; hash sha256:200d2d3a6846a3b0da96c06943ef8aa57f72cbdae69ecf1a1b59fdcf15320db8 | T-071 (Archify outputs) | unavailable |
| 2026-10-11 | G1 (ideation) | **Revise** | "T-028 dogfood revision. P-01 answers (2026-10-11): labels/IDs "Prefix/backtick"; scenarios "Relax REQ-413"; gaps "Index + fill stories"; small fixes "Fix in revision"" | none | unavailable |
| 2026-10-11 | G1 (ideation) | **Approved** | "Approve" | none | unavailable |
| 2026-10-11 | G2 (spec) | **Approved** | "Approve" | none | unavailable |
| 2026-10-11 | G3 (plan) | **Approved** | "Approve" | none | unavailable |
| 2026-10-11 | G3 (plan) | **Revise** | "C001-T-029 adds C001-ADR-007 (eval harness mechanism) to 20-plan/20-decisions, as the task requires" | none | unavailable |
| 2026-10-11 | G3 (plan) | **Approved** | "Approve" | none | unavailable |
| 2026-10-11 | G2 (spec) | **Revise** | "Defect D-001 (C001-T-030): task-tracking tools on current models; revise C001-REQ-219, C001-TS-221, C001-IF-09 A0 and the doctor remedies of C001-IF-10 section 3" | none | unavailable |
| 2026-10-11 | G2 (spec) | **Approved** | "Approve" | none | unavailable |
| 2026-10-11 | G3 (plan) | **Approved** | "Approve" | none | unavailable |
