---
id: C001-SPEC-IF
artifact: spec/interfaces-registry
change: CHG-001
phase: 10-spec
status: approved
---

# C001 — Interface registry

| ID | Interface | Kind | File | Provider | Consumers | Serves |
|---|---|---|---|---|---|---|
| C001-IF-01 | sdd CLI | CLI | `sdd-cli.md` | C001-COMP-03..07 | conductor, auditor, hooks, implementers (P-02) | CAP-01, 06, 07, 08, 09 |
| C001-IF-02 | Registry document | JSON document | `registry.schema.json` | C001-COMP-03 | all agents, session-start hook, P-02, P-04 | C001-REQ-104, 105, 106 |
| C001-IF-03 | Artifact frontmatter and entry formats | Markdown conventions | `artifact-frontmatter.md` | authoring agents | sdd CLI parser, critic | CAP-01, 03, 04, 05, 06, 09, 10 |
| C001-IF-04 | ID scheme, EARS shapes, weak words, traceability rules | Conventions | `id-scheme.md` | C001-COMP-04 | all | C001-REQ-112, 113, 405, 408, CAP-07 |
| C001-IF-05 | Interview questions contract | JSON document | `questions.schema.json` | specialists, conductor | conductor, questions-log | C001-REQ-207, 208, 209 |
| C001-IF-06 | Workspace layout (full and lite) | Conventions | `workspace-layout.md` | C001-COMP-03 | all | C001-REQ-101, 108, 117, 119, 401 |
| C001-IF-07 | Hooks contract and Bash allowlist | Hook protocol | `hooks-contract.md` | C001-COMP-08 | Claude Code | C001-REQ-911, 1103–1107, 1121 |
| C001-IF-08 | Plugin layout, manifests and structure checks | Conventions | `plugin-layout.md` | C001-COMP-11, 12 | Claude Code, P-03 | C001-REQ-1101, 1102, 1117–1122 |
| C001-IF-09 | Agent definitions | Agent frontmatter | `agents.md` | C001-COMP-11 | Claude Code | CAP-02, 10, 11; C001-NFR-204 |
| C001-IF-10 | Commands and doctor remedies | Commands | `commands.md` | C001-COMP-09 | P-01 | C001-REQ-204, 315, 316, 812, 1110 |
| C001-IF-11 | Lint report, critic report, readiness checklist | JSON document + Markdown | `reports.md`, `lint-report.schema.json` | C001-COMP-04, critic | conductor, auditor, gate engine | C001-REQ-317, 702, 703, 710, 711 |
| C001-IF-12 | Trace graph | JSON document | `trace.schema.json` | C001-COMP-04 | P-04, v2 conformance checker | C001-REQ-709 |
| C001-IF-13 | Gate summary and approval hash | Conventions | `gate.md` | C001-COMP-05 | conductor, P-01 | C001-REQ-801, 806 |
| C001-IF-14 | External tools (ripwire, Serena, ast-grep, Context7, DeepWiki; Archify deferred) | External CLI / MCP | `external-tools.md` | third parties | cartographer, architect, researcher | CAP-03, 05, 10 |

Error and rule codes of all interfaces: `errors.md`.
