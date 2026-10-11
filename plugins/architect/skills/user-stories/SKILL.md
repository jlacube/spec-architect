---
name: user-stories
description: Writing user stories and capability folders for an SDD spec — capability split, the story entry fields, INVEST checks, personas, the navigation-only index, the domain model, state machines and the glossary delta. Use when deriving capabilities and stories from an approved ideation, or writing 00-index and 40-domain.
---

# User stories, capabilities and domain

## Capabilities

- Derive capabilities from the approved ideation (goals, scope boundary, design direction). One
  capability = one cohesive area of behaviour a user would name ("billing", "notifications").
- **Full profile:** one folder per capability, `10-spec/20-capabilities/CAP-<nn>-<slug>/`, each
  with `stories.md`, `requirements.md` and `acceptance.md` (start from the plugin templates;
  `acceptance.md` keeps its template until the test-designer fills it). Numbering from 01 in
  the order of the ideation. **Lite profile:** one capability, sections of `spec.md`.
- ID blocks follow the capability number: CAP-03 → `US-3nn`, `REQ-3nn`.

## Story entry

```markdown
### C004-US-101 — Apply a coupon at checkout
- **As a** C004-P-02 customer
- **I want** to enter a coupon code at checkout
- **So that** my order is discounted
- **Value / outcome:** campaigns without manual refunds
- **Priority:** Must · **Size hint:** S · **Capability:** C004-CAP-01
- **Context & notes:** <constraints, decisions (DEC IDs), edge cases worth knowing>
- **Out of scope:** <neighbouring feature excluded, when there is one>
- **Requirements:** C004-REQ-101, C004-REQ-102
- **Traces to:** <ideation section, Q-ID or DEC-ID>
```

- Personas are `P-<nn>` from `10-context/stakeholders-and-personas.md`.
- Priority is MoSCoW; size hint S/M/L.
- **INVEST:** independent, negotiable, valuable, estimable, small, testable. Split a story that
  needs more than about five requirements or mixes personas.

## Index (`10-spec/00-index.md`) — navigation only

Reading order; the file list with one line of purpose each; the capability list with ID blocks;
ID counts per type. Nothing else: no summaries of requirements, no rationale paragraphs (link
the artifact instead).

## Domain (`40-domain/`)

- **domain-model.md** — one section per entity:
  - **Attributes:** `name` (type, constraints) for each;
  - **Relationships:** to other entities, with cardinality;
  - **Owning component:** the `COMP-` that owns it;
  - **Invariants:** `INV-<seq>` statements, or "Invariants: none (<reason>)".
- **state-machines.md** — for every entity with more than two lifecycle states: a Mermaid
  `stateDiagram-v2` block and a transition table with the columns from, event, guard, to,
  effect, one row per arrow of the diagram (no arrow without a row, no row without an arrow).
- **glossary-delta.md** — every term or system name the spec introduces that is absent from
  `_constitution/glossary.md`: term, definition, and (for system names) the component. Add a
  system name before using it in an EARS statement.
