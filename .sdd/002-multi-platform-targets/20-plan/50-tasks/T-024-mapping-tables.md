---
id: C002-T-024
title: "Mapping tables, their schema copy and loader"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-001, C002-T-002, C002-T-006, C002-T-015]
implements: []
satisfies_ac: [C002-AC-103.1, C002-AC-105.1]
verified_by: [C002-TS-106, C002-TS-109, C002-TS-110]
components: [C002-COMP-002]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-024 — Mapping tables, their schema copy and loader

## Intent

Create `plugins/architect/targets/` with the one in-repository copy of `mapping-table.schema.json`
(C002-ADR-002) and the two tables `opencode.json` and `copilot.json` (C002-IF-001). Their values come
from the spike records: enforcement mode, tested versions, model identifier per tier, tool grants, MCP
servers with the Serena entry, construct detectors, and `effort` and `color` handling. The loader
validates the tables with Ajv and is shared by the generator, the structure checks and the release
check.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/targets/mapping-table.schema.json` | copy of the spec contract; its pair is added to the C002-T-006 equality test |
| add | `plugins/architect/targets/opencode.json`, `plugins/architect/targets/copilot.json` | tables per C002-IF-001, values cited from `docs/spikes/S-07-opencode.md` and `docs/spikes/S-08-copilot-vscode.md` |
| add | `scripts/generate/tables.ts` | load, validate (Ajv 2020-12, `date` format registered), messages from `instancePath` and `message` |
| add | `tests/integration/cap01/tables.test.ts` | both tables valid; a broken table fails with the path of the error |

## Preconditions

- C002-T-001 and C002-T-002 done (records signed off); C002-T-006 (equality test); C002-T-015
  (staging filter in place).

## Step outline (no production code)

1. Copy the schema and register the pair in the equality test.
2. Fill each table from its spike record. A value that the record does not give is a defect against
   the record, not a guess.
3. If S-08 gave `deferred`, do not create `copilot.json`; follow `10-strategy.md` §4.
4. Check that PLG-PATH-001 passes: no machine path in any table.

## Verification

- `npm test -- cap01` and `npm test -- contracts`
- `npm run check`

## Done when

- [ ] Both tables validate; every value traces to a spike record line
- [ ] Progress reported: `sdd task set C002-T-024 --status done --commit <sha>`
