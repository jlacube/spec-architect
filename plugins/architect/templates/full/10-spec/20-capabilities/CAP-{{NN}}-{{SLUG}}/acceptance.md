---
id: "{{P}}-CAP-{{NN}}"
artifact: spec/acceptance
change: "{{CHANGE}}"
phase: 10-spec
status: draft
capability: "{{NAME}}"
---
# {{P}}-CAP-{{NN}} — Acceptance criteria and scenarios

## {{P}}-REQ-{{B}}01

#### {{P}}-AC-{{B}}01.1 — {{NAME}}
```gherkin
Scenario: {{P}}-TS-{{B}}01 — {{NAME}}
  Given <precondition>
  When <single action>
  Then <observable result>
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| {{P}}-REQ-{{B}}01 | TS-{{B}}01 | n/a | n/a | n/a | n/a | n/a | n/a |

<!-- Guidance: every cell holds TS IDs, "n/a: reason", or n/a with a per-column reason in a note below the table (C001-IF-03 §7). -->
