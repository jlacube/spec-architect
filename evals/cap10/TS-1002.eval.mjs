// C001-TC-1002 — verifies C001-TS-1002 (C001-AC-1001.2, C001-REQ-1001): fallback by configuration. The
// cfg-full row also runs inside callers-full.eval.mjs; this outline runs the other two rows.
import { checker } from "../harness/assert.mjs";
import { CALLERS_BRIEF, callerLayerProblems, callersFixture, cartoRun } from "./carto.mjs";

const EXAMPLES = [
  { cfg: "cfg-no-ripwire", layer: "serena" },
  { cfg: "cfg-bare", layer: "grep" },
];

export default EXAMPLES.map(({ cfg, layer }) => ({
  id: `TS-1002-${cfg}`,
  title: `Fallback by configuration (${cfg} → ${layer})`,
  ...cartoRun(cfg, CALLERS_BRIEF, callersFixture),
  assert({ root }) {
    const { failures, check } = checker();
    for (const p of callerLayerProblems(root, layer)) check(false, p);
    return failures;
  },
}));
