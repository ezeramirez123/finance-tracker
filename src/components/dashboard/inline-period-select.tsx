"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePersistedPeriod } from "@/lib/use-persisted-period";

const OPTIONS = [
  { value: "today", label: "1D" },
  { value: "week", label: "1W" },
  { value: "month", label: "1M" },
  { value: "year", label: "1Y" },
  { value: "all", label: "ALL" },
] as const;

/** Compact single-line time-range picker (1D/1W/1M/1Y/ALL/Custom), e.g. for
 * embedding inside a summary card instead of a page-level dropdown. */
export function InlinePeriodSelect({
  period,
  from,
  to,
  persistKey,
}: {
  period: string;
  from?: string;
  to?: string;
  persistKey: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = React.useState(from ?? "");
  const [customTo, setCustomTo] = React.useState(to ?? "");
  const [datePopoverOpen, setDatePopoverOpen] = React.useState(false);
  const persistPeriod = usePersistedPeriod(persistKey);

  const isCustom = period === "custom" || datePopoverOpen;

  function setPeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    params.delete("from");
    params.delete("to");
    setDatePopoverOpen(false);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    persistPeriod(value);
  }

  function applyCustomRange() {
    if (!customFrom || !customTo) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set("from", customFrom);
    params.set("to", customTo);
    setDatePopoverOpen(false);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    persistPeriod("custom", customFrom, customTo);
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 text-xs">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setPeriod(opt.value)}
          className={cn(
            "cursor-pointer rounded-md px-1.5 py-1 font-medium transition-colors",
            !isCustom && period === opt.value
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}

      <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "cursor-pointer rounded-md px-1.5 py-1 font-medium transition-colors",
              isCustom
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isCustom && from && to
              ? `${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d")}`
              : "Custom"}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="flex w-64 flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
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
    </div>
  );
}
