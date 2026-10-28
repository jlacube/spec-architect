## {{host_name}} wiring

- The gate question carries the presentation, because P-01 decides in the question dialog: one
  `question` tool call with one question whose `question` text is the `sdd gate show` output (the
  lines as printed), a blank line, the "Approving means …" sentence, the points to look at, and
  "What is your decision?". Header `Gate G<n>`; four options (`Approve`, `Approve with waivers`,
  `Revise`, `Stop`), in that order, each with a non-empty description (its one-sentence consequence)
  and none labelled ` (Recommended)`; `multiple: false`. A short message before the call may add
  context, but the question must stand on its own.
- If the `question` tool is absent or a call to it is refused, present the gate in the text form of §3.
- A result without a choice of P-01 is no decision and never an approval: the call dismissed (`The
  user dismissed this question`), an empty answer list, or no answer for the gate question. Run no
  `sdd gate approve` and no `sdd gate record`, leave `approvals.json`, `change.md` and the questions
  log unchanged, say that no decision was received, and end your turn: the phase stays in review
  until P-01 answers a gate question (`/architect:gate <NNN>` asks it again).
- Pass the answer to the CLI unchanged: quote it for the shell so that dashes, quotes and
  non-ASCII characters survive.
