---
id: C002-OA-006
artifact: plan/option-analysis
change: CHG-002
phase: 20-plan
status: draft
title: "Validation against the JSON Schema contracts"
---

# C002-OA-006 — Validation against the JSON Schema contracts

## Problem

Three JSON Schema 2020-12 contracts of CHG-002 are validated by code:

- `mapping-table.schema.json` (C002-IF-001), validated by the generator. The error is ERR-GEN-004,
  `<table>: <JSON pointer>: <schema message>`.
- `release-record.schema.json` (C002-IF-009), with the release record, the replay report and the
  injection summary. The release check validates all three (C002-COMP-010).
- `sdd-mcp-tools.schema.json` (C002-IF-002), validated by the sdd MCP server on every call. The
  error is ERR-MCP-001, `invalid arguments for <tool>: <detail>`, for arguments "missing, of the
  wrong type, or not allowed by the tool's input schema" (C002-REQ-402, C002-TS-402).

The first two run at build or release time. The third runs inside `architect-sdd`, so whatever it uses
is bundled (C002-CON-11) and licence-checked (C002-REQ-413). The contracts live in the change folder,
and the generator must read nothing under `.sdd/` (C002-REQ-605), so the code needs its own copies.
How those copies stay equal to the contracts is part of this decision. Ajv 2020 is already a
devDependency, used by the CHG-001 contract tests and `evals/harness/questions.mjs`.

## Criteria

| Criterion | Weight |
|---|---|
| Contract fidelity | 30% |
| Usable error detail | 20% |
| Low implementation and maintenance effort | 20% |
| Small server footprint | 15% |
| Low dependency exposure | 15% |

- **Contract fidelity:** what is validated is the contract schema itself, one definition, every
  keyword honoured.
- **Usable error detail:** a JSON pointer and a message for ERR-GEN-004 and ERR-MCP-001.
- **Low implementation and maintenance effort:** code to write, and work per schema change.
- **Small server footprint:** code added to `sdd-mcp.mjs` and work at server start.
- **Low dependency exposure:** packages added to a shipped bundle.

## Candidates

- **A — Ajv everywhere:** Ajv (2020 dialect) validates every contract copy. The build-time tools
  import it directly; the server bundles it and compiles its input schemas once at start.
- **B — Ajv at build time, hand-written checks in the server:** TypeScript argument checks per tool,
  cross-checked against Ajv by tests.
- **C — Zod as the code-side source:** zod schemas (the MCP SDK's own dependency) define the
  documents; JSON Schema is generated from them and compared with the contracts.
- **D — In-house subset validator:** a small validator for the keywords the three contracts use,
  shared by the tools and the server, with a check that the contracts use no other keyword.
- **E — Build-time validation only:** the server checks argument types ad hoc and leaves schema
  validation to the MCP client.

## Scores

| Candidate | Contract fidelity | Usable error detail | Low implementation and maintenance effort | Small server footprint | Low dependency exposure | Weighted |
|---|---|---|---|---|---|---|
| A — Ajv everywhere | 5 | 5 | 5 | 3 | 4 | 4.55 |
| B — Ajv at build time, hand-written checks in the server | 3 | 3 | 3 | 5 | 5 | 3.60 |
| C — Zod as the code-side source | 2 | 4 | 2 | 4 | 4 | 3.00 |
| D — In-house subset validator | 4 | 4 | 2 | 5 | 5 | 3.90 |
| E — Build-time validation only | 1 | 2 | 5 | 5 | 5 | 3.20 |

- **A:** *Fidelity 5:* validates the contract copy itself. *Detail 5:* `instancePath` is a JSON
  pointer. *Effort 5:* the existing pattern. *Footprint 3:* the Ajv compiler is bundled, and three
  small schemas compile at start, outside the per-call budgets of C002-NFR-101 and C002-NFR-102.
  *Exposure 4:* Ajv and its helpers are MIT and BSD-3-Clause, both on the allowlist.
- **B:** *Fidelity 3:* two definitions of each tool's arguments, and drift is found only by the
  cross-check. *Detail 3:* messages without pointers unless the checks build them. *Effort 3.*
- **C:** *Fidelity 2:* schemas generated from zod differ in shape and dialect from the 2020-12
  contracts, so the code has a second source. *Effort 2:* three schemas rewritten, plus a
  conversion and an equality check.
- **D:** *Fidelity 4:* reads the contract, but only the supported keywords. *Effort 2:* a validator
  to write and test.
- **E:** *Fidelity 1:* "not allowed by the tool's input schema" (ERR-MCP-001) is not checked, and
  MCP clients need not validate arguments.

## Sensitivity

A leads D by 0.65. D overtakes A only if footprint and exposure together carry more than about half
of the weight (today 30%), with the other three criteria scaled down in proportion. No NFR measures
server start-up or bundle size, so this is implausible.

One fact is unverified: whether the pinned MCP SDK already bundles Ajv into `sdd-mcp.mjs` (recent SDK
versions use it for schema validation). The esbuild metafile will show it. If it does, A's footprint
and exposure scores rise to 5 and its total to 5.00.

A variant of A is Ajv's standalone code, generated at build time. It gives the same messages without
the compiler in the bundle (footprint 5). It is a reversible build detail, worth taking only if the
start-up of `sdd-mcp` ever matters.

## Presented

1. A — Ajv everywhere (Recommended)
2. D — In-house subset validator
3. B — Ajv at build time, hand-written checks in the server

## Recommendation

**A — Ajv everywhere.** One validator that reads the contract copies themselves, with pointer-based
messages for both error codes, at a footprint cost no NFR measures.

## Rejected

- C — Zod as the code-side source: a second source of every contract, and its generated schemas are
  not the 2020-12 contracts.
- E — Build-time validation only: fails ERR-MCP-001 and C002-REQ-402, which require the server to
  refuse arguments its input schema does not allow.
