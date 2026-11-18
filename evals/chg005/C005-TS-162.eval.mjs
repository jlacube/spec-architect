// C005-TC-060 — verifies C005-TS-162 (C005-AC-124.1, C005-REQ-124): the kind answered in the further round is
// passed to sdd change new.
import { createdWith, liteThen } from "./kind-round.mjs";
import { changeMd, newChangeCase } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-162",
  title: "Kind answered in the further round",
  prompt: "I need a new change: export the order list to CSV",
  reply: liteThen(["it changes existing code", "mixed"]),
  check(ctx) {
    createdWith(ctx, "lite", "mixed");
    const md = changeMd(ctx.root, "002");
    ctx.check(/^profile: "?lite"?$/m.test(md), "change.md of 002 does not give profile: lite");
    ctx.check(/^kind: "?mixed"?$/m.test(md), "change.md of 002 does not give kind: mixed");
  },
});
