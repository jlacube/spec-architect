// C001-TC-1011 — verifies C001-TS-1011 (C001-AC-1010.1, C001-REQ-1010): ripwire crashes. On cfg-full with a
// ripwire that exits 134 on queries, the callers evidence comes from Serena and discloses
// "ripwire failed: exit 134".
import { checker } from "../harness/assert.mjs";
import { CALLERS_BRIEF, callerLayerProblems, callersFixture, cartoRun, EVIDENCE, evidence, read } from "./carto.mjs";

export default {
  id: "TS-1011",
  title: "ripwire crashes",
  ...cartoRun("cfg-ripwire-crash", CALLERS_BRIEF, callersFixture),
  assert({ root }) {
    const { failures, check } = checker();
    const entries = evidence(read(root, `${EVIDENCE}/callers-createIntent.md`));
    check(entries.length > 0, "no evidence entry");
    for (const p of callerLayerProblems(root, "serena")) check(false, p);
    for (const e of entries.filter((x) => x.layer === "serena")) check(/ripwire failed: exit 134/.test(e.disclosures), `${e.id}: disclosures "${e.disclosures}"`);
    return failures;
  },
};
