"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, parseISO, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IncomeExpenseTrendGraph } from "@/components/dashboard/income-expense-trend-chart";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/format";

type DayTotal = { date: string; income: number; expense: number };

function DayCell({ day, onClick }: { day: DayTotal; onClick: (date: string) => void }) {
  const parsed = parseISO(day.date);
  const today = isToday(parsed);

  return (
    <button
      type="button"
      onClick={() => onClick(day.date)}
      className={cn(
        "flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-md border p-2 text-center transition-colors hover:bg-accent",
        today && "border-primary"
      )}
    >
      <span className="text-xs font-bold">{format(parsed, "EEE")}</span>
      <span className="text-sm font-bold">{format(parsed, "d")}</span>
      <span className="text-[11px] tabular-nums text-chart-good">
        {day.income > 0 ? `+${formatUsd(day.income)}` : formatUsd(0)}
      </span>
      <span className="text-[11px] tabular-nums text-chart-critical">
        {day.expense > 0 ? `-${formatUsd(day.expense)}` : formatUsd(0)}
      </span>
    </button>
  );
}

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
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function goToWeekOffset(offset: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (offset === 0) {
      params.delete("weekOffset");
    } else {
      params.set("weekOffset", String(offset));
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const title =
    weekOffset === 0
      ? "This week"
      : `${format(parseISO(days[0].date), "MMM d")} – ${format(parseISO(days[6].date), "MMM d")}`;

  const weekIncome = days.reduce((sum, d) => sum + d.income, 0);
  const weekExpense = days.reduce((sum, d) => sum + d.expense, 0);
  const weekNet = weekIncome - weekExpense;

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-full sm:size-7 sm:rounded-md"
            onClick={() => goToWeekOffset(weekOffset - 1)}
            aria-label="Previous week"
          >
            <ChevronLeft className="size-5 sm:size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-full sm:size-7 sm:rounded-md"
            onClick={() => goToWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            aria-label="Next week"
          >
            <ChevronRight className="size-5 sm:size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 border-b pb-4">
          <IncomeExpenseTrendGraph data={days} variant="bar" />
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 border-b pb-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-sm font-semibold tabular-nums text-chart-good">
              {formatUsd(weekIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-sm font-semibold tabular-nums text-chart-critical">
              {formatUsd(weekExpense)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net</p>
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                weekNet >= 0 ? "text-chart-good" : "text-chart-critical"
              )}
            >
              {formatUsd(weekNet)}
            </p>
          </div>
        </div>

        <div className="sm:hidden">
          <div className="grid grid-cols-4 gap-2">
            {days.slice(0, 4).map((day) => (
              <DayCell key={day.date} day={day} onClick={goToDay} />
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-2">
            {days.slice(4).map((day) => (
              <div key={day.date} className="basis-[calc((100%-1.5rem)/4)]">
                <DayCell day={day} onClick={goToDay} />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden gap-2 sm:grid sm:grid-cols-7">
          {days.map((day) => (
            <DayCell key={day.date} day={day} onClick={goToDay} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
