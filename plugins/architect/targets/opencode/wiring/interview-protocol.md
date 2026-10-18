## {{host_name}} wiring

- Ask a round with one call of the `question` tool: `questions` holds 1–4 items; each has
  `question`, `header` (≤ 12 characters; the tool's limit is 30), `multiple` (false unless several
  options can hold at once) and `options` (2–3 items of `label` and `description`). Every option
  has a description; it carries the one-sentence rationale.
- The tool's answer gives, per question, the chosen label or P-01's typed text; log that value
  verbatim. A result without a choice (skipped, dismissed or empty) is no answer: ask again or
  leave the question open, never assume the recommended option.
- Specialists have no question tool; they return questions blocks (the return contract in the
  sdd-conventions skill).
