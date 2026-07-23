import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDateRange, getPeriodLabel, type Period } from "@/lib/period";
import {
  getEarliestTransactionDate,
  getNetWorth,
  getNetWorthHistory,
  getPeriodSummary,
  getTotalBalance,
  getTotalBalanceHistory,
  getWeekDailyTotals,
} from "@/lib/dashboard-data";
import { readPersistedPeriod } from "@/lib/period-cookie";
import { CategoryPieBreakdown } from "@/components/dashboard/category-pie-breakdown";
import { TransactionListCard } from "@/components/dashboard/transaction-list-card";
import { WeekCalendarStrip } from "@/components/dashboard/week-calendar-strip";
import { BalancesOverview } from "@/components/dashboard/balances-overview";
import { MobileSummaryCard } from "@/components/dashboard/mobile-summary-card";

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

  const persisted = params.period ? null : await readPersistedPeriod("dashboard");
  const period = (params.period as Period) || (persisted?.period as Period) || "week";
  const from = params.from ?? persisted?.from;
  const to = params.to ?? persisted?.to;
  const earliestTransactionDate =
    period === "all" ? await getEarliestTransactionDate(userId) : null;
  const range = getDateRange(
    period,
    period === "custom" && from && to ? { from: new Date(from), to: new Date(to) } : undefined,
    earliestTransactionDate ?? undefined
  );
  const weekOffset = Math.min(0, parseInt(params.weekOffset ?? "0", 10) || 0);

  const [
    summary,
    netWorth,
    netWorthHistory,
    totalBalance,
    totalBalanceHistory,
    currentWeekDays,
    accounts,
    categories,
  ] = await Promise.all([
    getPeriodSummary(userId, range),
    getNetWorth(userId),
    getNetWorthHistory(userId, range),
    getTotalBalance(userId),
    getTotalBalanceHistory(userId, range),
    getWeekDailyTotals(userId, weekOffset),
    db.financialAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { name: "asc" },
    }),
  ]);

  // Carry the currently-selected period through to Income/Expenses so those
  // pages open scoped to the same range instead of resetting to their default.
  const periodQuery = new URLSearchParams();
  periodQuery.set("period", period);
  if (period === "custom" && from && to) {
    periodQuery.set("from", from);
    periodQuery.set("to", to);
  }
  const incomeHref = `/income?${periodQuery.toString()}`;
  const expensesHref = `/expenses?${periodQuery.toString()}`;
  const netHref = `/reports?${periodQuery.toString()}`;

  return (
    <div className="flex flex-col gap-6">
      <MobileSummaryCard
        netWorth={netWorth}
        totalIncome={summary.totalIncome}
        totalExpenses={summary.totalExpenses}
        net={summary.net}
        incomeHref={incomeHref}
        expensesHref={expensesHref}
        netHref={netHref}
        netWorthHistory={netWorthHistory}
        period={period}
        from={from}
        to={to}
        persistKey="dashboard"
      />

      <div className="hidden md:block">
        <h1 className="mb-4 text-xl font-semibold tracking-tight">Dashboard</h1>
        <BalancesOverview
          totalBalance={totalBalance}
          totalBalanceHistory={totalBalanceHistory}
          totalIncome={summary.totalIncome}
          totalExpenses={summary.totalExpenses}
          net={summary.net}
          incomeHref={incomeHref}
          expensesHref={expensesHref}
          netHref={netHref}
          period={period}
          from={from}
          to={to}
          persistKey="dashboard"
        />
      </div>

      <WeekCalendarStrip days={currentWeekDays} weekOffset={weekOffset} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryPieBreakdown
          title="Spending by category"
          categories={summary.spendingByCategory}
          targetPath="/expenses"
          periodLabel={getPeriodLabel(period, range)}
        />
        <CategoryPieBreakdown
          title="Income by category"
          categories={summary.incomeByCategory}
          targetPath="/income"
          periodLabel={getPeriodLabel(period, range)}
        />
      </div>

      <TransactionListCard
        title="Recent transactions"
        transactions={summary.recentTransactions.map((t) => ({
          ...t,
          originalAmount: Number(t.originalAmount),
        }))}
        emptyLabel="No transactions in this period"
        accounts={accounts}
        categories={categories}
        collapsible
      />
    </div>
  );
}
