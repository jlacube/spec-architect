// C001-TC-1012 — verifies C001-TS-1012 (C001-AC-1011.1, C001-REQ-1011): empty repository. On fx-empty after
// `sdd init`, the baseline survey reply says "no code evidence applicable" and nothing is written under
// 00-ideation/evidence/.
import { join } from "node:path";
import { checker } from "../harness/assert.mjs";
import { handback } from "../cap03/research.mjs";
import { constitution } from "../cap02/drafting.mjs";
import { edit, git, sdd } from "../harness/workspaces.mjs";
import { brief, cartoRun, EVIDENCE, files } from "./carto.mjs";

function empty(root) {
  git(root, "init", "-q");
  sdd(root, "init");
  constitution(root, "approved");
  sdd(root, "change", "new", "Payments refunds", "--kind", "brownfield");
  edit(root, ".sdd/001-payments-refunds/change.md", (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1draft"));
  sdd(root, "status", "--write");
}

export default {
  id: "TS-1012",
  title: "Empty repository",
  ...cartoRun("cfg-full", brief("Write the baseline survey of the repository for this brownfield change.", `\`${EVIDENCE}/baseline-survey.md\`.`), empty),
  assert({ transcript, root }) {
    const { failures, check } = checker();
    check(/no code evidence applicable/i.test(handback(transcript, "sdd-cartographer")), "reply lacks \"no code evidence applicable\"");
    const written = files(join(root, ...EVIDENCE.split("/")));
    check(written.length === 0, `files written under evidence/: ${written.join(", ")}`);
    return failures;
  },
};
