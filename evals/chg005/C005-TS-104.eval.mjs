// C005-TC-004 — verifies C005-TS-104 (C005-AC-101.1, C005-REQ-101): the profile round declined in free text,
// no change created.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { changeNewCalls, isProfileQuestion, newChangeCase } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-104",
  title: "Profile round declined, no change created",
  prompt: "I need a new change: export the order list to CSV",
  reply: () => "Stop, do not create it",
  check({ transcript, root, calls, check }) {
    check(calls.some((c) => c.questions.some(isProfileQuestion)), "no profile question was asked");
    check(changeNewCalls(transcript).length === 0, "an sdd change new call ran");
    check(!readdirSync(join(root, ".sdd")).some((d) => d.startsWith("002-")), "a folder .sdd/002-* exists");
  },
});
