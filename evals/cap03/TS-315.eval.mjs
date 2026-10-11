// C001-TC-315 — verifies C001-TS-315 (C001-AC-314.1, C001-REQ-314): brownfield ideation start. The conductor
// dispatches the cartographer at the ideation start of a brownfield change (C001-TS-218); here the
// cartographer gets that brief (change 004, cfg-full). baseline-survey.md exists, lists an affected area
// with path, symbol and layer, and has a blast-radius entry for at least one symbol.
import { checker } from "../harness/assert.mjs";
import { write } from "../harness/workspaces.mjs";
import { brownfield, cartoRun, evidence, read } from "../cap10/carto.mjs";

const SURVEY = ".sdd/001-payments-refunds/00-ideation/evidence/baseline-survey.md";
const IDEA = "Customers can get a partial refund of a captured card payment; finance wants refunds to appear on the invoice.";

const BRIEF = `Brief — cartographer: baseline survey.
- Change: CHG-001 "Payments refunds" · profile full · kind brownfield
- Phase / step: 00-ideation · step 3 — Research and discovery
- Task: write the baseline survey for this idea: ${IDEA}
- Inputs: the repository; \`.sdd/_constitution/toolchain.md\`.
- IDs to use: evidence entries E-1, E-2, ….
- Outputs: \`${SURVEY}\`.
- Quality bar: code-discovery (baseline survey), sdd-conventions.
- Return contract: digest (at most 20 lines, naming the layers used) and the path written.`;

export default {
  id: "TS-315",
  title: "Brownfield ideation start",
  ...cartoRun("cfg-full", BRIEF, brownfield({ extra: (root) => write(root, "README.md", "# Payments service\n") })),
  assert({ root }) {
    const { failures, check } = checker();
    const text = read(root, SURVEY);
    check(text, "baseline-survey.md missing");
    const entries = evidence(text);
    check(entries.some((e) => /`[\w./-]+\.\w+:\d+`\s*›\s*`[^`]+`/.test(e.head) && e.layer), "no affected-area entry with path, symbol and layer");
    check(/blast[- ]radius/i.test(text) && /caller|reach/i.test(text.slice(text.search(/blast[- ]radius/i))), "no blast-radius entry");
    return failures;
  },
};
