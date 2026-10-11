// C001-TC-508 — verifies C001-TS-508: graded on the architecture run (architecture.eval.mjs grades TS-507 and
// TS-508 together, same Given and When); this file runs it alone for the milestone and release tiers.
import architecture from "./architecture.eval.mjs";

export default { ...architecture, id: "TS-508", title: "Architecture run (TS-508)" };
