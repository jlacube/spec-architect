// C001-TC-224 — verifies C001-TS-224 (C001-AC-208.2, C001-REQ-208), the negative case of C001-TS-223: a
// naming preference comes back non-blocking. Built like evals/cap02/TS-223.eval.mjs (CHG-001 D-017,
// C001-T-082): the real cartographer on the same two-checkout repository, but the approved ideation puts
// the kiosk checkout out of scope and leaves one Open question, whether the new module is named "coupons"
// or "promotions". That question meets no criterion of C001-IF-05 `questions.md` §1: it decides no code
// path, entry point or component in scope, and the survey need not state the name as a fact or an
// assumption. The assert reads only the cartographer's hand-back: a questions block valid against
// C001-IF-05, with a question whose question text or option labels contain both "coupons" and
// "promotions" (case-insensitive), and that question has "blocking": false.
import { architectReal } from "../harness/overlay.mjs";
import { LITE_IDEATION } from "./drafting.mjs";
import { cartographerQuestions, mentions, twoCheckoutSpecStart } from "./TS-223.eval.mjs";

const DIRECTION = "A coupon service validates codes; the web checkout applies the discount before tax. The kiosk checkout is out of scope.";
const OPEN = "Should the new module be named 'coupons' or 'promotions'? No file or interface depends on the name yet.";

export const NAMING_IDEATION = LITE_IDEATION.replace("A coupon service validates codes; checkout applies the discount before tax.", DIRECTION).replace(/(## Open questions\n\n)None\.\n/, `$1${OPEN}\n`);
if (!NAMING_IDEATION.includes(DIRECTION) || !NAMING_IDEATION.includes(OPEN)) throw new Error("TS-224: the ideation Given could not be built from LITE_IDEATION");

const brief = (q) => `${q.id ?? "?"} blocking=${q.blocking}: ${q.question}`;

export default {
  id: "TS-224",
  title: "A naming preference comes back non-blocking",
  agent: "architect:sdd-conductor",
  plugins: [architectReal],
  fixture: twoCheckoutSpecStart(NAMING_IDEATION),
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 30,
  prompt: "Draft the spec of CHG-001 unattended, I'll review at the gate.",
  assert({ transcript }) {
    const { failures, check, questions } = cartographerQuestions(transcript);
    if (!questions) return failures;
    const naming = questions.filter((q) => mentions(q, "coupons", "promotions"));
    check(naming.length > 0, `no question names both "coupons" and "promotions" (questions: ${questions.map(brief).join(" | ")})`);
    for (const q of naming) check(q.blocking === false, `the naming question is not "blocking": false: ${brief(q)}`);
    return failures;
  },
};
