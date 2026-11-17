// C005-TC-005 — verifies C005-TS-105 (C005-AC-101.1, C005-REQ-101): a request to skip the questions still gets
// the profile round.
import { newChangeCase, roundBeforeCreate } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-105",
  title: "Request to skip the questions still gets the profile round",
  prompt: "Create a change for CSV export of the order list with the default settings, do not ask me anything",
  check(ctx) {
    roundBeforeCreate(ctx);
  },
});
