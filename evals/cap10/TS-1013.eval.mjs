// C001-TC-1013 — verifies C001-TS-1013 (C001-AC-1012.1, C001-REQ-1012): cartographer return size. Graded
// on the cfg-full callers run (callers-full.eval.mjs grades it together with TS-1001); this file runs it
// alone.
import { checker } from "../harness/assert.mjs";
import { handback } from "../cap03/research.mjs";
import { countedLines } from "../cap03/TS-306.eval.mjs";
import { CALLERS_BRIEF, callersFixture, cartoRun } from "./carto.mjs";

export default {
  id: "TS-1013",
  title: "Cartographer return size",
  ...cartoRun("cfg-full", CALLERS_BRIEF, callersFixture),
  assert({ transcript }) {
    const { failures, check } = checker();
    const reply = handback(transcript, "sdd-cartographer");
    const lines = countedLines(reply);
    check(lines.length <= 20, `${lines.length} counted lines`);
    check(/ripwire|serena|grep|lsp|ast-grep/i.test(reply), "reply does not name the layers used");
    return failures;
  },
};
