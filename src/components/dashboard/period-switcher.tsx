"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePersistedPeriod } from "@/lib/use-persisted-period";

const OPTIONS = [
  { value: "today", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

export function PeriodSwitcher({
  period,
  from,
  to,
}: {
  period: string;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = React.useState(from ?? "");
  const [customTo, setCustomTo] = React.useState(to ?? "");
  const persistPeriod = usePersistedPeriod();

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
    <div className="flex flex-wrap items-center gap-1 rounded-lg border p-1">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          size="sm"
          variant={period === opt.value ? "default" : "ghost"}
          className="h-7 px-2.5 text-xs"
          onClick={() => setPeriod(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={period === "custom" ? "default" : "ghost"}
            className={cn("h-7 max-w-[130px] shrink-0 truncate px-2.5 text-xs")}
          >
            {period === "custom" && from && to
              ? `${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d")}`
              : "Custom"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="flex flex-col gap-3 w-64">
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
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={applyCustomRange}>
            Apply
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
