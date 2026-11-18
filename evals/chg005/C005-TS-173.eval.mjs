// C005-TC-071 — verifies C005-TS-173 (C005-AC-124.1, C005-REQ-124): a further-round answer that again names no
// kind gets one more round, before any sdd change new call.
import { kindCallBeforeCreate, liteThen } from "./kind-round.mjs";
import { newChangeCase } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-173",
  title: "Further-round answer that again names no kind gets one more round",
  prompt: "I need a new change: export the order list to CSV",
  reply: liteThen(["it changes existing code", "you decide", "brownfield"]),
  check(ctx) {
    kindCallBeforeCreate(ctx, 2);
  },
});
