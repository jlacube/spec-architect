---
id: C001-SPEC-INDEX
artifact: spec/index
change: CHG-001
phase: 10-spec
status: approved
---

# C001 — Specification index

## Reading order

1. `10-context/` — problem and goals, personas, scope, current state
2. `20-capabilities/` — CAP-01 … CAP-11, each read as stories → requirements → acceptance
3. `30-nfr/nfr.md`
4. `40-domain/` — domain model, state machines, glossary delta
5. `50-interfaces/` — start with `README.md` (interface registry)
6. `60-architecture/` — architecture, constraints
7. `70-dod.md`
8. `80-traceability.md` (generated), `85-open-items.md` (generated), `90-critic-report.md`

## Files

| File | Purpose |
|---|---|
| `10-context/problem-and-goals.md` | Problem statement, goals (GOAL), success criteria (SC), non-goals |
| `10-context/stakeholders-and-personas.md` | Personas P-01 … P-05 and stakeholder map |
| `10-context/scope.md` | In/out of scope, assumptions (AS), scope constraints (CON-01 … 10), dependencies |
| `10-context/current-state.md` | Greenfield baseline of this repository |
| `20-capabilities/CAP-*/stories.md` | User stories (US) |
| `20-capabilities/CAP-*/requirements.md` | EARS requirements (REQ) |
| `20-capabilities/CAP-*/acceptance.md` | Acceptance criteria (AC), scenarios (TS), coverage table |
| `30-nfr/nfr.md` | Non-functional requirements (NFR) by category |
| `40-domain/domain-model.md` | Entities, attributes, invariants (INV) |
| `40-domain/state-machines.md` | Phase, change, task, defect lifecycles; implementation-status derivation |
| `40-domain/glossary-delta.md` | Domain terms and EARS system names |
| `50-interfaces/README.md` | Interface registry (IF-01 … IF-14) |
| `50-interfaces/sdd-cli.md` | CLI contract (IF-01) |
| `50-interfaces/registry.schema.json` | Registry schema (IF-02) |
| `50-interfaces/artifact-frontmatter.md` | Frontmatter and entry formats (IF-03) |
| `50-interfaces/id-scheme.md` | IDs, EARS shapes, weak words, traceability rules (IF-04) |
| `50-interfaces/questions.schema.json`, `questions.md` | Interview questions contract and field rules (IF-05) |
| `50-interfaces/workspace-layout.md` | Full and lite layouts (IF-06) |
| `50-interfaces/hooks-contract.md` | Hooks and Bash allowlist (IF-07) |
| `50-interfaces/plugin-layout.md` | Plugin tree, manifests, structure checks (IF-08) |
| `50-interfaces/agents.md` | Agent frontmatter contract (IF-09) |
| `50-interfaces/commands.md` | Commands and doctor remedies (IF-10) |
| `50-interfaces/reports.md`, `lint-report.schema.json` | Lint and critic reports, readiness checklist (IF-11) |
| `50-interfaces/trace.schema.json` | Trace graph (IF-12) |
| `50-interfaces/gate.md` | Gate summary and approval hash (IF-13) |
| `50-interfaces/external-tools.md` | Third-party tool usage contract (IF-14) |
| `50-interfaces/errors.md` | Error, warning, lint, guard codes |
| `60-architecture/architecture.md` | Context, component catalogue (COMP-01 … 13), flows, views, diagrams |
| `60-architecture/constraints.md` | Architecture constraints (CON-11 … 16) |
| `70-dod.md` | Global (DOD-G) and feature (DOD-001 … 021) definition of done |

## Capabilities and ID blocks

| Capability | Folder | US | REQ | AC | TS |
|---|---|---|---|---|---|
| C001-CAP-01 Workspace, registry, identifiers | `CAP-01-workspace` | 101–108 (8) | 101–127 (27) | 33 | 101–133 (33) |
| C001-CAP-02 Conductor and interview | `CAP-02-conductor` | 201–209 (9) | 201–222 (22) | 25 | 201–226 (26) |
| C001-CAP-03 Ideation | `CAP-03-ideation` | 301–308 (8) | 301–318 (17; 308 tombstoned) | 20 | 301–320 (20) |
| C001-CAP-04 Specification authoring | `CAP-04-specification` | 401–409 (9) | 401–422 (22) | 24 | 401–424 (24) |
| C001-CAP-05 Architecture, interfaces, diagrams | `CAP-05-architecture` | 501–507 (7) | 501–516 (13; 504–506 tombstoned) | 13 | 501–516 (13; 504–506 tombstoned) |
| C001-CAP-06 Planning and hand-off | `CAP-06-planning` | 601–608 (8) | 601–618 (18) | 22 | 601–622 (22) |
| C001-CAP-07 Quality | `CAP-07-quality` | 701–705 (5) | 701–720 (20) | 20 | 701–720 (20) |
| C001-CAP-08 Gates and revisions | `CAP-08-gates` | 801–806 (6) | 801–817 (17) | 19 | 801–819 (19) |
| C001-CAP-09 Tracking and archive | `CAP-09-tracking-archive` | 901–906 (6) | 901–924 (24) | 25 | 901–925 (25) |
| C001-CAP-10 Code intelligence | `CAP-10-code-intelligence` | 1001–1005 (5) | 1001–1013 (13) | 14 | 1001–1015 (15) |
| C001-CAP-11 Packaging, safety, environment | `CAP-11-packaging-safety` | 1101–1109 (9) | 1101–1124 (23; 1105 tombstoned) | 24 | 1101–1126 (25; 1106 tombstoned) |
| **Total** | | **80** | **216** | **239** | **242** |

Other IDs: GOAL 8 · SC 10 · NG 2 (plus IDEA-NG-01 … 06) · AS 4 (plus IDEA-AS-01 … 08) · CON 16 ·
NFR 27 · INV 24 · IF 14 · COMP 13 · DOD 21 (+ DOD-G 7).
