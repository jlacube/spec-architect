// C001-TC-119 — verifies C001-TS-119 (C001-AC-114.1, C001-REQ-114): constitution drafted by the init
// interview. P-01 answers every round with the recommended options.
import { checker } from "../harness/assert.mjs";
import { initRun, readConstitution } from "./init.mjs";

const HEADINGS = ["Principles", "Quality bar", "NFR defaults", "Global DoD", "Forbidden technologies", "Profile thresholds", "Language & conventions"];

export default {
  id: "TS-119",
  title: "Constitution drafted by init interview",
  ...initRun,
  assert({ root }) {
    const { failures, check } = checker();
    const text = readConstitution(root);
    check(text, "constitution.md was not written");
    for (const h of HEADINGS) check(new RegExp(`^#{1,3}\\s+(\\d+\\.\\s+)?${h.replace("&", "&")}\\b`, "m").test(text), `heading "${h}" missing`);
    const dod = text.slice(text.search(/^#{1,3}\s+(\d+\.\s+)?Global DoD/m));
    check(/DOD-G-\d{2}/.test(dod.split(/\n#{1,3}\s/)[0] ?? ""), "Global DoD has no DOD-G-nn item");
    return failures;
  },
};
