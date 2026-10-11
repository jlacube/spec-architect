// C001-TC-424 — verifies C001-TS-424 (C001-AC-422.1, C001-REQ-422): the index is navigation-only. With
// two capabilities written, 00-index.md has a reading order, a file list with one-line purposes, the
// capability list with ID blocks and ID counts, and no paragraph that restates requirement content.
import { checker } from "../harness/assert.mjs";
import { write } from "../harness/workspaces.mjs";
import { brief, read, SPEC, specStartFull, writerRun } from "./spec.mjs";

const REQ = (cap, n, statement) => `### C004-REQ-${cap}0${n} — R${n}\n- **Pattern:** event-driven\n- **Statement:** ${statement}\n- **Rationale:** ideation Goals\n- **Stories:** C004-US-${cap}01\n- **Priority:** Must\n- **Acceptance:** C004-AC-${cap}0${n}.1\n`;
const STATEMENTS = [
  "WHEN a billing month ends, THE billing service SHALL charge each active clinic's card the subscription price.",
  "IF a card charge fails, THEN THE billing service SHALL retry the charge after 24 hours.",
  "WHEN an appointment is 24 hours away, THE notification service SHALL send the patient a reminder by the patient's preferred channel.",
];

export default {
  id: "TS-424",
  title: "Index is navigation-only",
  ...writerRun(brief("step 2 — Index", "write the navigation index of the spec; the capability folders CAP-01-billing and CAP-02-notifications already exist.", `\`${SPEC}/00-index.md\` only.`)),
  fixture: (root) => {
    specStartFull(root);
    write(root, `${SPEC}/20-capabilities/CAP-01-billing/requirements.md`, `---\nid: C004-CAP-01\nartifact: spec/requirements\n---\n\n${REQ(1, 1, STATEMENTS[0])}\n${REQ(1, 2, STATEMENTS[1])}`);
    write(root, `${SPEC}/20-capabilities/CAP-02-notifications/requirements.md`, `---\nid: C004-CAP-02\nartifact: spec/requirements\n---\n\n${REQ(2, 1, STATEMENTS[2])}`);
  },
  assert({ root }) {
    const { failures, check } = checker();
    const text = read(root, `${SPEC}/00-index.md`);
    check(text, "00-index.md not written");
    check(/reading order/i.test(text), "no reading order");
    check(/CAP-01[\s\S]*billing/i.test(text) && /CAP-02[\s\S]*notification/i.test(text), "capability list missing");
    check(/1\d\d|block/i.test(text), "no ID blocks");
    check(/\|\s*(US|REQ)\s*\|\s*\d+|\b(REQ|US)\b[^\n]*\b\d+\b/.test(text), "no ID counts");
    check(!/\bSHALL\b/.test(text), "the index restates requirement statements (SHALL)");
    for (const s of STATEMENTS) check(!text.includes(s.slice(0, 40)), "the index copies a requirement statement");
    return failures;
  },
};
