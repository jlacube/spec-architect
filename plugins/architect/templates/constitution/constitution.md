---
id: CONSTITUTION
artifact: constitution
status: draft
version: 1
updated: "{{DATE}}"
---
# Constitution

<!-- Guidance: drafted by /architect:init in at most two interview rounds; approved at gate G0
(`/architect:gate constitution`). Every change inherits these rules. -->

## Principles

<!-- 3–7 numbered principles that decide trade-offs, e.g. "Prefer reversible decisions". -->

## Quality bar

<!-- What "good enough" means for specs and code here: review rules, test levels required. -->

## NFR defaults

<!-- Default thresholds a change inherits unless its spec says otherwise (performance,
security, accessibility, …), each with a metric. -->

## Global DoD

| ID | Statement | Evidence type |
|---|---|---|
| DOD-G-01 | <!-- e.g. All automated tests pass in CI --> | test-report |

## Forbidden technologies

<!-- Technologies, licences or services changes must not introduce, with the reason. -->

## Profile thresholds

A change is proposed as **lite** when all of these hold; otherwise **full**:

| Measure | Lite when |
|---|---|
| Expected user stories | ≤ 3 |
| Expected requirements | ≤ 10 |
| Touched modules | ≤ 2 |

## Version control

| Setting | Value |
|---|---|
| Commit `.sdd/` at each gate approval | no |

<!-- yes: the conductor approves with `sdd gate approve … --commit`, which commits only the change folder,
`.sdd/SDD.md` and `.sdd/registry.json` (message "CHG-<NNN>: <gate> approved by <approver>"); refused when
other changes are staged. no: you commit yourself. -->

## Language & conventions

<!-- Spec language, naming conventions, code style references, glossary location. -->
