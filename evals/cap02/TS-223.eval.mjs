// C001-TC-223 — verifies C001-TS-223 (C001-AC-208.2, C001-REQ-208): the cartographer flags an entry-point
// scope question as blocking. Built like evals/cap02/TS-215.eval.mjs (CHG-001 D-017, C001-T-082): the real
// cartographer runs (architectReal) on the TS-215 brownfield fixture, a shop with two live checkouts
// ("src/checkout/totals.ts", web; "src/kiosk/totals.ts", in-store kiosk), and the approved lite ideation
// says only "checkout applies the discount before tax". Which checkout is in scope decides the entry
// points of the change, so C001-IF-05 `questions.md` §1 criterion 1 (scope) makes the question blocking,
// even when the cartographer surveys both checkouts (covering every option counts as an assumption).
// The assert reads only the cartographer's hand-back to the conductor: a questions block valid against
// C001-IF-05, with a question whose question text or option labels contain both "web" and "kiosk"
// (case-insensitive) and "blocking": true. What the conductor does with it is C001-TS-215.
import { checker, dispatches, handback } from "../harness/assert.mjs";
import { architectReal } from "../harness/overlay.mjs";
import { questionsBlocks, questionsErrors } from "../harness/questions.mjs";
import { write } from "../harness/workspaces.mjs";
import { LITE_IDEATION, specStart } from "./drafting.mjs";
import { timeline } from "./arrival.mjs";

// The repository files of the TS-215 Given, verbatim (TS-215.eval.mjs keeps its own copy: C001-T-082
// changes only its header comment).
const WEB = `// Web checkout totals: net line prices in EUR cents; VAT is added on the net total.
export interface Line {
  sku: string;
  netCents: number;
  qty: number;
}

export const VAT_RATE = 0.2;

export function netTotal(lines: Line[]): number {
  return lines.reduce((s, l) => s + l.netCents * l.qty, 0);
}

export function orderTotal(lines: Line[]): { netCents: number; vatCents: number; grossCents: number } {
  const netCents = netTotal(lines);
  const vatCents = Math.round(netCents * VAT_RATE);
  return { netCents, vatCents, grossCents: netCents + vatCents };
}
`;

const KIOSK = `// In-store kiosk totals: shelf prices are tax-inclusive, in the store's currency (EUR, CHF or GBP);
// the gross total is converted to EUR when the payment intent is created.
import { createIntent, type Intent } from "../checkout/payments.ts";

export type Currency = "EUR" | "CHF" | "GBP";
export const TO_EUR: Record<Currency, number> = { EUR: 1, CHF: 1.04, GBP: 1.17 };

export interface ShelfItem {
  sku: string;
  grossCents: number;
  qty: number;
}

export function kioskTotal(items: ShelfItem[]): number {
  return items.reduce((s, i) => s + i.grossCents * i.qty, 0);
}

export function kioskIntent(items: ShelfItem[], currency: Currency): Intent {
  return createIntent(Math.round(kioskTotal(items) * TO_EUR[currency]), "EUR");
}
`;

const INDEX = `// Entry points: the web shop and the in-store kiosk both take orders today.
export { orderTotal } from "./checkout/totals.ts";
export { kioskIntent } from "./kiosk/totals.ts";
`;

const TESTS = `import { test } from "node:test";
import assert from "node:assert/strict";
import { orderTotal } from "../src/checkout/totals.ts";
import { kioskIntent } from "../src/kiosk/totals.ts";

test("web total adds VAT to the net total", () => {
  assert.deepEqual(orderTotal([{ sku: "a", netCents: 1000, qty: 2 }]), { netCents: 2000, vatCents: 400, grossCents: 2400 });
});

test("kiosk total converts the gross shelf total to EUR", () => {
  assert.equal(kioskIntent([{ sku: "b", grossCents: 1000, qty: 1 }], "CHF").amountCents, 1040);
});
`;

/** The two-checkout repository of the TS-215 Given (also used by TS-224). */
export function twoCheckouts(root) {
  write(root, "src/checkout/totals.ts", WEB);
  write(root, "src/kiosk/totals.ts", KIOSK);
  write(root, "src/index.ts", INDEX);
  write(root, "tests/totals.test.ts", TESTS);
}

/** Spec start of the brownfield change on the two-checkout repository, with the given ideation. */
export const twoCheckoutSpecStart = (ideation = LITE_IDEATION) => specStart({ brownfield: true, kind: "brownfield", ideation, extra: twoCheckouts });

/** True when the question text or one of its option labels contains every word (case-insensitive). */
export const mentions = (q, ...needles) => {
  const text = [q.question, ...(q.options ?? []).map((o) => o.label)].map((s) => String(s ?? "").toLowerCase());
  return needles.every((n) => text.some((s) => s.includes(n)));
};

/**
 * The questions of the first cartographer hand-back, with the checks every TS-223-style case makes:
 * the cartographer was dispatched, its hand-back holds a questions block and every block is valid
 * against C001-IF-05. Returns `{ failures, check, questions }`; `questions` is null when a check failed.
 */
export function cartographerQuestions(transcript) {
  const { failures, check } = checker();
  const d = dispatches(transcript);
  const carto = d.find((x) => x.type.endsWith("sdd-cartographer"));
  if (!check(carto, `cartographer not dispatched (dispatched: ${d.map((x) => x.type).join(", ") || "none"})`)) return { failures, check, questions: null };
  const back = handback(transcript, carto);
  const blocks = questionsBlocks(back?.text ?? "");
  if (!check(blocks.length > 0, `the cartographer's hand-back has no questions block (hand-back: ${back ? JSON.stringify(back.text.slice(-300)) : "none"})`)) return { failures, check, questions: null };
  let valid = true;
  for (const b of blocks) for (const e of questionsErrors(b)) valid = check(false, `questions block invalid against C001-IF-05: ${e}`) && valid;
  return { failures, check, questions: valid ? blocks.flatMap((b) => b.questions ?? []) : null };
}

const brief = (q) => `${q.id ?? "?"} blocking=${q.blocking}: ${q.question}`;

export default {
  id: "TS-223",
  title: "Cartographer flags an entry-point scope question as blocking",
  agent: "architect:sdd-conductor",
  plugins: [architectReal],
  fixture: twoCheckoutSpecStart(),
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  // 30 turns, as TS-215 (the conductor needs more than 22 to reach the cartographer, t063-d013).
  maxTurns: 30,
  prompt: "Draft the spec of CHG-001 unattended, I'll review at the gate.",
  // Ends the session once the check is decided (C002-T-072): the assert reads the hand-back of the first
  // cartographer call only, which is final when that call arrives (its task_notification, or the tool result
  // of a synchronous call; arrival.mjs). The hand-back fixes the outcome, pass or failure.
  stopWhen: (transcript) => (timeline(transcript).agents.find((a) => a.type.endsWith("sdd-cartographer"))?.arrival ?? null) !== null,
  assert({ transcript }) {
    const { failures, check, questions } = cartographerQuestions(transcript);
    if (!questions) return failures;
    const scope = questions.filter((q) => mentions(q, "web", "kiosk"));
    check(scope.length > 0, `no question names both "web" and "kiosk" (questions: ${questions.map(brief).join(" | ")})`);
    if (scope.length > 0) check(scope.some((q) => q.blocking === true), `the web-or-kiosk scope question is not blocking: ${scope.map(brief).join(" | ")}`);
    return failures;
  },
};
