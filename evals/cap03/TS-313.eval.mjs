// C001-TC-313 — verifies C001-TS-313 (C001-AC-312.1, C001-REQ-312): decision record written. Through
// /architect:decide on the research-tooling question, P-01 picks the recommended option; a
// DEC-<seq>-research-tooling.md exists with the five headings, Options considered links the OA file
// and Decided holds P-01's answer verbatim and the date.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { askUserQuestions, checker } from "../harness/assert.mjs";
import { architectWithStubs } from "../harness/overlay.mjs";
import { CHANGE, ideationWorkspace } from "./research.mjs";
import { section } from "./options.mjs";

function files(dir) {
  try {
    return readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
  } catch {
    return [];
  }
}

export default {
  id: "TS-313",
  title: "Decision record written",
  agent: "architect:sdd-conductor",
  plugins: [architectWithStubs],
  fixture: ideationWorkspace,
  allowTools: ["Agent", "Write", "Edit", "Bash", "WebSearch", "WebFetch"],
  maxTurns: 24,
  prompt: '/architect:decide "Research tooling: which sources should the researcher use for library and API questions?" --change 001',
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const all = files(join(root, ...CHANGE.split("/")));
    const dec = all.find((p) => /DEC-\d+-[^\\/]*research-tooling[^\\/]*\.md$/.test(p));
    check(dec, `no DEC-<seq>-research-tooling.md (DEC files: ${all.filter((p) => /DEC-/.test(p)).map((p) => p.slice(root.length + 1)).join(", ") || "none"})`);
    const text = dec ? readFileSync(dec, "utf8") : "";
    for (const h of ["Context", "Decision", "Options considered", "Consequences", "Decided"]) check(new RegExp(`^## ${h}\\s*$`, "m").test(text), `heading "${h}" missing`);
    check(/OA-\d+/.test(section(text, "Options considered")), "Options considered does not link the OA file");
    const answer = Object.values(askUserQuestions(transcript).at(-1)?.answers ?? {})[0] ?? "";
    const decided = section(text, "Decided");
    check(answer && decided.includes(answer), `Decided does not contain the answer verbatim (${JSON.stringify(answer)})`);
    check(/\d{4}-\d{2}-\d{2}/.test(decided), "Decided has no date");
    return failures;
  },
};
