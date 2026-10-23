// C001-TC-215 — verifies C001-TS-215 (C001-AC-213.2, C001-REQ-213): a blocking question interrupts
// unattended mode. In unattended spec drafting of a brownfield change, the cartographer returns a question
// with "blocking": true; the conductor asks it (AskUserQuestion) before dispatching any further author.
// Reworked for CHG-001 D-013: the blocking question used to be planted in a stand-in's scripted hand-back,
// which the real cartographer never reads. The real cartographer runs now (architectReal), and the
// repository itself holds a question only P-01 can settle: the shop has two live checkouts whose totals
// work differently (web: net prices in EUR, tax added after; kiosk: tax-inclusive prices in the store's
// currency, converted to EUR at capture), while the approved ideation says "the checkout applies the
// discount before tax" without naming one. The evidence cannot be completed correctly without knowing
// which checkout is in scope (sdd-conventions: blocking).
// The assert reads the real hand-back: if the cartographer returned no blocking question, the case's Given
// did not occur and the run fails with "Given not met" (distinct from a conductor failure).
import { askUserQuestions, checker, dispatches, handback, handbackQuestions } from "../harness/assert.mjs";
import { architectReal } from "../harness/overlay.mjs";
import { write } from "../harness/workspaces.mjs";
import { specStart } from "./drafting.mjs";

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

function twoCheckouts(root) {
  write(root, "src/checkout/totals.ts", WEB);
  write(root, "src/kiosk/totals.ts", KIOSK);
  write(root, "src/index.ts", INDEX);
  write(root, "tests/totals.test.ts", TESTS);
}

// Words of 5+ letters of a question, to recognise it when the conductor rewords it for AskUserQuestion.
const words = (s) => [...new Set(String(s).toLowerCase().match(/[a-z]{5,}/g) ?? [])];
const carries = (asked, q) => {
  const w = words(q.question);
  const a = String(asked).toLowerCase();
  return w.length > 0 && w.filter((x) => a.includes(x)).length / w.length >= 0.5;
};

export default {
  id: "TS-215",
  title: "Blocking question interrupts unattended mode",
  agent: "architect:sdd-conductor",
  plugins: [architectReal],
  fixture: specStart({ brownfield: true, kind: "brownfield", extra: twoCheckouts }),
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  // 30 turns, within the TS-215 cap exception (C002-IF-010 §2.2): at 22 the conductor ran out of turns
  // before it reached the cartographer (t063-d013, 2026-10-23).
  maxTurns: 30,
  prompt: "Draft the spec of CHG-001 unattended, I'll review at the gate.",
  assert({ transcript }) {
    const { failures, check } = checker();
    const d = dispatches(transcript);
    const carto = d.find((x) => x.type.endsWith("sdd-cartographer"));
    check(carto, `cartographer not dispatched (dispatched: ${d.map((x) => x.type).join(", ") || "none"})`);
    if (!carto) return failures;
    const back = handback(transcript, carto);
    const blocking = handbackQuestions(back?.text).filter((q) => q.blocking === true);
    if (!back || blocking.length === 0) {
      check(false, `Given not met: the cartographer returned no blocking question (hand-back: ${back ? JSON.stringify(back.text.slice(-300)) : "none"})`);
      return failures;
    }
    const answers = transcript.filter((r) => r.type === "harness" && r.event === "answer" && r.t > back.t);
    const asked = answers.find((r) => r.questions.some((aq) => blocking.some((q) => carries(aq.question, q))));
    check(asked, `the blocking question was not asked: ${blocking.map((q) => q.id ?? q.question).join(", ")} (asked: ${askUserQuestions(transcript).flatMap((c) => c.questions.map((q) => q.question)).join(" | ") || "none"})`);
    const later = d.filter((x) => x.t > back.t);
    for (const x of later) check(asked && x.t > asked.t, `${x.type} dispatched before the blocking question was asked`);
    return failures;
  },
};
