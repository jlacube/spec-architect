// C005-TC-001 — verifies C005-TS-101 (C005-AC-101.1, C005-REQ-101): a plain-words create request on Claude Code
// gets the profile round before any sdd change new call and before any change folder exists.
import { isProfileQuestion, newChangeCase, roundBeforeCreate } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-101",
  title: "Plain-words create request on Claude Code",
  prompt: "I need a new change: export the order list to CSV",
  check(ctx) {
    roundBeforeCreate(ctx);
    const n = ctx.calls.filter((c) => c.questions.some(isProfileQuestion)).length;
    ctx.check(n === 1, `expected exactly one question call proposing lite or full, got ${n}`);
  },
});
