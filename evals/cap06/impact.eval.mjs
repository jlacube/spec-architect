// C001-TC-612 and C001-TC-613 — verify C001-TS-612 (regression set) and C001-TS-613 (blast radius) on one
// plan-phase impact analysis (same Given: a brownfield plan whose tasks target createIntent in
// src/checkout/payments.ts, ripwire available). regression-set.md lists the tests ripwire --test-gate
// reports for that symbol with layer ripwire; blast-radius.md lists createIntent's direct callers, a
// transitive reach count and the layer.
import { checker, toolCalls } from "../harness/assert.mjs";
import { cartoRun, brownfield, read } from "../cap10/carto.mjs";

const IMPACT = ".sdd/001-payments-refunds/20-plan/30-impact";

const BRIEF = `Brief — cartographer: impact analysis.
- Change: CHG-001 "Payments refunds" · profile full · kind brownfield
- Phase / step: 20-plan · impact
- Task: the plan's tasks target the existing symbol createIntent in src/checkout/payments.ts. Write the blast radius and the regression set for it.
- Inputs: the repository; \`.sdd/_constitution/toolchain.md\`.
- IDs to use: evidence entries E-1, E-2, … per file.
- Outputs: \`${IMPACT}/blast-radius.md\`, \`${IMPACT}/regression-set.md\`.
- Quality bar: code-discovery (impact), sdd-conventions.
- Return contract: digest (at most 20 lines, naming the layers used) and the paths written.`;

export default {
  id: "impact",
  title: "Impact analysis (TS-612 regression set, TS-613 blast radius)",
  ...cartoRun("cfg-full", BRIEF, brownfield()),
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const reg = read(root, `${IMPACT}/regression-set.md`);
    check(reg, "TS-612: regression-set.md missing");
    const gate = toolCalls(transcript, "Bash").some((c) => c.agent !== null && /ripwire\b[^\n]*--test-gate/.test(String(c.input?.command ?? "")));
    check(gate, "TS-612: ripwire --test-gate was not run");
    check(/tests\/payments\.test\.ts/.test(reg), "TS-612: tests/payments.test.ts not listed");
    check(/layer:\s*ripwire|\|\s*ripwire\s*\|/.test(reg), "TS-612: entries do not carry layer ripwire");
    const br = read(root, `${IMPACT}/blast-radius.md`);
    check(br, "TS-613: blast-radius.md missing");
    check(/createIntent/.test(br), "TS-613: createIntent not listed");
    check(/caller/i.test(br) && /payments\.test\.ts|<file-scope>|test/i.test(br), "TS-613: no direct callers listed");
    check(/reach[^\n]*\d|transitive[^\n]*\d|\d+[^\n]*(symbols?|reach)/i.test(br), "TS-613: no transitive reach count");
    check(/layer:\s*(ripwire|serena|lsp|grep)|\|\s*(ripwire|serena|lsp|grep)\s*\|/.test(br), "TS-613: no evidence layer");
    return failures;
  },
};
