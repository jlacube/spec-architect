// C001-TC-507 — verifies C001-TS-507: graded on the architecture run (architecture.eval.mjs grades TS-507 and
// TS-508 together, same Given and When); this file runs it alone for the milestone and release tiers.
import architecture from "./architecture.eval.mjs";

export default { ...architecture, id: "TS-507", title: "Architecture run (TS-507)" };
