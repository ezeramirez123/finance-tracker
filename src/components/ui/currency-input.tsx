"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";

export function CurrencyInput({
  id,
  value,
  currency,
  onChange,
}: {
  id?: string;
  value: number;
  currency: string;
  onChange: (value: number) => void;
}) {
  const [focused, setFocused] = React.useState(false);
  const [rawText, setRawText] = React.useState(String(value || ""));

  return (
    <Input
      id={id}
      inputMode="decimal"
      value={focused ? rawText : formatMoney(value, currency)}
      onFocus={() => {
        setRawText(value === 0 ? "" : String(value));
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const text = e.target.value;
        if (!/^-?\d*\.?\d*$/.test(text)) return;
        setRawText(text);
        const parsed = parseFloat(text);
        onChange(Number.isFinite(parsed) ? parsed : 0);
      }}
    />
  );
}
