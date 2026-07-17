"use client";

import CurrencyInputField from "react-currency-input-field";

import { cn } from "@/lib/utils";

function currencyPrefix(currency: string): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: currency === "PYG" ? "code" : "symbol",
  }).format(0);
  return formatted.match(/^\D+/)?.[0] ?? "";
}

export function CurrencyInput({
  id,
  value,
  currency,
  onChange,
  autoFocus,
}: {
  id?: string;
  value: number;
  currency: string;
  onChange: (value: number) => void;
  autoFocus?: boolean;
}) {
  const isPyg = currency === "PYG";

  return (
    <CurrencyInputField
      id={id}
      value={value}
      autoFocus={autoFocus}
      prefix={currencyPrefix(currency)}
      groupSeparator=","
      decimalSeparator="."
      decimalsLimit={isPyg ? 0 : 2}
      allowDecimals={!isPyg}
      allowNegativeValue={false}
      onValueChange={(_value, _name, values) => {
        onChange(values?.float ?? 0);
      }}
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
      )}
    />
  );
}
