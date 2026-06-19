export function toCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function roundToCents(amount: number): number {
  return fromCents(toCents(amount));
}