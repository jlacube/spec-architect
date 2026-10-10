---
id: "{{P}}-SPEC"
artifact: spec/lite
change: "{{CHANGE}}"
phase: 10-spec
status: draft
---
# {{CHANGE}} — Specification (lite)

<!-- Guidance: a lite change covers exactly one capability; IDs follow the same scheme as a full change. -->

## Context

## Stories

### {{P}}-US-101 — {{NAME}}
- **As a** P-01
- **I want**
- **So that**
- **Value / outcome:**
- **Priority:** Must · **Size hint:** S · **Capability:** {{P}}-CAP-01
- **Requirements:**
- **Traces to:**

## Requirements

### {{P}}-REQ-101 — {{NAME}}
- **Pattern:** ubiquitous
- **Statement:** THE <system> SHALL <observable outcome>.
- **Rationale:**
- **Stories:** {{P}}-US-101
- **Priority:** Must
- **Acceptance:** {{P}}-AC-101.1

## Acceptance

#### {{P}}-AC-101.1 — {{NAME}}
```gherkin
Scenario: {{P}}-TS-101 — {{NAME}}
  Given <precondition>
  When <single action>
  Then <observable result>
```

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| {{P}}-REQ-101 | TS-101 | n/a | n/a | n/a | n/a | n/a | n/a |

## NFRs

## Domain notes

## Interfaces

## Architecture notes
