## {{host_name}} wiring

- The question tool has two names: `askQuestions` in VS Code (Local session type) and `ask_user` in
  Copilot CLI. Use the one the session offers; both take the same input.
- Ask a round with one question-tool call: `questions` holds 1–4 items, never more (a topic with more
  questions takes further rounds); each has `question`, `header` (≤ 12 characters, unique in the
  call), `multiSelect` (false unless several options can hold at once), `allowFreeformInput: true`
  and `options` (2–3 items of `label` and `description`, and `recommended: true` on the recommended
  option only). The description carries the one-sentence rationale. Input shape:
  `{ "questions": [ { "header": "<short key>", "question": "<text>", "options": [ { "label": "<label>",
  "description": "<one line>", "recommended": true } ], "multiSelect": false,
  "allowFreeformInput": true } ] }`.
- `askQuestions` returns `{ "answers": { "<header>": { "selected": [ "<label>", … ], "freeText":
  "<text>" | null, "skipped": <boolean> } } }`, one entry per question, keyed by its `header`. The
  answer to a question is its selected label or labels, with P-01's free text when there is any; a
  result with no selected label (`selected: []`) and P-01's own free text is P-01's answer too: log
  that free text verbatim as the answer. Log every answer verbatim. The result of `ask_user` is read
  the same way: the chosen label or P-01's free text, per question.
- Any question-tool result without a choice of P-01 is no answer: a dismissed call (closed without a
  choice), an empty result, `skipped: true`, a question with no selected label and no free text
  (`freeText` null, missing or blank), or free text that is the host's auto-reply text "The user is
  not available to respond and will review your work later. Work autonomously and make good
  decisions." (VS Code sends it while the setting `chat.autoReply` is on). Record no answer for the
  questions of that call (the log keeps them unanswered), never assume the recommended option,
  say that no answer was received, and do not continue the step that needs them (no change folder,
  no command that depends on the answer); the questions stay open and are asked again when the step
  resumes.
- If neither `askQuestions` nor `ask_user` is offered, or a call is refused, ask the round in the text form of §4.
- Specialists have no question tool; they return questions blocks (the return contract in the
  sdd-conventions skill).
