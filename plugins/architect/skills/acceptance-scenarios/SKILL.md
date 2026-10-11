---
name: acceptance-scenarios
description: Writing acceptance criteria and Gherkin scenarios for SDD requirements — AC and TS numbering, scenario quality, the coverage table (happy, alternate, boundary, error, authorization, concurrency/idempotency, abuse) and n/a reasons. Use when writing acceptance.md or the Acceptance section of a lite spec.
---

# Acceptance scenarios

Every requirement gets at least one acceptance criterion (AC); every AC gets at least one
scenario (TS). The coverage table shows which kinds of situations are covered.

## Numbering

- Under a `## C<NNN>-REQ-<seq>` section: `#### C<NNN>-AC-<seq>.<n> — <title>` (n from 1). The AC
  number derives from the requirement; it is not allocated.
- Directly after each AC: one or more fenced `gherkin` blocks; each `Scenario:` or `Scenario
  Outline:` title starts with a TS ID: `Scenario: C<NNN>-TS-<seq> — <title>`. Allocate TS
  numbers with `sdd id next TS --change <NNN>` (or use the brief's).
- An AC without a gherkin block is an error (TR-03); a requirement without an AC too (TR-02).

## Scenario quality

- Given (state), When (exactly one action or event), Then (one or more observable outcomes),
  And for more of the same step. Concrete values: "an order of 100 EUR", not "an order".
- Observable at the system boundary: outputs, files, messages, exit codes; not internal calls.
- One behaviour per scenario. Use a Scenario Outline with an Examples table for variations of
  the same rule.
- Errors name the error code or message and the state afterwards ("the total is unchanged").

## Coverage table

At the end of each capability's `acceptance.md`, one row per requirement and these columns:

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C004-REQ-012 | TS-012 | TS-013 | TS-014 | TS-015 | n/a: no roles in v1 | n/a: single request | TS-016 |

- Each cell: the covering TS IDs, or `n/a: <reason>`, or `n/a` when a note directly below the
  table gives the reason for that column. Never empty (LINT-COV-002); never omit a requirement
  (LINT-COV-001).
- Prefer a real scenario for error and abuse whenever the requirement can fail or be misused;
  `n/a` needs a reason a reviewer would accept.
