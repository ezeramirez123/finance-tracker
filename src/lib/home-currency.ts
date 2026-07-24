import { db } from "@/lib/db";
import { getUsdRatesForDate } from "@/lib/currency";
import { formatMoney } from "@/lib/format";

/** Server-side helper for pages that format USD-denominated totals directly
 * in JSX. Every amount is still stored/computed in USD — this only converts
 * at render time, using today's exchange rate, into the user's chosen home
 * currency (Profile > Home currency). The rate is fetched once and reused
 * for every amount on the page, so the returned `format` is synchronous and
 * safe to call inline in JSX. */
export async function getHomeCurrencyFormatter(userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { homeCurrency: true },
  });
  const currency = user.homeCurrency;

  if (currency === "USD") {
    return { currency, format: (usdAmount: number) => formatMoney(usdAmount, "USD") };
  }

  const rates = await getUsdRatesForDate(new Date());
  const rate = rates[currency] ?? 1;

  return {
    currency,
    format: (usdAmount: number) => formatMoney(usdAmount * rate, currency),
  };
}
