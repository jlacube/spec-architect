// C001-TC-1014 — verifies C001-TS-1014 (C001-AC-1012.1, C001-REQ-1010): a documented answer exit code is not
// a failure. `ripwire … --test-gate=src/checkout/payments.ts --limit=50` exits 4; the evidence layer is
// ripwire and no disclosure says "ripwire failed".
import { checker } from "../harness/assert.mjs";
import { brief, cartoRun, EVIDENCE, evidence, read } from "./carto.mjs";

export default {
  id: "TS-1014",
  title: "Documented answer exit code is not a failure",
  ...cartoRun("cfg-ripwire-exit4", brief("Which tests must run if src/checkout/payments.ts changes? Use ripwire's test gate for that file.", `\`${EVIDENCE}/test-gate-payments.md\`.`)),
  assert({ root }) {
    const { failures, check } = checker();
    const entries = evidence(read(root, `${EVIDENCE}/test-gate-payments.md`));
    check(entries.length > 0, "no evidence entry");
    for (const e of entries) {
      check(e.layer === "ripwire", `${e.id}: layer ${e.layer}`);
      check(!/ripwire failed/i.test(e.disclosures), `${e.id}: disclosures "${e.disclosures}"`);
    }
    return failures;
  },
};
