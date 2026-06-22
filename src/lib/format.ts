const eurFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentInputFormatter = new Intl.NumberFormat("en-US", {
  useGrouping: false,
  maximumFractionDigits: 6,
});

export function formatCurrency(value: number): string {
  return eurFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPercentInputValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  return percentInputFormatter.format(value * 100);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
