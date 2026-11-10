---
id: "C004-SPEC"
artifact: spec/lite
change: "CHG-004"
phase: 10-spec
status: draft
---
# CHG-004 — Specification (lite)

<!-- Guidance: a lite change covers exactly one capability; IDs follow the same scheme as a full change. -->

## Context

## Stories

### C004-US-101 — Cost and token efficiency
- **As a** P-01
- **I want**
- **So that**
- **Value / outcome:**
- **Priority:** Must · **Size hint:** S · **Capability:** C004-CAP-01
- **Requirements:**
- **Traces to:**

## Requirements

### C004-REQ-101 — Cost and token efficiency
- **Pattern:** ubiquitous
- **Statement:** THE <system> SHALL <observable outcome>.
- **Rationale:**
- **Stories:** C004-US-101
- **Priority:** Must
- **Acceptance:** C004-AC-101.1

## Acceptance

#### C004-AC-101.1 — Cost and token efficiency
```gherkin
Scenario: C004-TS-101 — Cost and token efficiency
  Given <precondition>
  When <single action>
  Then <observable result>
```

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C004-REQ-101 | TS-101 | n/a | n/a | n/a | n/a | n/a | n/a |

## NFRs

## Domain notes

## Interfaces

## Architecture notes
