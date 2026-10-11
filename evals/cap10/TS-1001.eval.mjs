// C001-TC-1001 — verifies C001-TS-1001 (C001-AC-1001.1, C001-REQ-1001): callers question on cfg-full. The
// dev-tier evidence comes from callers-full.eval.mjs (same Given and When, graded with TS-1002, 1004
// and 1013); this file runs it alone for the milestone and release tiers.
import { checker, toolCalls } from "../harness/assert.mjs";
import { CALLERS_BRIEF, callersFixture, cartoRun, intelCalls } from "./carto.mjs";
import { layersOf } from "./callers-full.eval.mjs";

export default {
  id: "TS-1001",
  title: "Callers question on cfg-full",
  ...cartoRun("cfg-full", CALLERS_BRIEF, callersFixture),
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const calls = intelCalls(toolCalls, transcript);
    check(calls[0] && /ripwire\b[^\n]*--callers=createIntent/.test(calls[0].cmd), `first code-intelligence call: ${calls[0]?.cmd ?? "none"}`);
    const layers = layersOf(root);
    check(layers.length > 0 && layers.every((l) => l === "ripwire"), `evidence layers ${JSON.stringify(layers)}`);
    return failures;
  },
};
