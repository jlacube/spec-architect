// C001-TC-1015 — verifies C001-TS-1015 (C001-AC-1013.1, C001-REQ-1013): Serena data kept outside the
// repository. Graded on the doctor-no-ripwire run (with C001-TS-1111); this file runs it alone.
import run from "../cap11/doctor-no-ripwire.eval.mjs";

export default { ...run, id: "TS-1015", title: "Serena data kept outside the repository (TS-1015)" };
