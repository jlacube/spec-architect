---
id: "CHG-002"
title: "Multi-platform targets"
kind: "brownfield"
profile: "full"
status: active
phase: 10-spec
phases:
  00-ideation: { status: approved, approved_hash: "sha256:9770ce05ad4ecb704e4ad27cc4acbc3045b73317b1c2d10462d7c21f56e83de1", approved_at: 2026-10-14, approved_by: jerome.lacube }
  10-spec: { status: in-revision, approved_hash: "sha256:5159d9b5063f0011fb54473f4e34f62515446ae5a68cb177f2a916b446ba5838", approved_at: 2026-10-15, approved_by: jerome.lacube }
  20-plan: { status: draft, approved_hash: null, approved_at: null, approved_by: null }
implementation: { status: not-started }
stopped: null
owners: []
defects:
  - { id: D-001, ref: C002-DOD-001, summary: "DoD items C002-DOD-001, 002, 003, 006, 007 require @eval scenarios to pass 9 of 10 runs (~880 paid sessions, ~$130), beyond the eval budget; P-01 chose dev tier only with a $25 budget (Q-evalbudget-01)", reporter: jerome.lacube, date: 2026-10-16, status: open, resolution: null, closed_at: null }
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
