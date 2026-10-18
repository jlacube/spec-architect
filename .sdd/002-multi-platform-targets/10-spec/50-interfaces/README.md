---
id: C002-SPEC-IF
artifact: spec/interfaces-registry
change: CHG-002
phase: 10-spec
status: draft
---

# C002 — Interface registry

Interfaces added or changed by CHG-002. The CHG-001 interfaces (C001-IF-01 … C001-IF-14,
`.sdd/001-architect-agent-suite/10-spec/50-interfaces/`) stay in force; C002-IF-007 and
C002-IF-008 are deltas to C001-IF-01 and C001-IF-07, C002-IF-006 extends C001-IF-10 §3, and
C002-IF-005 §6 adds checks next to C001-IF-08 §3. Components: `../60-architecture/architecture.md`.

| ID | Interface | Kind | Files | Provider | Consumers | Serves |
|---|---|---|---|---|---|---|
| C002-IF-001 | Target mapping table (translation table) and wiring variants | JSON document + conventions | `mapping-table.schema.json`, `mapping-tables.md` | C002-COMP-002 | C002-COMP-001, C002-COMP-007, C002-COMP-010 | C002-REQ-103 … C002-REQ-106, C002-REQ-108, C002-REQ-111 … C002-REQ-118, C002-REQ-206, C002-REQ-207, C002-REQ-211, C002-REQ-216, C002-REQ-217, C002-REQ-317, C002-REQ-321, C002-REQ-326, C002-REQ-508, C002-REQ-620 |
| C002-IF-002 | sdd MCP server: process, protocol and tools | MCP over stdio (JSON-RPC 2.0) + JSON Schemas | `sdd-mcp-server.md`, `sdd-mcp-tools.schema.json` | C002-COMP-005 | OpenCode and VS Code hosts (C002-COMP-003, C002-COMP-004 declare it), C002-COMP-008, C002-COMP-009 | C002-REQ-401 … C002-REQ-411, C002-REQ-415, C002-REQ-210, C002-REQ-307, C002-REQ-323, C002-REQ-517 |
| C002-IF-003 | `architect-sdd` npm package | Package manifest conventions | `architect-sdd-package.md` | C002-COMP-006 | P-01 (publish), P-03 (install), C002-COMP-003, C002-COMP-004 | C002-REQ-412 … C002-REQ-414, C002-REQ-501, C002-REQ-502, C002-REQ-512, C002-REQ-518, C002-REQ-519 |
| C002-IF-004 | Generator CLI (`npm run generate`, used by `npm run package` and `npm run check`) | CLI | `generator-cli.md` | C002-COMP-001 | C002-COMP-013, C002-COMP-007, C002-COMP-010, P-01 | C002-REQ-101, C002-REQ-102, C002-REQ-104, C002-REQ-112, C002-REQ-601 |
| C002-IF-005 | Target package contracts (OpenCode, Copilot VS Code: plugin part and install sources) and target structure checks | Conventions | `target-packages.md` | C002-COMP-001 (writes), C002-COMP-003, C002-COMP-004 | OpenCode, VS Code, Copilot CLI, C002-COMP-007, C002-COMP-018 (install command), P-03 | C002-REQ-107, C002-REQ-108, C002-REQ-110, C002-REQ-113, C002-REQ-114, C002-REQ-117, C002-REQ-201 … C002-REQ-210, C002-REQ-216, C002-REQ-217, C002-REQ-301 … C002-REQ-309, C002-REQ-313 … C002-REQ-319, C002-REQ-321 … C002-REQ-323, C002-REQ-326, C002-REQ-327, C002-REQ-602 … C002-REQ-605 |
| C002-IF-006 | Doctor host rows (extends C001-IF-10 §3) | Commands | `doctor-host-rows.md` | C002-COMP-015, C002-COMP-016 | P-01, P-03 | C002-REQ-116, C002-REQ-504 … C002-REQ-510 |
| C002-IF-007 | sdd CLI additions (delta to C001-IF-01), including the Copilot install command | CLI | `sdd-cli-delta.md` | C002-COMP-018 | agents on every target, hooks of C002-COMP-004, C002-COMP-005, the doctor, P-03 (`install copilot`), C002-COMP-009 | C002-REQ-114, C002-REQ-308, C002-REQ-309, C002-REQ-313, C002-REQ-315, C002-REQ-320, C002-REQ-322, C002-REQ-323, C002-REQ-324, C002-REQ-326, C002-REQ-327 … C002-REQ-330, C002-REQ-501, C002-REQ-508, C002-REQ-509, C002-REQ-511 … C002-REQ-517, C002-REQ-520 |
| C002-IF-008 | Hooks contract delta: allowlist rows, Serena-command confinement, writing subcommands and their `--cwd` confinement (the install command denied), and Copilot hook input keyed by `agent_type`, decided by the Copilot subagent guard hook in both modes and by the Copilot guard hook under the fallback (delta to C001-IF-07) | Hook protocol | `hooks-contract-delta.md` | C002-COMP-012 | Claude Code, VS Code, Copilot CLI, C002-COMP-005, C002-COMP-008 | C002-REQ-207, C002-REQ-302, C002-REQ-308, C002-REQ-309, C002-REQ-313 … C002-REQ-316, C002-REQ-318, C002-REQ-319, C002-REQ-320, C002-REQ-325, C002-REQ-326, C002-REQ-327 … C002-REQ-330, C002-REQ-503, C002-REQ-517, C002-REQ-521, C002-REQ-607 |
| C002-IF-009 | Verification records: replay report, checklist record, spike record, release record | JSON document + Markdown conventions | `verification-records.md`, `release-record.schema.json` | C002-COMP-008, C002-COMP-009, C002-COMP-010, C002-COMP-011 | C002-COMP-010, P-01 | C002-REQ-108, C002-REQ-606, C002-REQ-613 … C002-REQ-622, C002-REQ-625 … C002-REQ-629, C002-REQ-630, C002-REQ-632, C002-REQ-633, C002-REQ-634 |
| C002-IF-010 | Eval runner contract (host back ends behind the case API) | Conventions | `eval-runner.md` | C002-COMP-009 | `evals/` cases, C002-COMP-010 | C002-REQ-608 … C002-REQ-612, C002-REQ-628 |

Error and rule codes of these interfaces: `errors.md`.
