// C001-TC-122 — verifies C001-TS-122 (C001-AC-116.1, C001-REQ-116): lite suggestion for a small change.
// The constitution's thresholds say lite for ≤ 3 stories, ≤ 10 requirements, ≤ 2 modules; the
// conductor offers "lite" first with the size estimate, and no change folder exists until P-01
// answers (checked when the harness answers).
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { askUserQuestions, checker } from "../harness/assert.mjs";
import { constitution } from "../cap02/drafting.mjs";
import { git, sdd } from "../harness/workspaces.mjs";

let workspace = null;
let foldersAtAnswer = null;
const changeFolders = () => readdirSync(join(workspace, ".sdd")).filter((n) => /^\d{3}-/.test(n));

export default {
  id: "TS-122",
  title: "Lite suggestion for a small change",
  agent: "architect:sdd-conductor",
  fixture: (root) => {
    workspace = root;
    foldersAtAnswer = null;
    git(root, "init", "-q");
    sdd(root, "init");
    constitution(root, "approved");
  },
  allowTools: ["Write", "Edit", "Bash"],
  maxTurns: 16,
  prompt: '/architect:new "Add --json flag to status"',
  answer: (question) => {
    foldersAtAnswer ??= changeFolders();
    return question.options[0].label;
  },
  assert({ transcript }) {
    const { failures, check } = checker();
    const first = askUserQuestions(transcript)[0];
    const profileQ = first?.questions.find((q) => /profile|lite|full/i.test(`${q.header} ${q.question} ${q.options.map((o) => o.label).join(" ")}`));
    check(profileQ, "no profile question was asked");
    const opt = profileQ?.options?.[0];
    check(/lite/i.test(opt?.label ?? "") && /\(Recommended\)/.test(opt?.label ?? ""), `first option is not "lite (Recommended)": ${opt?.label}`);
    check(/\d/.test(`${opt?.description ?? ""} ${profileQ?.question ?? ""}`), "no size estimate shown");
    check(Array.isArray(foldersAtAnswer) && foldersAtAnswer.length === 0, `a change folder existed before the answer: ${foldersAtAnswer}`);
    return failures;
  },
};
