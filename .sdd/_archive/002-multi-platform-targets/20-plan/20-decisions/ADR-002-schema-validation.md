---
id: C002-ADR-002
artifact: plan/adr
change: CHG-002
phase: 20-plan
status: accepted
---

# C002-ADR-002 — Ajv validates every JSON Schema contract, against in-repository copies

## Context and problem

The generator validates the mapping tables (ERR-GEN-004, C002-IF-001). The release check validates
release records, replay reports and injection summaries (C002-IF-009). The sdd MCP server validates
tool arguments on every call (ERR-MCP-001, C002-REQ-402).

The contracts are in `.sdd/002-multi-platform-targets/10-spec/50-interfaces/`. The generator must not
read `.sdd/` (C002-REQ-605), and the server ships without them, so the code needs copies. Without a
decision, each component would pick its own validator and its own copy, and the copies could drift
from the approved contracts.

## Considered options

C002-OA-006 (`OA-006-schema-validation.md`) scores five approaches and presents three:

- **A — Ajv everywhere** (recommended, 4.55).
- **D — In-house subset validator** (3.90).
- **B — Ajv at build time, hand-written checks in the server** (3.60).

Rejected: zod as the code-side source (a second source of every contract), and build-time
validation only (fails ERR-MCP-001).

## Decision outcome

**A.** Ajv in the 2020-12 dialect (already a devDependency) validates every contract, and the
messages are built from Ajv's `instancePath` and `message`.

The build-time tools import Ajv directly. The server bundles it and compiles its three input schemas
once at start. A failure at that point is the fatal start error, exit 3 (C002-IF-002 §1).

Each contract has exactly one in-repository copy:

| Contract | Copy | Read by |
|---|---|---|
| `mapping-table.schema.json` | `plugins/architect/targets/mapping-table.schema.json` (the tables name it in `$schema`) | generator, target structure checks, release check |
| `sdd-mcp-tools.schema.json` | `src/mcp/tools.schema.json` (bundled into `sdd-mcp.mjs`) | sdd MCP server; build step of C002-ADR-001 that writes the self-contained served schemas |
| `release-record.schema.json` | `docs/releases/release-record.schema.json` | release check, replay suite, eval runners |

An integration test checks that each copy deep-equals its contract. It reads the change folder while
CHG-002 is active, and `_living/` after the archive, the way the CHG-001 contract tests read their
schemas. A change to a contract therefore fails `npm test` until the copy follows.

## Consequences

- Good: one validator and one message shape across the generator, the release check and the server.
  The copies cannot drift unnoticed.
- `format: "date"` in the release record: the tools register a `date` format (`YYYY-MM-DD`) on their
  Ajv instance, instead of adding `ajv-formats`.
- The server bundle grows by Ajv and its helpers (MIT, BSD-3-Clause), which the licence check lists
  (C002-REQ-413, C002-REQ-414). If the metafile shows the MCP SDK already bundles Ajv (C002-OA-006
  Sensitivity), nothing is added. Ajv's standalone code remains a reversible build option.
- `plugins/architect/targets/` is left out of the Claude Code staging (C002-CON-10), so the schema
  copy there ships in no package.
- Affects: C002-COMP-001, C002-COMP-002, C002-COMP-005, C002-COMP-007, C002-COMP-008, C002-COMP-010;
  constraints C002-CON-10, C002-CON-11.
- Follow-up for the plan: a task (or a step of the generator and server tasks) for the copies and
  the equality test. The equality test needs a fallback path to `_living/` before the archive of
  CHG-002 moves the contracts.
