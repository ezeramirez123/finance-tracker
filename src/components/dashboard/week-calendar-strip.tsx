"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, parseISO, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/format";

type DayTotal = { date: string; income: number; expense: number };

export function WeekCalendarStrip({
  days,
  weekOffset,
}: {
  days: DayTotal[];
  weekOffset: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goToDay(date: string) {
    const params = new URLSearchParams();
    params.set("period", "custom");
    params.set("from", date.slice(0, 10));
    params.set("to", date.slice(0, 10));
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToWeekOffset(offset: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (offset === 0) {
      params.delete("weekOffset");
    } else {
      params.set("weekOffset", String(offset));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const title =
    weekOffset === 0
      ? "This week"
      : `${format(parseISO(days[0].date), "MMM d")} – ${format(parseISO(days[6].date), "MMM d")}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => goToWeekOffset(weekOffset - 1)}
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => goToWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const parsed = parseISO(day.date);
            const today = isToday(parsed);
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => goToDay(day.date)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-md border p-2 text-center transition-colors hover:bg-accent/50",
                  today && "border-primary"
                )}
              >
                <span className="text-xs text-muted-foreground">
                  {format(parsed, "EEE")}
                </span>
                <span className="text-sm font-semibold">{format(parsed, "d")}</span>
                <span className="text-[11px] tabular-nums text-chart-good">
                  {day.income > 0 ? `+${formatUsd(day.income)}` : formatUsd(0)}
                </span>
                <span className="text-[11px] tabular-nums text-chart-critical">
                  {day.expense > 0 ? `-${formatUsd(day.expense)}` : formatUsd(0)}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
