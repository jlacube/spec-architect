// C001-TC-213 — verifies C001-TS-213 (C001-AC-212.1, C001-REQ-212): unattended drafting. The spec-writer
// (stand-in) hands back 3 non-blocking questions; drafting unattended, the conductor applies the
// recommendations, the statements derived from them carry [ASSUMPTION: <question-id>] and
// 85-open-items.md lists the 3 assumptions.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { askUserQuestions, checker } from "../harness/assert.mjs";
import { architectWithStubs } from "../harness/overlay.mjs";
import { write } from "../harness/workspaces.mjs";
import { specStart } from "./drafting.mjs";

const IDS = ["Q-stacking-01", "Q-rounding-01", "Q-expiry-01"];
const Q = (id, question, a, b) => ({ id, topic: id.split("-")[1], question, why_it_matters: "Changes one requirement statement of the coupon capability.", blocking: false, material: false, options: [{ label: a, rationale: `${a} keeps v1 small.`, recommended: true }, { label: b, rationale: `${b} covers more cases.` }] });
const HANDBACK = `Digest: stories and requirements drafted (stand-in). Written: see brief.

\`\`\`json questions
${JSON.stringify({ questions: [Q(IDS[0], "May a customer combine two coupons on one order?", "No stacking", "Allow stacking"), Q(IDS[1], "How is a discounted amount rounded?", "Half up to the cent", "Banker's rounding"), Q(IDS[2], "Do coupons expire?", "Expiry date per coupon", "Never expire")] }, null, 2)}
\`\`\`
`;

function files(dir) {
  return readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
}

export default {
  id: "TS-213",
  title: "Unattended drafting",
  agent: "architect:sdd-conductor",
  plugins: [architectWithStubs],
  fixture: (root) => {
    specStart()(root);
    write(root, ".eval/handbacks/sdd-spec-writer.md", HANDBACK);
  },
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 40,
  prompt: "Draft the spec of CHG-001 unattended, I'll review at the gate.",
  answer: () => "I will review it later.",
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const asked = askUserQuestions(transcript).flatMap((c) => c.questions.map((q) => q.question));
    check(!asked.some((q) => /stack|round|expire/i.test(q)), "a non-blocking question was asked in unattended mode");
    const spec = join(root, ".sdd", "001-coupon-codes", "10-spec");
    const texts = files(spec).filter((p) => !p.endsWith("85-open-items.md")).map((p) => readFileSync(p, "utf8")).join("\n");
    for (const id of IDS) check(texts.includes(`[ASSUMPTION: ${id}]`), `no statement marked [ASSUMPTION: ${id}]`);
    let open = "";
    try {
      open = readFileSync(join(spec, "85-open-items.md"), "utf8");
    } catch {
      // not generated
    }
    for (const id of IDS) check(open.includes(id), `85-open-items.md does not list ${id}`);
    return failures;
  },
};
