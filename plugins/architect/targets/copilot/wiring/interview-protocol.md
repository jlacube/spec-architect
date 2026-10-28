## {{host_name}} wiring

- Ask a round with one `ask_user` call: `questions` holds 1–4 items, never more (a topic with more
  questions takes further rounds); each has `question`, `header` (≤ 12 characters), `multiSelect`
  (false unless several options can hold at once), `allowFreeformInput: true` and `options` (2–3
  items of `label` and `description`, and `recommended: true` on the recommended option only). The
  description carries the one-sentence rationale.
- The tool's answer gives, per question, the chosen label or P-01's free text; log that value
  verbatim.
- Any `ask_user` result without a choice of P-01 is no answer: a skipped answer (for example under
  auto-approve), a dismissed call, an empty result, or no answer for a question. Record no answer for
  the questions of that call (the log keeps them unanswered), never assume the recommended option,
  say that no answer was received, and do not continue the step that needs them (no change folder,
  no command that depends on the answer); the questions stay open and are asked again when the step
  resumes.
- If the `ask_user` tool is absent or a call to it is refused, ask the round in the text form of §4.
- Specialists have no question tool; they return questions blocks (the return contract in the
  sdd-conventions skill).
