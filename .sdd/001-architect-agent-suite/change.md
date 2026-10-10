---
id: CHG-001
title: Architect agent suite
kind: greenfield
phase: 20-plan
phases:
  00-ideation: { status: approved, approved_hash: "sha256:c9c7849fb7b87d1bbaca40bbdb5bc3be569788948de38b879c650621b0187401", approved_at: 2026-10-10, approved_by: jerome.lacube }
  10-spec: { status: approved, approved_hash: "sha256:ce832cee236b2639113780bf0042139124deebf886e31ed3af6813a3c4c91af1", approved_at: 2026-10-10, approved_by: jerome.lacube }
  20-plan: { status: approved, approved_hash: "sha256:e31a6cbd289c98fec43f8e2786eee58f8c2c48502618b90c79699663f4a78483", approved_at: 2026-10-10, approved_by: jerome.lacube }
implementation: { status: not-started, tasks_total: 58 }
owners: [jerome.lacube]
---
# CHG-001 — Architect agent suite

## Index
- `00-ideation/ideation.md` — ideation document v0.2.0 (approved, G1)
- `10-spec/` — specification (approved, G2; start at `10-spec/00-index.md`)
- `20-plan/` — plan (approved, G3; implementers start at `20-plan/handoff.md`)

## Gate log
| Date | Gate | Decision | Words of approver | Waivers | Usage |
|---|---|---|---|---|---|
| 2026-10-10 | G1 (ideation) | **Approved** | "before approving I forgot to say yes for OQ-04 DeepWiki MCP addition. please add it — then I validate and you can continue" (OQ-04 applied in v0.2.0 before recording) | none | unavailable |
| 2026-10-10 | G2 (spec) | **Approved** | "1. approve 2. ok for one groupe of requirements, no need to split" (CR-3 resolved by documenting the singularity rule in C001-IF-04 §3.1 before hashing) | none | unavailable |
| 2026-10-10 | G3 (plan) | **Approved** | "1. approved 2. ok let's see after M-3, which means we need to have detailed metrics of token consumption + timings 3. looks good" (applied before hashing: T-029 detailed token/timing metrics, M-3 exit budget decision, ADR-003 updated; greenfield dogfood target confirmed, brownfield repository still to be named) | none | unavailable |
