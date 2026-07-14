import { format, parseISO } from "date-fns";

import { auth } from "@/lib/auth";
import { getDateRange } from "@/lib/period";
import {
  getPeriodSummary,
  getExpenseTransactions,
  getDailyBreakdown,
  getWeeklyBreakdown,
} from "@/lib/dashboard-data";
import { PeriodTabs } from "@/components/period-tabs";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart";
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

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
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

  const [summary, expenseTransactions] = await Promise.all([
    getPeriodSummary(userId, range),
    getExpenseTransactions(userId, range),
  ]);

  const dailyBreakdown =
    !isCustom && tab === "week" ? await getDailyBreakdown(userId, range, "expense") : null;
  const weeklyBreakdown =
    !isCustom && tab === "month" ? await getWeeklyBreakdown(userId, range, "expense") : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Just the money going out.
          </p>
        </div>
        <PeriodTabs period={isCustom ? "" : tab} options={TAB_OPTIONS} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Total expenses" value={summary.totalExpenses} />
        <Card className="gap-1.5">
          <p className="px-5 text-sm font-medium text-muted-foreground">Transactions</p>
          <p className="px-5 text-3xl font-semibold tracking-tight">
            {expenseTransactions.length}
          </p>
        </Card>
      </div>

      {dailyBreakdown && (
        <PeriodBreakdownCollapsible
          title="Expenses by day"
          barColorVar="--chart-critical"
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
          title="Expenses by week"
          barColorVar="--chart-critical"
          buckets={weeklyBreakdown.map((w) => ({
            label: `${format(parseISO(w.from), "MMM d")} – ${format(parseISO(w.to), "MMM d")}`,
            total: w.total,
            from: w.from,
            to: w.to,
          }))}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryDonutChart title="Spending by category" categories={summary.spendingByCategory} />
        <CategoryBreakdown title="Spending by category" categories={summary.spendingByCategory} />
      </div>

      <TransactionListCard
        title="All expenses"
        transactions={expenseTransactions.map((t) => ({
          ...t,
          originalAmount: Number(t.originalAmount),
        }))}
        emptyLabel="No expenses in this period"
      />
    </div>
  );
}
