import { auth } from "@/lib/auth";
import { getDateRange, type Period } from "@/lib/period";
import { getPeriodSummary } from "@/lib/dashboard-data";
import { PeriodSwitcher } from "@/components/dashboard/period-switcher";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart";
import { TransactionListCard } from "@/components/dashboard/transaction-list-card";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const period = (params.period as Period) || "month";
  const range = getDateRange(
    period,
    period === "custom" && params.from && params.to
      ? { from: new Date(params.from), to: new Date(params.to) }
      : undefined
  );

  const summary = await getPeriodSummary(userId, range);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Dig into any period you want.
          </p>
        </div>
        <PeriodSwitcher period={period} from={params.from} to={params.to} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total income" value={summary.totalIncome} />
        <StatTile label="Total expenses" value={summary.totalExpenses} />
        <StatTile label="Net income" value={summary.net} />
      </div>

      <DailyTrendChart data={summary.dailyTrend} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryBreakdown title="Spending by category" categories={summary.spendingByCategory} />
        <CategoryBreakdown title="Income by category" categories={summary.incomeByCategory} />
      </div>

      <TransactionListCard
        title="Biggest purchases"
        transactions={summary.largestExpenses.map((t) => ({
          ...t,
          originalAmount: Number(t.originalAmount),
        }))}
        emptyLabel="No expenses in this period"
      />
    </div>
  );
}
