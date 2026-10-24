// C001-TC-224 — verifies C001-TS-224 (C001-AC-208.2, C001-REQ-208), the negative case of C001-TS-223: no
// specialist flags a naming preference as blocking. Built like evals/cap02/TS-223.eval.mjs (CHG-001 D-017,
// reworked for D-018; C001-T-082): the real specialists on the same two-checkout repository, but the
// approved ideation puts the kiosk checkout out of scope and leaves one Open question, whether the new
// module is named "coupons" or "promotions". That question meets no criterion of C001-IF-05
// `questions.md` §1: it decides no code path, entry point or component in scope, and no specialist has to
// state the name as a fact or an assumption. Any specialist may raise it, or none (D-018).
// The assert reads every specialist hand-back (C001-TS-224 Note): per Agent call from the conductor to one
// of the nine specialists of C001-REQ-217, the last assistant message with text whose
// `parent_tool_use_id` is that call, before the session's last result message; else the call's tool
// result, unless that is a launch notice. Pass: at least one hand-back; every "```json questions" fence
// parses; every question naming both "coupons" and "promotions" (question text or option labels,
// case-insensitive) has "blocking": false. Validity against C001-IF-05 is TS-209's and TS-223's check.
// Each run reports whether the naming question was raised and by which specialist: one line in the run's
// output, and in every failure text of a failed run (the result record keeps only failures).
import { checker, dispatches } from "../harness/assert.mjs";
import { architectReal } from "../harness/overlay.mjs";
import { questionsBlocks } from "../harness/questions.mjs";
import { LITE_IDEATION } from "./drafting.mjs";
import { mentions, twoCheckoutSpecStart } from "./TS-223.eval.mjs";

const DIRECTION = "A coupon service validates codes; the web checkout applies the discount before tax. The kiosk checkout is out of scope.";
const OPEN = "Should the new module be named 'coupons' or 'promotions'? No file or interface depends on the name yet.";

export const NAMING_IDEATION = LITE_IDEATION.replace("A coupon service validates codes; checkout applies the discount before tax.", DIRECTION).replace(/(## Open questions\n\n)None\.\n/, `$1${OPEN}\n`);
if (!NAMING_IDEATION.includes(DIRECTION) || !NAMING_IDEATION.includes(OPEN)) throw new Error("TS-224: the ideation Given could not be built from LITE_IDEATION");

/** The nine specialists of C001-REQ-217 (the conductor's Agent list). */
export const SPECIALISTS = ["sdd-researcher", "sdd-cartographer", "sdd-options-analyst", "sdd-spec-writer", "sdd-test-designer", "sdd-architect", "sdd-planner", "sdd-critic", "sdd-auditor"];
const specialistOf = (type) => SPECIALISTS.find((s) => type === s || type.endsWith(`:${s}`)) ?? null;

const textOf = (content) => (typeof content === "string" ? content : (content ?? []).filter((b) => b?.type === "text").map((b) => b.text).join(""));
/** A tool result that only says the agent was started in the background (C001-TS-224 Note). */
export const isLaunchNotice = (text) => /Async agent launched|working in the background/i.test(text);

/**
 * Every specialist hand-back of the session (C001-TS-224 Note): `{ specialist, dispatch, text, source }`
 * per Agent call from the conductor to a specialist that has one; `source` is "stream" (the last streamed
 * text under the call, before the session's last result message) or "tool result".
 */
export function specialistHandbacks(transcript) {
  let end = transcript.length;
  for (let i = transcript.length - 1; i >= 0; i--)
    if (transcript[i].type === "sdk" && transcript[i].message?.type === "result") {
      end = i;
      break;
    }
  const upTo = transcript.slice(0, end);
  const out = [];
  for (const d of dispatches(transcript)) {
    const specialist = specialistOf(d.type);
    if (!specialist) continue;
    let text = null;
    for (const r of upTo) {
      const m = r.type === "sdk" ? r.message : null;
      if (m?.type === "assistant" && m.parent_tool_use_id === d.id) {
        const t = textOf(m.message?.content);
        if (t.trim()) text = t;
      }
    }
    let source = "stream";
    if (text === null) {
      source = "tool result";
      for (const r of upTo) {
        const m = r.type === "sdk" ? r.message : null;
        if (m?.type !== "user") continue;
        for (const b of m.message?.content ?? []) {
          if (b?.type !== "tool_result" || b.tool_use_id !== d.id) continue;
          const t = textOf(b.content);
          if (t.trim() && !isLaunchNotice(t)) text = t;
        }
      }
    }
    if (text !== null) out.push({ specialist, dispatch: d, text, source });
  }
  return out;
}

/** Fences named `json questions` whose content does not parse as JSON: their first 80 characters. */
export function unparsableQuestionFences(text) {
  const bad = [];
  for (const m of String(text).matchAll(/```json[ \t]+questions[^\n]*\n([\s\S]*?)```/g)) {
    try {
      JSON.parse(m[1]);
    } catch {
      bad.push(m[1].trim().slice(0, 80));
    }
  }
  return bad;
}

const brief = (q) => `${q.id ?? "?"} blocking=${q.blocking}`;

/** The naming questions of the hand-backs, the fence failures and a one-line report of who raised what. */
export function namingReport(transcript) {
  const backs = specialistHandbacks(transcript);
  const naming = [];
  const unparsable = [];
  for (const b of backs) {
    for (const f of unparsableQuestionFences(b.text)) unparsable.push(`${b.specialist}: ${JSON.stringify(f)}`);
    for (const block of questionsBlocks(b.text)) for (const q of Array.isArray(block.questions) ? block.questions : []) if (q && mentions(q, "coupons", "promotions")) naming.push({ specialist: b.specialist, q });
  }
  const raised = naming.length ? `naming question raised by ${naming.map((n) => `${n.specialist} (${brief(n.q)})`).join(", ")}` : "naming question raised by no specialist";
  const report = `${raised}; hand-backs: ${backs.map((b) => `${b.specialist} [${b.source}]`).join(", ") || "none"}`;
  return { backs, naming, unparsable, report };
}

export default {
  id: "TS-224",
  title: "No specialist flags a naming preference as blocking",
  agent: "architect:sdd-conductor",
  plugins: [architectReal],
  fixture: twoCheckoutSpecStart(NAMING_IDEATION),
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 30,
  prompt: "Draft the spec of CHG-001 unattended, I'll review at the gate.",
  assert({ transcript, log = console.log }) {
    const { failures, check } = checker();
    const { backs, naming, unparsable, report } = namingReport(transcript);
    log(`  TS-224: ${report}`);
    check(backs.length > 0, `no specialist hand-back (dispatched: ${dispatches(transcript).map((x) => x.type).join(", ") || "none"}); ${report}`);
    for (const u of unparsable) check(false, `a "json questions" fence does not parse: ${u}; ${report}`);
    for (const n of naming) check(n.q.blocking === false, `${n.specialist}'s naming question is not "blocking": false: ${brief(n.q)}; ${report}`);
    return failures;
  },
};
