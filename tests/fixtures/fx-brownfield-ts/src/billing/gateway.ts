// fx-brownfield-ts: card gateway stub.
export interface Card {
  number: string;
  expiry: string;
}

export function chargeCard(card: Card, amountCents: number): boolean {
  return card.number.length === 16 && amountCents < 1_000_000;
}
