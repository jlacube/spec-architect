// C001-TC-215 — verifies C001-TS-215 (C001-AC-213.2, C001-REQ-213; C001-REQ-221): a blocking question
// interrupts unattended mode. In unattended spec drafting of a brownfield change, the cartographer's hand-back
// holds a question with "blocking": true and arrives while the spec-writer still runs; the conductor asks it
// (AskUserQuestion) after the arrival and before its turn ends, with no Agent call between.
// Reworked for CHG-001 D-013: the blocking question used to be planted in a stand-in's scripted hand-back,
// which the real cartographer never reads. The real cartographer runs now (architectReal), and the
// repository itself holds a question only P-01 can settle: the shop has two live checkouts whose totals
// work differently (web: net prices in EUR, tax added after; kiosk: tax-inclusive prices in the store's
// currency, converted to EUR at capture), while the approved ideation says "the checkout applies the
// discount before tax" without naming one. Which checkout is in scope decides the entry points of the
// change, so the question is blocking under C001-IF-05 `questions.md` §1 criterion 1 (scope), even when
// the cartographer surveys both checkouts (CHG-001 D-017; the cartographer's flag alone is C001-TS-223).
// Revised for D-019 (C001-T-083): the checks are the arrival-to-ask checks of C001-AC-221.1, shared with
// C001-TC-225 (arrival.mjs), on the terms of its note. In the t082-d018 trace the hand-back arrived at 235 s
// and the turn ended at 238 s with the question unasked. A run whose Given does not hold (no cartographer,
// no blocking question in its hand-back, or the spec-writer not still running at the arrival) is reported
// "Given not met" with `valid_run` false, distinct from a conductor failure.
import { architectReal } from "../harness/overlay.mjs";
import { write } from "../harness/workspaces.mjs";
import { assertAskOnArrival, blockingQuestions, carries, timeline } from "./arrival.mjs";
import { specStart } from "./drafting.mjs";

const isAgent = (type, agent) => type === agent || type.endsWith(`:${agent}`);

/**
 * The stop condition of TS-215 and TS-225 (C002-IF-010 §2.2 Early stop when the check is decided, item 1;
 * C002-T-072): true once no later record can change the outcome of `askOnArrival`, the assert. It reads the
 * terms of that check only:
 * - the cartographer hand-back the check takes is the first cartographer call, in dispatch order, that has
 *   arrived with a blocking question; it is known once every cartographer call dispatched before it has
 *   arrived (an earlier one could still arrive with a blocking question);
 * - from its arrival on, "Given not met" is decided when no spec-writer call was dispatched before the
 *   arrival or one had handed back before it;
 * - a pass is decided at the `answer` record of the AskUserQuestion call that carries the blocking question,
 *   after the arrival and before the first `result` message after it (the call's ask is then fixed, and so
 *   are the Agent calls between the arrival and it);
 * - a failure is decided at the first `result` message after the arrival with no such call before it.
 */
export function askDecided(transcript) {
  const { agents, asks, results } = timeline(transcript);
  let carto = null;
  for (const a of agents.filter((x) => isAgent(x.type, "sdd-cartographer"))) {
    if (a.arrival === null) return false;
    if (blockingQuestions(a.handback).length > 0) {
      carto = a;
      break;
    }
  }
  if (!carto) return false;
  const at = carto.arrival;
  const writers = agents.filter((a) => isAgent(a.type, "sdd-spec-writer") && a.i < at);
  if (writers.length === 0 || writers.some((w) => w.arrival !== null && w.arrival < at)) return true;
  const blocking = blockingQuestions(carto.handback);
  const end = results.find((i) => i > at) ?? transcript.length;
  const ask = asks.find((a) => a.i > at && a.i < end && a.questions.some((q) => blocking.some((b) => carries(q?.question, b.question))));
  if (ask) return transcript.slice(ask.i + 1, end).some((r) => r?.type === "harness" && r.event === "answer" && (r.questions ?? []).some((q) => blocking.some((b) => carries(q?.question, b.question))));
  return end < transcript.length;
}

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
  // Ends the session once the check is decided (C002-T-072): see askDecided.
  stopWhen: (transcript) => askDecided(transcript),
  assert({ transcript, log }) {
    return assertAskOnArrival("TS-215", { transcript, log });
  },
};
