---
id: C002-ADR-001
artifact: plan/adr
change: CHG-002
phase: 20-plan
status: accepted
---

# C002-ADR-001 — sdd MCP server on the SDK's low-level server

## Context and problem

C002-IF-002 §4 fixes that the sdd MCP server (C002-COMP-005) uses the bundled MCP SDK; this is cited,
not re-decided. Bundling meets C002-NFR-402 and C002-CON-11, and C002-REQ-413 checks the licences of
everything the SDK brings. Left open is how the server binds to the SDK while keeping the contract:
schemas served from `sdd-mcp-tools.schema.json`, `-32602` for an unknown tool and `-32700`/`-32600`
for a malformed message, one `tools/call` at a time (C001-CON-11), JSON-RPC only on standard output
(C002-REQ-410), exit 0 on end of input (C002-REQ-411), and the budgets of C002-NFR-101 and
C002-NFR-102. Without a decision, the implementer chooses between bindings that differ in which
schemas the hosts see.

## Considered options

C002-OA-005 (`OA-005-mcp-protocol-binding.md`) scores four bindings and presents two:

- **A — SDK low-level server** (recommended, 4.35): the SDK's low-level server with its stdio
  transport, two request handlers and a FIFO queue.
- **C — SDK transport and message types only** (3.90): an in-repository dispatcher on the SDK's
  transport.

Rejected: the SDK's high-level server with zod shapes (serves derived schemas), and a hand-rolled
JSON-RPC server (contradicts C002-IF-002 §4).

## Decision outcome

**A.** `src/mcp/server.ts` creates the SDK's low-level server with capabilities
`{ tools: { listChanged: false } }` and its stdio transport. It registers handlers for `tools/list`
(the profile's tools, C002-REQ-415) and `tools/call`, and runs every `tools/call` through a FIFO queue
of one slot. The SDK keeps version negotiation and the lifecycle, which is the hosts' main
compatibility risk, while schemas, ordering and error codes stay in the server's code.

Not re-decided: the two profiles of one program (architecture §6.2), the in-process quick lint and
guard cores (C002-IF-002 §5, §7), and the bundled delivery (C002-IF-003).

## Consequences

- Good: `initialize` and protocol versions follow the SDK, so moving to a newer MCP revision means
  updating a pinned devDependency, not rewriting the server.
- The SDK is added as an exact-pinned devDependency and bundled into `sdd-mcp.mjs` only. Its
  packages are listed by the licence check and in `THIRD_PARTY_NOTICES.md` (C002-REQ-413,
  C002-REQ-414). Holds C002-CON-11 and C002-CON-12: the plugin bundle `scripts/sdd.mjs` does not
  import the SDK.
- Served schemas are self-contained. `tools/list` sends each tool's input and output schema with its
  `#/$defs/…` references inlined, produced at build time from the contract copy of C002-ADR-002.
- Malformed input: the implementing task tests what the SDK transport does with an unparsable line
  and with a JSON value that is not a JSON-RPC message. Where it only reports the error through its
  callback, the server writes the `-32700` or `-32600` response itself. The C002-TS-401 … C002-TS-416
  group covers this.
- Standard output discipline: nothing in the server process may write to standard output except the
  transport. Diagnostics, `SDD_DEBUG` logs and any console output from shared modules go to standard
  error (C002-REQ-410). A test runs one write and one command call and checks that every stdout line
  parses as JSON-RPC.
- Concurrency: the queue serialises calls; it does not change the decision path (C002-CON-06,
  C002-CON-08).
- Affects: C002-COMP-005, C002-COMP-006, C002-COMP-013; constraints C002-CON-07, C002-CON-08,
  C002-CON-11, C002-CON-15.
- Risk: an SDK update can change the bundle's composition. The licence check fails the build on a
  licence outside the allowlist (ERR-BLD-001), and the smoke test of C002-IF-003 §4 exercises
  `initialize` on Node.js 20 and 22.
