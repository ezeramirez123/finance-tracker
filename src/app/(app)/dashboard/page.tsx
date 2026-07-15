import Link from "next/link";
import { X } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDateRange, getPreviousRange, type Period } from "@/lib/period";
import {
  getNetWorth,
  getPeriodSummary,
  getTotalBalance,
  getWeeklySpending,
  getWeekDailyTotals,
  getTransactionsByCategory,
} from "@/lib/dashboard-data";
import { PeriodSwitcher } from "@/components/dashboard/period-switcher";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart";
import { TransactionListCard } from "@/components/dashboard/transaction-list-card";
import { WeeklySpendingCollapsible } from "@/components/dashboard/weekly-spending-collapsible";
import { WeekCalendarStrip } from "@/components/dashboard/week-calendar-strip";
import { BalancesOverview } from "@/components/dashboard/balances-overview";
import { MobileSummaryCard } from "@/components/dashboard/mobile-summary-card";

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    from?: string;
    to?: string;
    weekOffset?: string;
    category?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const period = (params.period as Period) || "week";
  const range = getDateRange(
    period,
    period === "custom" && params.from && params.to
      ? { from: new Date(params.from), to: new Date(params.to) }
      : undefined
  );
  const previousRange = getPreviousRange(range);
  const weekOffset = Math.min(0, parseInt(params.weekOffset ?? "0", 10) || 0);

  const [summary, previousSummary, netWorth, totalBalance, weeklySpending, currentWeekDays, accounts, categories] =
    await Promise.all([
      getPeriodSummary(userId, range),
      getPeriodSummary(userId, previousRange),
      getNetWorth(userId),
      getTotalBalance(userId),
      getWeeklySpending(userId),
      getWeekDailyTotals(userId, weekOffset),
      db.financialAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      db.category.findMany({
        where: { OR: [{ userId }, { userId: null }] },
        orderBy: { name: "asc" },
      }),
    ]);

  const filteredCategory = params.category
    ? [...summary.spendingByCategory, ...summary.incomeByCategory].find(
        (c) => c.id === params.category
      )
    : undefined;
  const categoryTransactions = filteredCategory
    ? await getTransactionsByCategory(userId, range, filteredCategory.id)
    : null;

  const clearFilterHref = (() => {
    const clearParams = new URLSearchParams();
    if (params.period) clearParams.set("period", params.period);
    if (params.from) clearParams.set("from", params.from);
    if (params.to) clearParams.set("to", params.to);
    const qs = clearParams.toString();
    return qs ? `/dashboard?${qs}` : "/dashboard";
  })();

  const incomeDelta = percentDelta(summary.totalIncome, previousSummary.totalIncome);
  const expenseDelta = percentDelta(summary.totalExpenses, previousSummary.totalExpenses);
  const netDelta = percentDelta(summary.net, previousSummary.net);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s where your money went.
          </p>
        </div>
        <PeriodSwitcher period={period} from={params.from} to={params.to} />
      </div>

      <MobileSummaryCard
        netWorth={netWorth}
        totalIncome={summary.totalIncome}
        totalExpenses={summary.totalExpenses}
        net={summary.net}
        incomeDelta={incomeDelta}
        expenseDelta={expenseDelta}
        netDelta={netDelta}
      />

      <div className="hidden md:block">
        <BalancesOverview netWorth={netWorth} totalBalance={totalBalance} />
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Income" value={summary.totalIncome} delta={incomeDelta} deltaGoodDirection="up" />
        <StatTile label="Expenses" value={summary.totalExpenses} delta={expenseDelta} deltaGoodDirection="down" />
        <StatTile
          label="Net"
          value={summary.net}
          delta={netDelta}
          deltaGoodDirection="up"
          className="md:col-span-2 lg:col-span-1"
        />
      </div>

      <WeekCalendarStrip days={currentWeekDays} weekOffset={weekOffset} />

      <DailyTrendChart data={summary.dailyTrend} />

      <WeeklySpendingCollapsible weeks={weeklySpending} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryBreakdown title="Spending by category" categories={summary.spendingByCategory} />
        <CategoryBreakdown title="Income by category" categories={summary.incomeByCategory} />
      </div>

      {filteredCategory && categoryTransactions ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: filteredCategory.color }}
            />
            <span className="text-sm font-medium">
              Filtered by {filteredCategory.name}
            </span>
            <Link
              href={clearFilterHref}
              scroll={false}
              className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
              Clear
            </Link>
          </div>
          <TransactionListCard
            title={`Transactions · ${filteredCategory.name}`}
            transactions={categoryTransactions.map((t) => ({
              ...t,
              originalAmount: Number(t.originalAmount),
            }))}
            emptyLabel="No transactions in this category for this period"
            accounts={accounts}
            categories={categories}
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <TransactionListCard
            title="Largest expenses"
            transactions={summary.largestExpenses.map((t) => ({
              ...t,
              originalAmount: Number(t.originalAmount),
            }))}
            emptyLabel="No expenses in this period"
            accounts={accounts}
            categories={categories}
          />
          <TransactionListCard
            title="Recent transactions"
            transactions={summary.recentTransactions.map((t) => ({
              ...t,
              originalAmount: Number(t.originalAmount),
            }))}
            emptyLabel="No transactions in this period"
            accounts={accounts}
            categories={categories}
          />
        </div>
      )}
    </div>
  );
}
