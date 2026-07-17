"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Account = { id: string; name: string; icon: string };
type Category = { id: string; name: string };

const PERIOD_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom" },
] as const;

export function TransactionFilters({
  accounts,
  categories,
  category,
  account,
  period,
  from,
  to,
}: {
  accounts: Account[];
  categories: Category[];
  category?: string;
  account?: string;
  period?: string;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = React.useState(from ?? "");
  const [customTo, setCustomTo] = React.useState(to ?? "");
  const [datePopoverOpen, setDatePopoverOpen] = React.useState(false);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setPeriod(value: string) {
    // "Custom" needs a date range before it means anything, so just open the
    // picker instead of navigating yet — navigating here (even to the same
    // route) re-renders the page behind a loading.tsx Suspense boundary,
    // which remounts this component and would close the popover right after
    // it opens.
    if (value === "custom") {
      setDatePopoverOpen(true);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("period");
    } else {
      params.set("period", value);
    }
    params.delete("from");
    params.delete("to");
    setDatePopoverOpen(false);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function applyDateRange() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    if (customFrom) params.set("from", customFrom);
    else params.delete("from");
    if (customTo) params.set("to", customTo);
    else params.delete("to");
    setDatePopoverOpen(false);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const hasFilters = !!(category || account || period || from || to);

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("account");
    params.delete("period");
    params.delete("from");
    params.delete("to");
    setCustomFrom("");
    setCustomTo("");
    setDatePopoverOpen(false);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={category ?? "all"}
          onValueChange={(v) => updateParam("category", v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[130px] min-w-0 shrink-0">
            <SelectValue placeholder="Category" className="min-w-0 truncate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="truncate">{c.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={account ?? "all"}
          onValueChange={(v) => updateParam("account", v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[130px] min-w-0 shrink-0">
            <SelectValue placeholder="Account" className="min-w-0 truncate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <span className="truncate">
                  {a.icon} {a.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
            <X className="size-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {(period === "custom" || datePopoverOpen) && (
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 max-w-[150px] shrink-0 truncate">
                {from && to ? `${from} – ${to}` : "Pick dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="flex w-64 flex-col gap-3"
              onInteractOutside={(e) => {
                // The period Select restores focus to its own trigger after
                // closing, which fires shortly after this popover opens and
                // would otherwise register as an outside interaction and
                // close it immediately.
                if ((e.target as HTMLElement).closest('[data-slot="select-trigger"]')) {
                  e.preventDefault();
                }
              }}
            >
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
              <Button size="sm" onClick={applyDateRange}>
                Apply
              </Button>
            </PopoverContent>
          </Popover>
        )}

        <Select
          value={datePopoverOpen ? "custom" : period ?? "all"}
          onValueChange={setPeriod}
        >
          <SelectTrigger className="w-[110px] min-w-0 shrink-0">
            <SelectValue placeholder="Period" className="min-w-0 truncate" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
