---
id: CHG-001
title: Architect agent suite
kind: greenfield
phase: 20-plan
phases:
  00-ideation: { status: approved, approved_hash: "sha256:c9c7849fb7b87d1bbaca40bbdb5bc3be569788948de38b879c650621b0187401", approved_at: 2026-10-10, approved_by: jerome.lacube }
  10-spec: { status: approved, approved_hash: "sha256:1b861c673c78dd87cf5d84cbcfa3866ac634ccab330a218f6cc8fcd8b769a40b", approved_at: 2026-10-10, approved_by: jerome.lacube }
  20-plan: { status: approved, approved_hash: "sha256:200d2d3a6846a3b0da96c06943ef8aa57f72cbdae69ecf1a1b59fdcf15320db8", approved_at: 2026-10-10, approved_by: jerome.lacube }
implementation: { status: not-started, tasks_total: 58 }
owners: [jerome.lacube]
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
