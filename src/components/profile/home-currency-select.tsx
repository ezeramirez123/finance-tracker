"use client";

import * as React from "react";
import { toast } from "sonner";

import { updateHomeCurrency } from "@/lib/actions/profile";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function HomeCurrencySelect({ homeCurrency }: { homeCurrency: string }) {
  const [value, setValue] = React.useState(homeCurrency);
  const [pending, startTransition] = React.useTransition();

  function handleChange(next: string) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      try {
        await updateHomeCurrency(next);
        toast.success(`Home currency set to ${next}`);
      } catch {
        setValue(previous);
        toast.error("Couldn't update home currency");
      }
    });
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CURRENCIES.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
