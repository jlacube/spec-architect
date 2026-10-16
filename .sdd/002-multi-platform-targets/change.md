---
id: "CHG-002"
title: "Multi-platform targets"
kind: "brownfield"
profile: "full"
status: active
phase: 20-plan
phases:
  00-ideation: { status: approved, approved_hash: "sha256:9770ce05ad4ecb704e4ad27cc4acbc3045b73317b1c2d10462d7c21f56e83de1", approved_at: 2026-10-14, approved_by: jerome.lacube }
  10-spec: { status: approved, approved_hash: "sha256:7ffa1bc10d53793563db83fd0790cf25d34f51ee6ed78eb52fe9d2d398d7c8e1", approved_at: 2026-10-16, approved_by: jerome.lacube }
  20-plan: { status: approved, approved_hash: "sha256:24b6c0a5ef0c7fe9f446584438d0768ff4beaa0a85e7c70ac13dbc29b465b954", approved_at: 2026-10-16, approved_by: jerome.lacube }
implementation: { status: not-started }
stopped: null
owners: []
defects:
  - { id: D-001, ref: C002-DOD-001, summary: "DoD items C002-DOD-001, 002, 003, 006, 007 require @eval scenarios to pass 9 of 10 runs (~880 paid sessions, ~$130), beyond the eval budget; P-01 chose dev tier only with a $25 budget (Q-evalbudget-01)", reporter: jerome.lacube, date: 2026-10-16, status: closed, resolution: "Revised: dev-tier eval rule in C002-DOD-001/002/003/006/007/022; DOD-G-01 9-of-10 clause waived for CHG-002 (Q-evalbudget-01/02); G2 re-approved 08d6356", closed_at: 2026-10-16 }
  - { id: D-002, ref: C002-DOD-001, summary: "70-dod.md (DOD-G-01 note) fixes the CHG-002 eval budget at 25 USD; P-01 raised it to 40 USD (Q-evalbudget-03) — the spec should point to the plan's budget instead of a figure", reporter: jerome.lacube, date: 2026-10-16, status: closed, resolution: "Revised: the DoD's DOD-G-01 note points at the plan's eval budget (20-plan/60-test-plan.md §4.1, 40 USD per Q-evalbudget-03) instead of 25 USD; G2 re-approved", closed_at: 2026-10-16 }
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
