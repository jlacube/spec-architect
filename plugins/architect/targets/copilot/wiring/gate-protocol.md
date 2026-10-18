## {{host_name}} wiring

- The gate question carries the presentation, because P-01 decides in the question dialog: one
  `ask_user` call with one question whose `question` text is the `sdd gate show` output (the lines
  as printed), a blank line, the "Approving means …" sentence, the points to look at, and "What is
  your decision?". Header `Gate G<n>`; four options (`Approve`, `Approve with waivers`, `Revise`,
  `Stop`), in that order, each with its description and none marked `recommended`;
  `multiSelect: false`; `allowFreeformInput: true`. A short message before the call may add
  context, but the question must stand on its own.
- Any `ask_user` result without a choice of P-01 is no decision and never an approval: a skipped
  answer (for example under auto-approve), a dismissed call, an empty result, or no answer for the
  gate question. Run no `sdd gate approve` and no `sdd gate record`, leave `approvals.json`,
  `change.md` and the questions log unchanged, say that no decision was received, and end your turn:
  the phase stays in review until P-01 answers a gate question (`/architect:gate <NNN>` asks it
  again).
- Without the `ask_user` tool, present nothing to decide: reply as the interview wiring says
  (the missing tool and the steps of `INSTALL.md`).
- Pass the answer to the CLI unchanged: quote it for the shell so that dashes, quotes and
  non-ASCII characters survive.
