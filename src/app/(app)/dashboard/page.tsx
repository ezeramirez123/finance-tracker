import { auth } from "@/lib/auth";
import { getDateRange, getPreviousRange, type Period } from "@/lib/period";
import {
  getNetWorth,
  getPeriodSummary,
  getTotalBalance,
  getWeeklySpending,
} from "@/lib/dashboard-data";
import { PeriodSwitcher } from "@/components/dashboard/period-switcher";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart";
import { TransactionListCard } from "@/components/dashboard/transaction-list-card";
import { WeeklySpendingCollapsible } from "@/components/dashboard/weekly-spending-collapsible";
import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
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

  const [summary, previousSummary, netWorth, totalBalance, weeklySpending] = await Promise.all([
    getPeriodSummary(userId, range),
    getPeriodSummary(userId, previousRange),
    getNetWorth(userId),
    getTotalBalance(userId),
    getWeeklySpending(userId),
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Income" value={summary.totalIncome} delta={incomeDelta} deltaGoodDirection="up" />
        <StatTile label="Expenses" value={summary.totalExpenses} delta={expenseDelta} deltaGoodDirection="down" />
        <StatTile label="Net" value={summary.net} delta={netDelta} deltaGoodDirection="up" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="gap-1.5">
          <p className="px-5 text-sm font-medium text-muted-foreground">Net worth</p>
          <p className="px-5 text-2xl font-semibold tracking-tight">
            {formatUsd(netWorth)}
          </p>
          <p className="px-5 text-xs text-muted-foreground">
            Accounts marked &quot;include in net worth&quot;
          </p>
        </Card>
        <Card className="gap-1.5">
          <p className="px-5 text-sm font-medium text-muted-foreground">
            Total across all accounts
          </p>
          <p className="px-5 text-2xl font-semibold tracking-tight">
            {formatUsd(totalBalance)}
          </p>
          <p className="px-5 text-xs text-muted-foreground">
            Every account, regardless of net worth setting
          </p>
        </Card>
      </div>

      <DailyTrendChart data={summary.dailyTrend} />

      <WeeklySpendingCollapsible weeks={weeklySpending} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryBreakdown title="Spending by category" categories={summary.spendingByCategory} />
        <CategoryBreakdown title="Income by category" categories={summary.incomeByCategory} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TransactionListCard
          title="Largest expenses"
          transactions={summary.largestExpenses.map((t) => ({
            ...t,
            originalAmount: Number(t.originalAmount),
          }))}
          emptyLabel="No expenses in this period"
        />
        <TransactionListCard
          title="Recent transactions"
          transactions={summary.recentTransactions.map((t) => ({
            ...t,
            originalAmount: Number(t.originalAmount),
          }))}
          emptyLabel="No transactions in this period"
        />
      </div>
    </div>
  );
}
