// C005-TC-002 — verifies C005-TS-102 (C005-AC-101.1, C005-REQ-101): the new-change command keeps the profile
// round after the procedure moved to phase-ideation.
import { newChangeCase, roundBeforeCreate } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-102",
  title: "New-change command keeps the profile round",
  prompt: '/architect:new "Export the order list to CSV"',
  check(ctx) {
    const r = roundBeforeCreate(ctx);
    const first = r?.profile?.options?.[0]?.label ?? "";
    ctx.check(/\b(lite|full)\b/i.test(first) && /\(Recommended\)/.test(first), `the first option is not a profile labelled (Recommended): ${first}`);
  },
});
