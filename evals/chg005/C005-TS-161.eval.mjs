// C005-TC-059 — verifies C005-TS-161 (C005-AC-124.1, C005-REQ-124): a kind answer that names no kind or more
// than one gets a further kind round before sdd change new; one case per Examples row.
import { kindCallBeforeCreate, liteThen } from "./kind-round.mjs";
import { newChangeCase } from "./new-change.mjs";

const ROWS = ["it changes existing code", "brownfield or mixed, you decide", "legacy"];

export default ROWS.map((answer, i) =>
  newChangeCase({
    id: `C005-TS-161-${i + 1}`,
    title: `Kind answer "${answer}" gets a further round`,
    prompt: "I need a new change: export the order list to CSV",
    reply: liteThen([answer, "brownfield"]),
    check(ctx) {
      kindCallBeforeCreate(ctx, 1);
    },
  }),
);
