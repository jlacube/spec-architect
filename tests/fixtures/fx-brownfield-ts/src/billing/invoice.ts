// fx-brownfield-ts: invoices issued after capture.
import type { Intent } from "../checkout/payments.ts";

export interface Invoice {
  intentId: string;
  totalCents: number;
}

export function issueInvoice(intent: Intent): Invoice | null {
  return intent.status === "captured" ? { intentId: intent.id, totalCents: intent.amountCents } : null;
}
