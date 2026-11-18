// C005-TC-061 — verifies C005-TS-163 (C005-AC-124.1, C005-REQ-124): free text that names exactly one kind is
// not asked again.
import { createdWith, kindCalls, liteThen } from "./kind-round.mjs";
import { newChangeCase } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-163",
  title: "Free text that names exactly one kind is not asked again",
  prompt: "I need a new change: export the order list to CSV",
  reply: liteThen(["brownfield, it changes the existing order module"]),
  check(ctx) {
    ctx.check(kindCalls(ctx.calls).length === 1, `expected no further kind question, got ${kindCalls(ctx.calls).length} kind calls`);
    createdWith(ctx, "lite", "brownfield");
  },
});
