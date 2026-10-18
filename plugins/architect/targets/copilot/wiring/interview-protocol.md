## {{host_name}} wiring

- Ask a round with one `ask_user` call: `questions` holds 1–4 items; each has `question`, `header`
  (≤ 12 characters), `multiSelect` (false unless several options can hold at once),
  `allowFreeformInput: true` and `options` (2–3 items of `label` and `description`, and
  `recommended: true` on the recommended option only). The description carries the one-sentence
  rationale.
- The tool's answer gives, per question, the chosen label or P-01's free text; log that value
  verbatim. A result without a choice (skipped, dismissed or empty) is no answer: ask again or
  leave the question open, never assume the recommended option.
- When the `ask_user` tool is not available, ask nothing: name the missing tool and the step of
  `INSTALL.md` that makes it available.
- Specialists have no question tool; they return questions blocks (the return contract in the
  sdd-conventions skill).
