import { format, parseISO } from "date-fns";

import { auth } from "@/lib/auth";
import { getDateRange } from "@/lib/period";
import {
  getPeriodSummary,
  getIncomeTransactions,
  getDailyBreakdown,
  getWeeklyBreakdown,
} from "@/lib/dashboard-data";
import { PeriodTabs } from "@/components/period-tabs";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart";
import { CategoryFilterSelect } from "@/components/dashboard/category-filter-select";
import { TransactionListCard } from "@/components/dashboard/transaction-list-card";
import { PeriodBreakdownCollapsible } from "@/components/period-breakdown-collapsible";
import { Card } from "@/components/ui/card";

const TAB_TO_PERIOD = { day: "today", week: "week", month: "month", year: "year" } as const;

const TAB_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string; category?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const isCustom = params.period === "custom" && !!params.from && !!params.to;
  const tab = !isCustom && (params.period as keyof typeof TAB_TO_PERIOD) in TAB_TO_PERIOD
    ? (params.period as keyof typeof TAB_TO_PERIOD)
    : "week";
  const range = isCustom
    ? getDateRange("custom", { from: new Date(params.from!), to: new Date(params.to!) })
    : getDateRange(TAB_TO_PERIOD[tab]);

  const [summary, incomeTransactions] = await Promise.all([
    getPeriodSummary(userId, range),
    getIncomeTransactions(userId, range, params.category),
  ]);

  const filteredCategory = params.category
    ? summary.incomeByCategory.find((c) => c.id === params.category)
    : undefined;

  const dailyBreakdown =
    !isCustom && tab === "week" ? await getDailyBreakdown(userId, range, "income") : null;
  const weeklyBreakdown =
    !isCustom && tab === "month" ? await getWeeklyBreakdown(userId, range, "income") : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Income</h1>
          <p className="text-sm text-muted-foreground">
            Just the money coming in.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryFilterSelect categories={summary.incomeByCategory} category={params.category} />
          <PeriodTabs period={isCustom ? "" : tab} options={TAB_OPTIONS} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Total income" value={summary.totalIncome} />
        <Card className="gap-1.5">
          <p className="px-5 text-sm font-medium text-muted-foreground">Transactions</p>
          <p className="px-5 text-3xl font-semibold tracking-tight">
            {incomeTransactions.length}
          </p>
        </Card>
      </div>

      {dailyBreakdown && (
        <PeriodBreakdownCollapsible
          title="Income by day"
          barColorVar="--chart-good"
          buckets={dailyBreakdown.map((d) => ({
            label: format(parseISO(d.date), "EEE, MMM d"),
            total: d.total,
            from: d.date,
            to: d.date,
          }))}
        />
      )}

      {weeklyBreakdown && (
        <PeriodBreakdownCollapsible
          title="Income by week"
          barColorVar="--chart-good"
          buckets={weeklyBreakdown.map((w) => ({
            label: `${format(parseISO(w.from), "MMM d")} – ${format(parseISO(w.to), "MMM d")}`,
            total: w.total,
            from: w.from,
            to: w.to,
          }))}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryDonutChart title="Income by category" categories={summary.incomeByCategory} />
        <CategoryBreakdown title="Income by category" categories={summary.incomeByCategory} />
      </div>

      <TransactionListCard
        title={filteredCategory ? `Income · ${filteredCategory.name}` : "All income"}
        transactions={incomeTransactions.map((t) => ({
          ...t,
          originalAmount: Number(t.originalAmount),
        }))}
        emptyLabel="No income in this period"
      />
    </div>
  );
}
