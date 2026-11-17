---
id: "CHG-005"
title: "0.1.1 fixes"
kind: "brownfield"
profile: "lite"
status: active
phase: 20-plan
phases:
  00-ideation: { status: approved, approved_hash: "sha256:874c9db6ae403caba4fea1f4e24e9704ebd9287f4140aaef1e5637c5dcf86e12", approved_at: 2026-11-17, approved_by: "Jerome LACUBE" }
  10-spec: { status: approved, approved_hash: "sha256:0a317544e8cf6343a6bb12ec561c454fb46d15166338e867da7658ed2fb82314", approved_at: 2026-11-17, approved_by: "Jerome LACUBE" }
  20-plan: { status: approved, approved_hash: "sha256:1a4aa77c32fd5408691b61498821f3026aceb9982bf11462fbbc310a0c5f1c1c", approved_at: 2026-11-17, approved_by: "Jerome LACUBE" }
implementation: { status: not-started }
stopped: null
owners: []
defects:
  - { id: D-001, ref: C005-REQ-121, summary: "sdd task set on a lite task inserts Commit, Notes and Completed at between the Done when field and its checkboxes, so LINT-TASK-001 reports an empty Done when (found on C005-T-001; fields moved by hand, hash unchanged)", reporter: "Jerome LACUBE", date: 2026-11-17, status: open, resolution: null, closed_at: null }
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
