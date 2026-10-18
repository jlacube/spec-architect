## {{host_name}} wiring

- The gate question carries the presentation, because P-01 decides in the question dialog: one
  `ask_user` call with one question whose `question` text is the `sdd gate show` output (the lines
  as printed), a blank line, the "Approving means …" sentence, the points to look at, and "What is
  your decision?". Header `Gate G<n>`; four options (`Approve`, `Approve with waivers`, `Revise`,
  `Stop`), each with its description and none marked `recommended`; `multiSelect: false`. A short
  message before the call may add context, but the question must stand on its own.
- A result without a choice is no decision and never an approval: ask the gate question again.
- Pass the answer to the CLI unchanged: quote it for the shell so that dashes, quotes and
  non-ASCII characters survive.
