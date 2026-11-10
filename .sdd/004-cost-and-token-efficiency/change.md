---
id: "CHG-004"
title: "Cost and token efficiency"
kind: "brownfield"
profile: "lite"
status: active
phase: 00-ideation
phases:
  00-ideation: { status: not-started, approved_hash: null, approved_at: null, approved_by: null }
  10-spec: { status: not-started, approved_hash: null, approved_at: null, approved_by: null }
  20-plan: { status: not-started, approved_hash: null, approved_at: null, approved_by: null }
implementation: { status: not-started }
stopped: null
owners: []
defects: []
waivers: []
---
# CHG-004 — Cost and token efficiency

## Index
- `00-ideation/` — ideation (gate G1)
- `10-spec/` — specification (gate G2)
- `20-plan/` — plan (gate G3; implementers start at `20-plan/handoff.md`)

## Gate log
| Date | Gate | Decision | Words of approver | Waivers | Usage |
|---|---|---|---|---|---|

## Inherited scope (conductor's seed for ideation; not yet discussed with P-01)
Created by the conductor at the close of C001-T-072 (2026-11-10). Items deferred here by earlier decisions:
- the cost of a small lite change to G3 (about 50 USD notional on cfg-full; CHG-002 defect D-044, P-01 answer to Q-toy-g3-limit-01);
- the G3 toy-change run on cfg-bare and the cfg-bare part of C001-NFR-304 (CHG-001 D-028, Q-nfr304-bare-01);
- a proportionate rework path after a Revise at a gate (CHG-002 D-023 item 1, D-026 item 3);
- untimed docs walkthroughs of the Claude Code README and the Copilot `INSTALL.md`, and the README part of C001-SC-09 (CHG-001 D-031, CHG-002 D-049).
The profile (lite) is provisional: `sdd change profile` upgrades it to full if ideation shows the need.
