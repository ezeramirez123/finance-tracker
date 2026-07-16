import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDateRange, getPreviousRange, type Period } from "@/lib/period";
import {
  getNetWorth,
  getPeriodSummary,
  getTotalBalance,
  getWeeklySpending,
  getWeekDailyTotals,
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
        <StatTile
          label="Income"
          value={summary.totalIncome}
          delta={incomeDelta}
          deltaGoodDirection="up"
          href="/income"
        />
        <StatTile
          label="Expenses"
          value={summary.totalExpenses}
          delta={expenseDelta}
          deltaGoodDirection="down"
          href="/expenses"
        />
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
        <CategoryBreakdown
          title="Spending by category"
          categories={summary.spendingByCategory}
          targetPath="/expenses"
        />
        <CategoryBreakdown
          title="Income by category"
          categories={summary.incomeByCategory}
          targetPath="/income"
        />
      </div>

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
    </div>
  );
}
