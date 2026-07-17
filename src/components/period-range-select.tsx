"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePersistedPeriod } from "@/lib/use-persisted-period";

const OPTIONS = [
  { value: "today", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom" },
] as const;

export function PeriodRangeSelect({
  period,
  from,
  to,
  persistKey,
}: {
  period: string;
  from?: string;
  to?: string;
  /** Unique key to persist this period under (see usePersistedPeriod). */
  persistKey: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = React.useState(from ?? "");
  const [customTo, setCustomTo] = React.useState(to ?? "");
  const persistPeriod = usePersistedPeriod(persistKey);

  function setPeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    if (value !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    router.push(`${pathname}?${params.toString()}`);
    persistPeriod(value);
  }

  function applyCustomRange() {
    if (!customFrom || !customTo) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set("from", customFrom);
    params.set("to", customTo);
    router.push(`${pathname}?${params.toString()}`);
    persistPeriod("custom", customFrom, customTo);
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="w-[110px] min-w-0 shrink-0">
          <SelectValue placeholder="Period" className="min-w-0 truncate" />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {period === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 max-w-[150px] shrink-0 truncate">
              {from && to
                ? `${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d")}`
                : "Pick dates"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="flex w-64 flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">From</label>
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
            <Button size="sm" onClick={applyCustomRange}>
              Apply
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
