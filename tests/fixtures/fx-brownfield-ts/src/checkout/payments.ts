// fx-brownfield-ts: checkout payments (the churn hotspot of the fixture).
import { chargeCard, type Card } from "../billing/gateway.ts";
import { currentUser } from "../auth/session.ts";

export interface Intent {
  id: string;
  amountCents: number;
  currency: string;
  status: "created" | "captured" | "failed";
}

let counter = 0;

export function createIntent(amountCents: number, currency = "EUR"): Intent {
  if (amountCents <= 0) throw new Error("amount must be positive");
  counter += 1;
  return { id: `pi_${counter}`, amountCents, currency, status: "created" };
}

export function capture(intent: Intent, card: Card): Intent {
  const user = currentUser();
  if (!user) return { ...intent, status: "failed" };
  return chargeCard(card, intent.amountCents) ? { ...intent, status: "captured" } : { ...intent, status: "failed" };
}
