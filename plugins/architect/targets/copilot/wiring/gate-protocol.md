## {{host_name}} wiring

- The question tool has two names: `askQuestions` in VS Code (Local session type) and `ask_user` in
  Copilot CLI. Use the one the session offers; both take the same input.
- The gate question carries the presentation, because P-01 decides in the question dialog: one
  question-tool call with one question whose `question` text is the `sdd gate show` output (the lines
  as printed), a blank line, the "Approving means …" sentence, the points to look at, and "What is
  your decision?". Header `Gate G<n>`; four options (`Approve`, `Approve with waivers`, `Revise`,
  `Stop`), in that order, each with its description and none marked `recommended`;
  `multiSelect: false`; `allowFreeformInput: true`. A short message before the call may add
  context, but the question must stand on its own. Input shape:
  `{ "questions": [ { "header": "Gate G<n>", "question": "<presentation>", "options": [ { "label":
  "Approve", "description": "<one line>" }, … ], "multiSelect": false, "allowFreeformInput": true } ] }`.
- `askQuestions` returns `{ "answers": { "Gate G<n>": { "selected": [ "<label>" ], "freeText":
  "<text>" | null, "skipped": <boolean> } } }`. P-01's answer is the selected label followed by
  P-01's free text when there is any; with no selected label, P-01's own free text is the answer,
  verbatim, and records a decision only by the rule of §4 for an answer given as text (exactly one
  choice, by its label or its number; else present the choices again). The result of `ask_user` is
  read the same way.
- Any question-tool result without a choice of P-01 is no decision and never an approval: a
  dismissed call (closed without a choice), an empty result, `skipped: true`, no selected label and
  no free text (`freeText` null, missing or blank), or free text that is the host's auto-reply text
  "The user is not available to respond and will review your work later. Work autonomously and make
  good decisions." (VS Code sends it while the setting `chat.autoReply` is on). Run no
  `sdd gate approve` and no `sdd gate record`, leave `approvals.json`, `change.md` and the questions
  log unchanged, say that no decision was received, and end your turn: the phase stays in review
  until P-01 answers a gate question (`/architect:gate <NNN>` asks it again).
- If neither `askQuestions` nor `ask_user` is offered, or a call is refused, present the gate in the text form of §3.
- Pass the answer to the CLI unchanged: quote it for the shell so that dashes, quotes and
  non-ASCII characters survive.
