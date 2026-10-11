// One cfg-full "who calls createIntent?" run graded against the scenarios that share this Given and When:
// C001-TS-1001 (first code-intelligence call is ripwire --callers, layer ripwire), C001-TS-1002 row
// cfg-full (layer ripwire), C001-TS-1004 row --callers= (--limit ≤ 50, no --token-budget/--top-k) and
// C001-TS-1013 (return ≤ 20 lines naming the layers).
import { checker, toolCalls } from "../harness/assert.mjs";
import { handback } from "../cap03/research.mjs";
import { countedLines } from "../cap03/TS-306.eval.mjs";
import { CALLERS_BRIEF, callerLayerProblems, callersFixture, cartoRun, EVIDENCE, evidence, intelCalls, read } from "./carto.mjs";

export function layersOf(root) {
  return evidence(read(root, `${EVIDENCE}/callers-createIntent.md`)).map((e) => e.layer);
}

export default {
  id: "callers-full",
  title: "Callers on cfg-full (TS-1001, TS-1002 cfg-full, TS-1004 --callers, TS-1013)",
  ...cartoRun("cfg-full", CALLERS_BRIEF, callersFixture),
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const calls = intelCalls(toolCalls, transcript);
    check(calls[0] && /ripwire\b[^\n]*--callers=createIntent/.test(calls[0].cmd), `TS-1001: first code-intelligence call: ${calls[0]?.cmd ?? "none"}`);
    const layers = layersOf(root);
    check(layers.length > 0 && layers.every((l) => l === "ripwire"), `TS-1001: evidence layers ${JSON.stringify(layers)}`);
    for (const p of callerLayerProblems(root, "ripwire")) check(false, `TS-1002: ${p}`);
    for (const c of calls.filter((x) => /--callers=/.test(x.cmd))) {
      const limit = Number(/--limit=(\d+)/.exec(c.cmd)?.[1]);
      check(limit > 0 && limit <= 50, `TS-1004: --callers without --limit ≤ 50: ${c.cmd}`);
      check(!/--token-budget=|--top-k=/.test(c.cmd), `TS-1004: forbidden flag: ${c.cmd}`);
    }
    const reply = handback(transcript, "sdd-cartographer");
    const lines = countedLines(reply);
    check(lines.length <= 20, `TS-1013: ${lines.length} counted lines`);
    check(/ripwire/i.test(reply), "TS-1013: reply does not name the layers used");
    return failures;
  },
};
