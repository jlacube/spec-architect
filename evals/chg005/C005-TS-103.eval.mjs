// C005-TC-003 — verifies C005-TS-103 (C005-AC-101.1, C005-REQ-101): a request that creates no change starts
// no profile round.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { changeNewCalls, isProfileQuestion, newChangeCase } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-103",
  title: "A request that creates no change starts no profile round",
  prompt: "What is the status of change 001?",
  maxTurns: 12,
  check({ transcript, root, calls, check }) {
    check(!calls.some((c) => c.questions.some(isProfileQuestion)), "a question call proposed a profile");
    check(changeNewCalls(transcript).length === 0, "an sdd change new call ran");
    check(!readdirSync(join(root, ".sdd")).some((d) => d.startsWith("002-")), "a folder .sdd/002-* exists");
    check(existsSync(join(root, ".sdd")), ".sdd/ is missing");
  },
});
