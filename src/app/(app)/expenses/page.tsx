import { differenceInCalendarDays, format, parseISO } from "date-fns";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDateRange, getPeriodLabel, type Period } from "@/lib/period";
import {
  getPeriodSummary,
  getExpenseTransactions,
  getDailyBreakdown,
  getWeeklyBreakdown,
  getLargestExpenses,
  getEarliestTransactionDate,
} from "@/lib/dashboard-data";
import { CategoryPieBreakdown } from "@/components/dashboard/category-pie-breakdown";
import { TappableTotalGraph } from "@/components/dashboard/tappable-total-graph";
import { InlinePeriodSelect } from "@/components/dashboard/inline-period-select";
import { CategoryFilterSelect } from "@/components/dashboard/category-filter-select";
import { TransactionListCard } from "@/components/dashboard/transaction-list-card";
import { PeriodBreakdownCollapsible } from "@/components/period-breakdown-collapsible";
import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";
import { readPersistedPeriod } from "@/lib/period-cookie";

// Values match the shared `Period` type so a period selected on the Dashboard
// (or any other page) survives a cross-page link unchanged.
const PRESET_PERIODS = ["today", "week", "month", "year"] as const;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string; category?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const persisted = params.period ? null : await readPersistedPeriod("expenses");
  const effectivePeriod = params.period ?? persisted?.period;
  const effectiveFrom = params.from ?? persisted?.from;
  const effectiveTo = params.to ?? persisted?.to;

  const isCustom = effectivePeriod === "custom" && !!effectiveFrom && !!effectiveTo;
  const isAll = effectivePeriod === "all";
  const tab =
    !isCustom &&
    !isAll &&
    PRESET_PERIODS.includes(effectivePeriod as (typeof PRESET_PERIODS)[number])
      ? (effectivePeriod as (typeof PRESET_PERIODS)[number])
      : "week";
  const period: Period = isCustom ? "custom" : isAll ? "all" : tab;

  const earliestTransactionDate = isAll ? await getEarliestTransactionDate(userId) : null;
  const range = isCustom
    ? getDateRange("custom", { from: new Date(effectiveFrom!), to: new Date(effectiveTo!) })
    : getDateRange(period, undefined, earliestTransactionDate ?? undefined);

  const [summary, expenseTransactions, largestExpenses, accounts, categories] = await Promise.all([
    getPeriodSummary(userId, range),
    getExpenseTransactions(userId, range, params.category),
    getLargestExpenses(userId, range, params.category),
    db.financialAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { name: "asc" },
    }),
  ]);

  const filteredCategory = params.category
    ? summary.spendingByCategory.find((c) => c.id === params.category)
    : undefined;

  const dailyBreakdown =
    !isCustom && !isAll && tab === "week" ? await getDailyBreakdown(userId, range, "expense") : null;
  const weeklyBreakdown =
    !isCustom && !isAll && tab === "month" ? await getWeeklyBreakdown(userId, range, "expense") : null;
  const bucketByMonth = differenceInCalendarDays(range.to, range.from) > 60;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Expenses</h1>
      </div>

      <Card className="gap-3">
        <div className="flex items-start justify-between px-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total expenses</p>
            <p className="text-3xl font-semibold tracking-tight">
              {formatUsd(summary.totalExpenses)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">Transactions</p>
            <p className="text-2xl font-semibold tracking-tight">{expenseTransactions.length}</p>
          </div>
        </div>
        <div className="px-5">
          <TappableTotalGraph
            color="var(--chart-critical)"
            data={summary.dailyTrend.map((d) => ({ date: d.date, netWorth: d.expense }))}
            bucketUnit={bucketByMonth ? "month" : "day"}
            persistKey="expenses"
          />
        </div>
        <div className="border-t px-5 pt-3">
          <InlinePeriodSelect
            period={period}
            from={effectiveFrom}
            to={effectiveTo}
            persistKey="expenses"
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

      <CategoryPieBreakdown
        title="Spending by category"
        categories={summary.spendingByCategory}
        periodLabel={getPeriodLabel(period, range)}
      />

      <TransactionListCard
        title="Largest expenses"
        transactions={largestExpenses.map((t) => ({
          ...t,
          originalAmount: Number(t.originalAmount),
        }))}
        emptyLabel="No expenses in this period"
        accounts={accounts}
        categories={categories}
        collapsible
      />

      <TransactionListCard
        title={filteredCategory ? `Expenses · ${filteredCategory.name}` : "All expenses"}
        titleAction={
          <CategoryFilterSelect
            categories={summary.spendingByCategory}
            category={params.category}
          />
        }
        transactions={expenseTransactions.map((t) => ({
          ...t,
          originalAmount: Number(t.originalAmount),
        }))}
        emptyLabel="No expenses in this period"
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
