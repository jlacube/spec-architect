---
id: "{{CHANGE}}"
title: "{{TITLE}}"
kind: "{{KIND}}"
profile: "{{PROFILE}}"
status: active
phase: 00-ideation
phases:
  00-ideation: { status: not-started }
  10-spec: { status: not-started }
  20-plan: { status: not-started }
implementation: { status: not-started }
stopped: null
owners: []
defects: []
waivers: []
---
# {{CHANGE}} — {{TITLE}}

## Index
- `00-ideation/` — ideation (gate G1)
- `10-spec/` — specification (gate G2)
- `20-plan/` — plan (gate G3; implementers start at `20-plan/handoff.md`)

## Gate log
| Date | Gate | Decision | Words of approver | Waivers | Usage |
|---|---|---|---|---|---|
