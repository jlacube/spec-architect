## {{host_name}} wiring

- Ask a round with one call of the `question` tool: `questions` holds 1–4 items, never more (a
  topic with more questions takes further rounds); each has `question`, `header`, `multiple` (false
  unless several options can hold at once) and `options` (2–3 items of `label` and `description`).
- The `header` names the topic in at most 12 characters (section 3) and never more than 30, the
  tool's limit, which {{host_name}} does not check: shorten a long topic to its key words.
- Every option has a non-empty `description`, which carries the one-sentence rationale; a call with
  an option without one fails. The tool has no recommended flag: the first option's label carries
  ` (Recommended)`.
- The tool's answer gives, per question, the chosen label or P-01's typed text
  (`"<question>"="<answer>"`); log that value verbatim.
- A result without a choice of P-01 is no answer: the call dismissed (`The user dismissed this
  question`), an empty answer list, or no answer for a question. Record no answer for the questions
  of that call (the log keeps them unanswered), never assume the recommended option, say that no
  answer was received, and do not continue the step that needs them (no change folder, no command
  that depends on the answer); the questions stay open and are asked again when the step resumes.
- Specialists have no question tool; they return questions blocks (the return contract in the
  sdd-conventions skill).
