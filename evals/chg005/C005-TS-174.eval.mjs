// C005-TC-072 — verifies C005-TS-174 (C005-AC-124.1, C005-REQ-124): the change declined in the further round,
// no change created and no later kind question.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { kindCalls, liteThen } from "./kind-round.mjs";
import { changeNewCalls, newChangeCase } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-174",
  title: "Change declined in the further round, no change created",
  prompt: "I need a new change: export the order list to CSV",
  reply: liteThen(["it changes existing code", "Stop, do not create it"]),
  check({ transcript, root, calls, check }) {
    const kc = kindCalls(calls);
    check(kc.length === 2, `expected the further kind round and no later one, got ${kc.length} kind calls`);
    check(changeNewCalls(transcript).length === 0, "an sdd change new call ran");
    check(!readdirSync(join(root, ".sdd")).some((d) => d.startsWith("002-")), "a folder .sdd/002-* exists");
  },
});
