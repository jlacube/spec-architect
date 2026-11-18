---
id: "CHG-005"
title: "0.1.1 fixes"
kind: "brownfield"
profile: "lite"
status: active
phase: 20-plan
phases:
  00-ideation: { status: approved, approved_hash: "sha256:874c9db6ae403caba4fea1f4e24e9704ebd9287f4140aaef1e5637c5dcf86e12", approved_at: 2026-11-17, approved_by: "Jerome LACUBE" }
  10-spec: { status: approved, approved_hash: "sha256:05547e753e91ef5bdae59fbb756fb3cb7cf5481557033c3e26e4d09cdd1af997", approved_at: 2026-11-18, approved_by: "Jerome LACUBE" }
  20-plan: { status: approved, approved_hash: "sha256:29bebb78b163c9d1b3d2e468039adf2110ce1d31629b8cbc49a50104c96ad46e", approved_at: 2026-11-18, approved_by: "Jerome LACUBE" }
implementation: { status: not-started }
stopped: null
owners: []
defects:
  - { id: D-001, ref: C005-REQ-121, summary: "sdd task set on a lite task inserts Commit, Notes and Completed at between the Done when field and its checkboxes, so LINT-TASK-001 reports an empty Done when (found on C005-T-001; fields moved by hand, hash unchanged)", reporter: "Jerome LACUBE", date: 2026-11-17, status: closed, resolution: "Fixed by C005-T-025, commit ec447bb", closed_at: 2026-11-18 }
  - { id: D-002, ref: C005-TS-109, summary: "TS-109 fixture spec has no import task, so the scripted answer 'No, import first' is out of scope and the conductor rightly asks a follow-up round (9/10 runs log 2 rounds); fixture gap, not agent text", reporter: "Jerome LACUBE", date: 2026-11-18, status: closed, resolution: "Fixed by the TS-109 fixture import scope, commit ad8bc93; release tier 10/10", closed_at: 2026-11-18 }
waivers: []
---
# CHG-005 — 0.1.1 fixes

## Index
- `00-ideation/` — ideation (gate G1)
- `10-spec/` — specification (gate G2)
- `20-plan/` — plan (gate G3; implementers start at `20-plan/handoff.md`)

## Gate log
| Date | Gate | Decision | Words of approver | Waivers | Usage |
|---|---|---|---|---|---|
| 2026-11-17 | G1 (ideation) | **Approved** | "Approve" | none | unavailable |
| 2026-11-17 | G2 (spec) | **Approved** | "Approve" | none | unavailable |
| 2026-11-17 | G3 (plan) | **Approved** | "Approve" | none | unavailable |
| 2026-11-17 | G3 (plan) | **Revise** | "C005-REQ-122: re-approve G3 under the 0.1.1 hash rule" | none | unavailable |
| 2026-11-17 | G3 (plan) | **Approved** | "Standing approval (2026-10-24): routine G3 re-approval under C005-REQ-122, no plan text changed; P-01 2026-11-17: G3 approved. you can go full speed" | none | unavailable |
| 2026-11-17 | G2 (spec) | **Revise** | "D-001: sdd task set inserts lite report fields between the Done when field and its checkboxes; P-01 2026-11-17: Fix in CHG-005 (Recommended)" | none | unavailable |
| 2026-11-17 | G3 (plan) | **Revise** | "D-001: task C005-T-025 for C005-REQ-127 (lite report fields after the field list)" | none | unavailable |
| 2026-11-18 | G2 (spec) | **Approved** | "Approve" | none | unavailable |
| 2026-11-18 | G3 (plan) | **Approved** | "Approve" | none | unavailable |
