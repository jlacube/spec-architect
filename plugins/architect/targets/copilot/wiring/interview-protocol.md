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
- When the `ask_user` tool is not available, ask nothing, not even in the chat: create no change
  folder and run no command that needs P-01's answer. Reply that the question tool `ask_user` is
  missing and name the step of `INSTALL.md` that makes it available: step 2
  (`sdd install copilot --package <folder>`, which writes `.github/agents/sdd-conductor.agent.md`
  with `ask_user` in its tools) and step 3 (the setting `chat.askQuestions.enabled`: `true`).
- Specialists have no question tool; they return questions blocks (the return contract in the
  sdd-conventions skill).
