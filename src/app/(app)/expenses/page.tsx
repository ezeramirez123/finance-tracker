import { format, parseISO } from "date-fns";

import { auth } from "@/lib/auth";
import { getDateRange, type Period } from "@/lib/period";
import {
  getPeriodSummary,
  getExpenseTransactions,
  getDailyBreakdown,
  getWeeklyBreakdown,
} from "@/lib/dashboard-data";
import { PeriodTabs } from "@/components/period-tabs";
import { CategoryPieBreakdown } from "@/components/dashboard/category-pie-breakdown";
import { MetricTrendChart } from "@/components/dashboard/metric-trend-chart";
import { CategoryFilterSelect } from "@/components/dashboard/category-filter-select";
import { TransactionListCard } from "@/components/dashboard/transaction-list-card";
import { PeriodBreakdownCollapsible } from "@/components/period-breakdown-collapsible";
import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";

// Values match the shared `Period` type so a period selected on the Dashboard
// (or any other page) survives a cross-page link unchanged.
const PRESET_PERIODS = ["today", "week", "month", "year"] as const;

const TAB_OPTIONS = [
  { value: "today", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string; category?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const isCustom = params.period === "custom" && !!params.from && !!params.to;
  const tab = !isCustom && PRESET_PERIODS.includes(params.period as (typeof PRESET_PERIODS)[number])
    ? (params.period as (typeof PRESET_PERIODS)[number])
    : "week";
  const range = isCustom
    ? getDateRange("custom", { from: new Date(params.from!), to: new Date(params.to!) })
    : getDateRange(tab as Period);

  const [summary, expenseTransactions] = await Promise.all([
    getPeriodSummary(userId, range),
    getExpenseTransactions(userId, range, params.category),
  ]);

  const filteredCategory = params.category
    ? summary.spendingByCategory.find((c) => c.id === params.category)
    : undefined;

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
        <div className="flex flex-wrap items-center gap-2">
          <CategoryFilterSelect categories={summary.spendingByCategory} category={params.category} />
          <PeriodTabs period={isCustom ? "" : tab} options={TAB_OPTIONS} />
        </div>
      </div>

      <Card className="gap-3">
        <div className="flex items-start justify-between px-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total expenses</p>
            <p className="text-2xl font-semibold tracking-tight">
              {formatUsd(summary.totalExpenses)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">Transactions</p>
            <p className="text-2xl font-semibold tracking-tight">{expenseTransactions.length}</p>
          </div>
        </div>
        <div className="px-5">
          <MetricTrendChart
            color="var(--chart-critical)"
            data={summary.dailyTrend.map((d) => ({ date: d.date, value: d.expense }))}
          />
        </div>
      </Card>

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

      <CategoryPieBreakdown title="Spending by category" categories={summary.spendingByCategory} />

      <TransactionListCard
        title={filteredCategory ? `Expenses · ${filteredCategory.name}` : "All expenses"}
        transactions={expenseTransactions.map((t) => ({
          ...t,
          originalAmount: Number(t.originalAmount),
        }))}
        emptyLabel="No expenses in this period"
      />
    </div>
  );
}
