---
name: ears-requirements
description: Writing functional requirements in EARS form for an SDD spec — the six patterns, the singularity rule, the requirement entry fields, delta tagging for brownfield changes, weak words to avoid and clarification markers. Use whenever writing or reviewing requirements.
---

# EARS requirements

A requirement states one observable behaviour of one system, testably, without design detail.

## Patterns

| Pattern | Shape | Use when |
|---|---|---|
| ubiquitous | `THE <system> SHALL <response>.` | always true, no trigger |
| event-driven | `WHEN <trigger>, THE <system> SHALL <response>.` | a discrete event starts it |
| state-driven | `WHILE <state>, THE <system> SHALL <response>.` | it holds during a state |
| unwanted-behaviour | `IF <condition>, THEN THE <system> SHALL <response>.` | errors, faults, misuse |
| optional-feature | `WHERE <feature or configuration>, THE <system> SHALL <response>.` | only with a feature or profile |
| complex | `WHILE …, WHEN …, THE <system> SHALL …` (two or more prefixes) | state and event together |

- Keywords in capitals; `SHALL NOT` for prohibitions.
- `<system>` is a name from the glossary (system names or component names). A new system name
  goes into `40-domain/glossary-delta.md` first (otherwise LINT-EARS-003 warns).
- **Singularity:** exactly one `SHALL` per statement, describing one observable outcome. Grouped
  actions verified together are one outcome; actions that can succeed or fail independently
  are separate requirements.
- Measurable words: numbers with units, named formats, named states. No weak words: fast,
  quick(ly), easy/easily, simple, flexible, robust, user-friendly, intuitive, appropriate,
  adequate, sufficient, efficient, seamless, optimal, minimal, maximal, several, various, some,
  etc, and/or, normally, usually, typically, approximately; phrases "as needed", "if possible",
  "as appropriate", "where possible", "as soon as possible", "state of the art", and "support
  for" without a named interface or format (LINT-WORD-001).
- No design: say what is observable at the system boundary, not which class or table does it.

## Entry format

```markdown
### C004-REQ-012 — Apply a percentage coupon
- **Delta:** ADDED | MODIFIED C004-… | REMOVED C004-… | RENAMED C004-…   (non-greenfield only)
- **Pattern:** event-driven
- **Statement:** WHEN a customer applies a valid coupon code at checkout, THE checkout SHALL reduce the order total before tax by the coupon's percentage.
- **Rationale:** <why; ideation section, DEC or research note ID>
- **Stories:** C004-US-001
- **Priority:** Must | Should | Could | Won't
- **Acceptance:** C004-AC-012.1
- **Evidence:** <cartographer evidence ID or path:line>   (MODIFIED / REMOVED only)
- **Open items:** <optional>
```

- IDs: `C<NNN>-REQ-<cap><seq>` within the capability's block (CAP-01 → REQ-101…; allocate with
  `sdd id next REQ --change <NNN> --block <nn>` or use the IDs the brief gives).
- Acceptance IDs derive from the requirement: `AC-<req-seq>.<n>`; the test-designer writes them.
- **Delta (brownfield or mixed changes):** every requirement carries a Delta. Anything other
  than `ADDED` cites the full ID of the living-spec requirement it alters and the cartographer
  evidence for the current behaviour.

## When you lack information

Do not guess. Write `[NEEDS CLARIFICATION: Q-<topic>-<nn>]` where the missing value goes (for
example in a threshold or a statement) and return the question with that ID in your `questions`
block (return contract, sdd-conventions skill). Use the topic of the phase when none fits
better (`Q-spec-03`).

## Anti-patterns

| Instead of | Write |
|---|---|
| "THE system SHALL be fast" | an NFR with a metric and threshold |
| "THE API SHALL validate and store the booking" (two independent outcomes) | two requirements |
| "WHEN the user clicks Save in the React form …" (UI design) | "WHEN the user submits the booking …" |
| "… SHALL handle errors appropriately" | an unwanted-behaviour requirement naming the error and the response |
