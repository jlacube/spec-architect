---
id: C002-OA-005
artifact: plan/option-analysis
change: CHG-002
phase: 20-plan
status: draft
title: "Protocol binding of the sdd MCP server"
---

# C002-OA-005 — Protocol binding of the sdd MCP server

## Problem

The sdd MCP server (C002-COMP-005) speaks MCP over stdio to OpenCode and VS Code at their tested
versions. The approved interface already fixes the library family: "MCP over stdio, JSON-RPC 2.0,
using the bundled MCP SDK … Protocol versions: those the bundled SDK negotiates" (C002-IF-002 §4).
Bundling satisfies the "no runtime dependencies" rule: C002-NFR-402 and C002-CON-11 count only
packages that are neither bundled nor Node.js built-ins, and the licence check of C002-REQ-413 covers
whatever the SDK pulls in. What stays open is how the server binds to the SDK, because the same
interface also requires:

- `tools/list` serves the input and output schemas of `sdd-mcp-tools.schema.json` (C002-IF-002 §4);
- an unknown tool is JSON-RPC `-32602`, a malformed message `-32700` or `-32600`, and no tool runs;
- one `tools/call` at a time, in arrival order (C002-IF-002 §4, C001-CON-11);
- standard output carries JSON-RPC lines only (C002-REQ-410); exit 0 when standard input closes
  (C002-REQ-411);
- the refusal and write budgets of C002-NFR-101 and C002-NFR-102, measured after start.

Out of scope: the tool behaviour (C002-IF-002 §5), argument validation (C002-OA-006) and the build of
the bundle (C002-OA-008).

## Criteria

| Criterion | Weight |
|---|---|
| Host protocol conformance | 30% |
| Contract fidelity | 25% |
| Low implementation and maintenance effort | 20% |
| Testability over stdio | 15% |
| Small bundled surface | 10% |

- **Host protocol conformance:** version negotiation, framing and lifecycle follow what the two
  hosts send at their tested versions and keep doing so across MCP revisions.
- **Contract fidelity:** the schemas served are the contract's, and the error codes, ordering and
  stdout discipline of C002-IF-002 §1 and §4 hold without workarounds.
- **Low implementation and maintenance effort:** code to write and keep in step with MCP.
- **Testability over stdio:** the replay adapter (C002-COMP-008), the bench of C002-NFR-101 and the
  smoke test of C002-IF-003 §4 can drive the process as a host does.
- **Small bundled surface:** code bundled into `sdd-mcp.mjs` and listed in its notices.

## Candidates

Only four genuinely different bindings exist; further variants (SDK versions, wrapper layers) collapse
into A or C.

- **A — SDK low-level server:** the official TypeScript SDK's low-level `Server` class with its stdio
  server transport; request handlers for `tools/list` and `tools/call`; the contract schemas served as
  written (references inlined); a FIFO queue in front of `tools/call`.
- **B — SDK high-level server:** the SDK's `McpServer` with `registerTool` and zod input shapes; the
  served JSON Schemas are generated from the zod shapes.
- **C — SDK transport and message types only:** the SDK's stdio transport and its message schemas,
  with an in-repository dispatcher for `initialize`, `ping`, `tools/list`, `tools/call` and
  notifications.
- **D — Hand-rolled JSON-RPC:** line-delimited JSON-RPC 2.0 over stdio and the MCP lifecycle written
  in the repository, without the SDK.

## Scores

| Candidate | Host protocol conformance | Contract fidelity | Low implementation and maintenance effort | Testability over stdio | Small bundled surface | Weighted |
|---|---|---|---|---|---|---|
| A — SDK low-level server | 5 | 4 | 4 | 5 | 3 | 4.35 |
| B — SDK high-level server | 5 | 2 | 4 | 5 | 3 | 3.85 |
| C — SDK transport and message types only | 3 | 5 | 3 | 5 | 4 | 3.90 |
| D — Hand-rolled JSON-RPC | 2 | 5 | 2 | 5 | 5 | 3.50 |

- **A:** *Conformance 5:* the SDK negotiates protocol versions and handles the lifecycle, as
  C002-IF-002 §4 states. *Fidelity 4:* handlers return the contract schemas verbatim, but two points
  need code on top of the SDK: requests are dispatched concurrently, so a queue serialises
  `tools/call`; and where the transport only reports an unparsable line through its error callback,
  the server writes the `-32700`/`-32600` response itself. *Effort 4:* two handlers plus the queue.
  *Testability 5:* a plain stdio process. *Surface 3:* the SDK and its schema library (zod; Ajv in
  recent versions) are bundled, all under allowlisted licences.
- **B:** *Fidelity 2:* the served schemas are generated from zod, not taken from the contract, and
  the schema exists twice. Other scores as A.
- **C:** *Conformance 3:* version negotiation and lifecycle rules are ours to track across MCP
  revisions. *Fidelity 5:* full control of ordering and error codes. *Effort 3.* *Surface 4:* the
  transport and types only.
- **D:** *Conformance 2:* every MCP revision is ours to follow, for two hosts. *Effort 2.* *Surface 5:*
  nothing bundled.

## Sensitivity

A leads C by 0.45. Moving 15 points from "Host protocol conformance" to "Contract fidelity" (15% and
40%) brings them level; that would value our own control over the hosts' acceptance, which is the
opposite of the risk this server carries (two hosts, tested versions, C002-AS-01, C002-AS-03). If the
SDK turns out to answer malformed input correctly, A's fidelity rises to 5 and its lead grows. B and D
stay excluded whatever the weights (Rejected).

## Presented

1. A — SDK low-level server (Recommended)
2. C — SDK transport and message types only

## Recommendation

**A — SDK low-level server.** It keeps the negotiation the hosts depend on in the SDK while the
contract schemas, ordering and error codes stay under the server's control.

## Rejected

- B — SDK high-level server: serves zod-derived schemas instead of the contract's (C002-IF-002 §4)
  and keeps a second definition of every tool schema.
- D — Hand-rolled JSON-RPC: contradicts C002-IF-002 §4 (the bundled MCP SDK negotiates the protocol
  versions), so it would need a revision of the approved spec; no requirement asks for it, because
  bundling already meets C002-NFR-402 and C002-CON-11.
