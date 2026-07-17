import { format, parseISO } from "date-fns";

import { auth } from "@/lib/auth";
import { getDateRange, type Period } from "@/lib/period";
import {
  getPeriodSummary,
  getIncomeTransactions,
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
import { readPersistedPeriod } from "@/lib/period-cookie";

// Values match the shared `Period` type so a period selected on the Dashboard
// (or any other page) survives a cross-page link unchanged.
const PRESET_PERIODS = ["today", "week", "month", "year"] as const;

const TAB_OPTIONS = [
  { value: "today", label: "Day" },
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

  const persisted = params.period ? null : await readPersistedPeriod("income");
  const effectivePeriod = params.period ?? persisted?.period;
  const effectiveFrom = params.from ?? persisted?.from;
  const effectiveTo = params.to ?? persisted?.to;

  const isCustom = effectivePeriod === "custom" && !!effectiveFrom && !!effectiveTo;
  const tab = !isCustom && PRESET_PERIODS.includes(effectivePeriod as (typeof PRESET_PERIODS)[number])
    ? (effectivePeriod as (typeof PRESET_PERIODS)[number])
    : "week";
  const range = isCustom
    ? getDateRange("custom", { from: new Date(effectiveFrom!), to: new Date(effectiveTo!) })
    : getDateRange(tab as Period);

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
        <h1 className="text-xl font-semibold tracking-tight">Income</h1>
        <PeriodTabs
          period={isCustom ? "" : tab}
          options={TAB_OPTIONS}
          persistKey="income"
        />
      </div>

      <Card className="gap-3">
        <div className="flex items-start justify-between px-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total income</p>
            <p className="text-2xl font-semibold tracking-tight">
              {formatUsd(summary.totalIncome)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">Transactions</p>
            <p className="text-2xl font-semibold tracking-tight">{incomeTransactions.length}</p>
          </div>
        </div>
        <div className="px-5">
          <MetricTrendChart
            color="var(--chart-good)"
            data={summary.dailyTrend.map((d) => ({ date: d.date, value: d.income }))}
          />
        </div>
      </Card>

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

      <CategoryPieBreakdown
        title="Income by category"
        categories={summary.incomeByCategory}
        action={
          <CategoryFilterSelect categories={summary.incomeByCategory} category={params.category} />
        }
      />

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
