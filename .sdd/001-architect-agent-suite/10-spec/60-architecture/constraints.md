---
id: C001-SPEC-CONSTRAINTS
artifact: spec/constraints
change: CHG-001
phase: 10-spec
status: draft
---

# C001 — Architecture constraints

Scope constraints C001-CON-01 … C001-CON-10 are defined in `../10-context/scope.md`. The
constraints below bind the architecture.

| ID | Constraint | Source | Affects |
|---|---|---|---|
| C001-CON-11 | One conductor session writes a given change at a time; the CLI does not implement file locking, and concurrent writers are unsupported | IDEA-§21 (single user), decision recorded here; revisit if team use arrives (P-03) | C001-COMP-01, C001-COMP-03 |
| C001-CON-12 | All CLI logic runs in a single Node process per invocation, with no daemon or background service | C001-CON-02; C001-NFR-103 (start-up budget) | C001-COMP-07, C001-COMP-08 |
| C001-CON-13 | Lint rules are pure functions of the parsed workspace graph (no I/O inside rules) | C001-NFR-503, C001-NFR-302 | C001-COMP-04 |
| C001-CON-14 | Only the CLI writes `registry.json`, `ids.json`, `approvals.json` and the SDD.md status block; agents never edit them directly | OA-03 (derived index) | C001-COMP-02, C001-COMP-03, C001-COMP-05 |
| C001-CON-15 | Phase procedures exist once, in phase skills; commands and the conductor reference them | OA-01 option C | C001-COMP-01, C001-COMP-09, C001-COMP-10 |
| C001-CON-16 | The plugin lives under `plugins/architect/` so development files are not installed | C001-IF-08 §1 rationale | C001-COMP-11, C001-COMP-12 |
