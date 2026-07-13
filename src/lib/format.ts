const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string) {
  let formatter = formatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: currency === "PYG" ? "code" : "symbol",
      maximumFractionDigits: currency === "PYG" ? 0 : 2,
    });
    formatterCache.set(currency, formatter);
  }
  return formatter;
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return getFormatter(currency).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatUsd(amount: number): string {
  return getFormatter("USD").format(amount);
}
