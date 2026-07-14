import { db } from "@/lib/db";

const RATES_API_URL = "https://open.er-api.com/v6/latest/USD";

export const SUPPORTED_CURRENCIES = ["USD", "PYG", "BRL", "EUR"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

type RatesMap = Record<string, number>;

function dateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function fetchRatesFromApi(): Promise<RatesMap> {
  const res = await fetch(RATES_API_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch exchange rates: ${res.status}`);
  }
  const data = await res.json();
  if (data.result !== "success") {
    throw new Error("Exchange rate API returned an error result");
  }
  return data.rates as RatesMap;
}

/**
 * Returns USD-based rates for the given date, using the daily cache table.
 * Falls back to today's rates if the exact historical date isn't cached
 * (open.er-api.com only exposes current rates on the free tier).
 */
export async function getUsdRatesForDate(date: Date): Promise<RatesMap> {
  const day = dateOnly(date);

  const cached = await db.exchangeRateCache.findUnique({
    where: { date_baseCurrency: { date: day, baseCurrency: "USD" } },
  });
  if (cached) {
    return cached.ratesJson as RatesMap;
  }

  const rates = await fetchRatesFromApi();

  await db.exchangeRateCache.upsert({
    where: { date_baseCurrency: { date: day, baseCurrency: "USD" } },
    create: { date: day, baseCurrency: "USD", ratesJson: rates },
    update: { ratesJson: rates },
  });

  return rates;
}

/** Converts an amount in `currency` to USD, using rates for the given date. */
export async function convertToUsd(
  amount: number,
  currency: string,
  date: Date = new Date()
): Promise<{ usdEquivalent: number; exchangeRateToUsd: number }> {
  if (currency === "USD") {
    return { usdEquivalent: amount, exchangeRateToUsd: 1 };
  }

  const rates = await getUsdRatesForDate(date);
  const rate = rates[currency];
  if (!rate) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  // rates are USD -> currency, so 1 unit of `currency` = 1/rate USD
  const exchangeRateToUsd = 1 / rate;
  return {
    usdEquivalent: amount * exchangeRateToUsd,
    exchangeRateToUsd,
  };
}

export async function getLatestUsdRates(): Promise<RatesMap> {
  return getUsdRatesForDate(new Date());
}

/** Converts a USD amount into `currency`, using rates for the given date. */
export async function convertFromUsd(
  usdAmount: number,
  currency: string,
  date: Date = new Date()
): Promise<number> {
  if (currency === "USD") return usdAmount;

  const rates = await getUsdRatesForDate(date);
  const rate = rates[currency];
  if (!rate) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  return usdAmount * rate;
}
