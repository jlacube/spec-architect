---
id: C002-T-016
title: "sdd MCP server: protocol binding, profiles and standard-output discipline"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-03
status: todo
depends_on: [C002-T-004, C002-T-006]
implements: [C002-REQ-410, C002-REQ-411, C002-REQ-415, C002-NFR-205]
satisfies_ac: [C002-AC-410.1, C002-AC-411.1, C002-AC-415.1]
verified_by: [C002-TS-414, C002-TS-415, C002-TS-416, C002-TS-420, C002-TS-421, C002-TS-422, C002-TC-414, C002-TC-415, C002-TC-416, C002-TC-420, C002-TC-421, C002-TC-422]
components: [C002-COMP-005]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-016 — sdd MCP server: protocol binding, profiles and standard-output discipline

## Intent

Create the server process of C002-IF-002 on the official MCP SDK's low-level server and stdio
transport (C002-ADR-001). It lists only the tools of its profile (C002-REQ-415), speaks JSON-RPC on
standard output and nothing else (C002-REQ-410), and exits 0 when the host closes standard input
(C002-REQ-411). The tool handlers are stubs here; C002-T-017 and C002-T-019 fill them.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `package.json` | `@modelcontextprotocol/sdk` as a devDependency pinned to an exact version (no range) |
| add | `src/mcp/server.ts` | low-level server, capabilities `{ tools: { listChanged: false } }`, stdio transport, `--profile files|shell`, FIFO queue of one slot for `tools/call` |
| add | `src/mcp/tools.schema.json` | the in-repository copy of `sdd-mcp-tools.schema.json` (C002-ADR-002); its pair is added to the C002-T-006 equality test |
| add | `src/mcp/schemas.ts` | Ajv 2020-12 compiled once at start; failure = fatal start error, exit 3 |
| add | `scripts/mcp-schemas.mjs` (or a build step) | writes the self-contained served schemas, with `$defs` inlined from the contract copy |
| add | `tests/integration/mcp/protocol.test.ts` | initialize, `tools/list` per profile, exit 0 on stdin close, malformed input, stdout discipline |

## Preconditions

- C002-T-004 (version source) and C002-T-006 (equality test) done.

## Step outline (no production code)

1. Pin the SDK exactly. Record its version and licence for C002-T-021.
2. Start the server with a profile. An unknown or missing profile is a start error (C002-IF-002 §1).
3. Register `tools/list` (the profile's tools only, with the served schemas) and `tools/call` (queued).
4. **Malformed input tests** (C002-ADR-001): send an unparsable line and a JSON value that is not a
   JSON-RPC message. Assert a `-32700` and a `-32600` response. Where the SDK transport only reports
   the error through its callback, the server writes that response itself.
5. **Standard-output test**: run a session with `SDD_DEBUG=1` and assert that every byte on standard
   output belongs to a JSON-RPC message, and that diagnostics go to standard error only.
6. Preload `tests/no-network.mjs` in the server tests (C002-NFR-205).

## Verification

- `npm test -- integration/mcp` and `npm test -- contracts`
- `npm run typecheck`

## Done when

- [ ] SDK pinned with an exact version; plugin bundle `scripts/sdd.mjs` does not import it (C002-CON-11)
- [ ] Malformed-message and stdout-only tests pass
- [ ] Progress reported: `sdd task set C002-T-016 --status done --commit <sha>`
