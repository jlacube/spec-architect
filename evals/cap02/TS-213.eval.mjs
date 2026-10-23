// C001-TC-213 — verifies C001-TS-213 (C001-AC-212.1, C001-REQ-212): unattended drafting. Three
// non-blocking questions are pending: the approved ideation defers them to 10-spec, each with an ID,
// a recommended option and "blocking: no". P-01 asks for unattended drafting; the conductor applies the
// recommendations without asking, the statements derived from them carry [ASSUMPTION: <question-id>] and
// 85-open-items.md lists the 3 assumptions.
// Reworked for CHG-001 D-013: the questions used to come from a stand-in spec-writer reading a planted
// hand-back; the real specialists run now (architectReal), so the questions are pending where the real
// conductor reads them (the ideation's Open questions, phase-ideation step "Open questions").
// Caps: 40 turns (cap exception TS-213 of C002-IF-010 §2.2, rerun at 1.50 USD).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { askUserQuestions, checker, dispatches } from "../harness/assert.mjs";
import { architectReal } from "../harness/overlay.mjs";
import { LITE_IDEATION, specStart } from "./drafting.mjs";

const IDS = ["Q-stacking-01", "Q-rounding-01", "Q-expiry-01"];

// The lite ideation with stacking moved from "out of scope" to an open question, and three deferred,
// non-blocking questions for 10-spec.
const IDEATION = LITE_IDEATION.replace("In scope: one coupon per order, percentage discounts. Out of scope: stacking.", "In scope: percentage discounts on an order. Out of scope: gift cards.").replace(
  "## Open questions\n\nNone.\n",
  `## Open questions

Deferred to the specification (10-spec). None is blocking: each recommended option is an acceptable
default, and P-01 confirms or changes it at gate G2.

| ID | Question | Options (recommended first) | Owner | Settle in | Blocking |
|---|---|---|---|---|---|
| ${IDS[0]} | May a customer combine two coupons on one order? | No stacking (recommended: keeps v1 small); Allow stacking | P-01 | 10-spec | no |
| ${IDS[1]} | How is a discounted amount rounded? | Half up to the cent (recommended: matches the invoices); Banker's rounding | P-01 | 10-spec | no |
| ${IDS[2]} | Do coupons expire? | Expiry date per coupon (recommended: campaigns end); Never expire | P-01 | 10-spec | no |
`,
);

function files(dir) {
  return readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
}

export default {
  id: "TS-213",
  title: "Unattended drafting",
  agent: "architect:sdd-conductor",
  plugins: [architectReal],
  fixture: specStart({ ideation: IDEATION }),
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 40,
  prompt: "Draft the spec of CHG-001 unattended, I'll review at the gate.",
  answer: () => "I will review it later.",
  assert({ transcript, root }) {
    const { failures, check } = checker();
    check(dispatches(transcript).some((d) => d.type === "architect:sdd-spec-writer"), "the spec-writer was not dispatched");
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
