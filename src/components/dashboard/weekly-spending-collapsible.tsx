"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatUsd } from "@/lib/format";

type WeekSpending = { from: string; to: string; total: number };

export function WeeklySpendingCollapsible({ weeks }: { weeks: WeekSpending[] }) {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const mostRecentFirst = [...weeks].reverse();
  const max = Math.max(...weeks.map((w) => w.total), 0.01);
  const total = weeks.reduce((sum, w) => sum + w.total, 0);

  function goToWeek(week: WeekSpending) {
    const params = new URLSearchParams();
    params.set("period", "custom");
    params.set("from", week.from.slice(0, 10));
    params.set("to", week.to.slice(0, 10));
    router.push(`/expenses?${params.toString()}`);
  }

  return (
    <Card className="gap-0 py-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-1.5 px-5 py-5 text-left">
          <span className="text-sm font-medium text-muted-foreground">
            Weekly spending (past month)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">{formatUsd(total)}</span>
            <ChevronDown
              className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-3 pb-5">
            {mostRecentFirst.map((week) => (
              <button
                key={week.from}
                type="button"
                onClick={() => goToWeek(week)}
                className="flex cursor-pointer flex-col gap-1 rounded-md p-1 text-left transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {format(parseISO(week.from), "MMM d")} –{" "}
                    {format(parseISO(week.to), "MMM d")}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatUsd(week.total)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[var(--chart-critical)]"
                    style={{ width: `${Math.max((week.total / max) * 100, 3)}%` }}
                  />
                </div>
              </button>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
