// C001-TC-420 — verifies C001-TS-420 (C001-AC-418.1, C001-REQ-418): a term introduced without
// definition. Requirements use the system name "path guard", absent from _constitution/glossary.md;
// glossary-delta.md defines it.
import { checker } from "../harness/assert.mjs";
import { brief, read, SPEC, writerRun } from "./spec.mjs";

export default {
  id: "TS-420",
  title: "Term introduced without definition",
  ...writerRun(brief("step 3 — Requirements", "write two requirements for CAP-01 billing (folder `20-capabilities/CAP-01-billing/` exists or create it): the invoice export files may only be written inside the export folder, and the system that enforces it is the \"path guard\" (use exactly that system name in the EARS statements).", `\`${SPEC}/20-capabilities/CAP-01-billing/requirements.md\` and \`${SPEC}/40-domain/glossary-delta.md\`.`)),
  assert({ root }) {
    const { failures, check } = checker();
    const reqs = read(root, `${SPEC}/20-capabilities/CAP-01-billing/requirements.md`);
    check(/THE path guard SHALL/i.test(reqs), "no requirement uses the system name \"path guard\"");
    const glossary = read(root, `${SPEC}/40-domain/glossary-delta.md`);
    const line = glossary.split("\n").find((l) => /path guard/i.test(l)) ?? "";
    check(line, "glossary-delta.md does not define \"path guard\"");
    check(line.replace(/path guard/i, "").replace(/[|*`\s-]/g, "").length > 15, `"path guard" has no definition: ${line}`);
    return failures;
  },
};
