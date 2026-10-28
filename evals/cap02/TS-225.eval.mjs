// C001-TC-225 — verifies C001-TS-225 (C001-AC-221.1, C001-REQ-221; D-019 item 1): a blocking question is asked
// when its hand-back arrives while another specialist runs, in attended drafting. Built like
// evals/cap02/TS-215.eval.mjs, which checks the same rule in unattended drafting: the real specialists
// (architectReal) on the C001-TS-223 fixture, a shop with two live checkouts ("src/checkout/totals.ts", web;
// "src/kiosk/totals.ts", in-store kiosk) and its approved lite ideation, which says only "checkout applies the
// discount before tax". The real cartographer flags the web-or-kiosk scope question as blocking (C001-IF-05
// `questions.md` §1 criterion 1; C001-TS-223). P-01's request is "Draft the spec of CHG-001." (attended).
// The checks are the arrival-to-ask checks of C001-AC-221.1, read from the transcript on the terms of its note
// (arrival.mjs): an AskUserQuestion call carrying the blocking question after the hand-back's arrival and
// before the conductor's turn ends, with no Agent call between. A run whose Given does not hold (cartographer
// not dispatched, no blocking question in its hand-back, spec-writer not still running at the arrival) is
// reported "Given not met" with `valid_run` false, distinct from a conductor failure; the runner of
// C001-T-082 and C001-T-072 replaces it once (C001-AC-221.1 note).
import { architectReal } from "../harness/overlay.mjs";
import { assertAskOnArrival } from "./arrival.mjs";
import { askDecided } from "./TS-215.eval.mjs";
import { twoCheckoutSpecStart } from "./TS-223.eval.mjs";

export default {
  id: "TS-225",
  title: "Blocking question asked while another specialist runs, attended drafting",
  agent: "architect:sdd-conductor",
  plugins: [architectReal],
  fixture: twoCheckoutSpecStart(),
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  // 30 turns, as TS-215 (the conductor needs more than 22 to reach the cartographer, t063-d013).
  maxTurns: 30,
  prompt: "Draft the spec of CHG-001.",
  // Ends the session once the check is decided (C002-T-072): the condition of TS-215, which shares this check.
  stopWhen: (transcript) => askDecided(transcript),
  assert({ transcript, log }) {
    return assertAskOnArrival("TS-225", { transcript, log });
  },
};
