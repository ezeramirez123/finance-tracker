"use client";

import { createContext, useContext, useMemo } from "react";

import { formatMoney } from "@/lib/format";

type HomeCurrencyContextValue = {
  currency: string;
  rate: number;
};

const HomeCurrencyContext = createContext<HomeCurrencyContextValue>({
  currency: "USD",
  rate: 1,
});

export function HomeCurrencyProvider({
  currency,
  rate,
  children,
}: {
  currency: string;
  rate: number;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ currency, rate }), [currency, rate]);
  return <HomeCurrencyContext.Provider value={value}>{children}</HomeCurrencyContext.Provider>;
}

export function useHomeCurrency() {
  return useContext(HomeCurrencyContext);
}

/** Converts a USD-denominated amount into the user's chosen home currency
 * and formats it — every amount is still stored/computed in USD, this only
 * affects display, using the day's exchange rate fetched once per page load. */
export function useFormatHome() {
  const { currency, rate } = useContext(HomeCurrencyContext);
  return (usdAmount: number) => formatMoney(usdAmount * rate, currency);
}
