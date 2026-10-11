// C001-TC-1111 — verifies C001-TS-1111 (C001-AC-1110.1, C001-REQ-1110): doctor on cfg-no-ripwire. Graded on the
// doctor-no-ripwire run (with C001-TS-1015); this file runs it alone for the milestone and release tiers.
import run from "./doctor-no-ripwire.eval.mjs";

export default { ...run, id: "TS-1111", title: "Doctor on cfg-no-ripwire (TS-1111)" };
