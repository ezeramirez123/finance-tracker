import { auth } from "@/lib/auth";
import { getDateRange, type Period } from "@/lib/period";
import { getPeriodSummary } from "@/lib/dashboard-data";
import { PeriodRangeSelect } from "@/components/period-range-select";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart";
import { TransactionListCard } from "@/components/dashboard/transaction-list-card";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/format";

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
        <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
        <PeriodRangeSelect period={period} from={params.from} to={params.to} />
      </div>

      <Card className="gap-1.5">
        <div className="grid grid-cols-3 gap-4 px-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total income</p>
            <p className="text-xl font-semibold tracking-tight text-chart-good sm:text-2xl">
              {formatUsd(summary.totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total expenses</p>
            <p className="text-xl font-semibold tracking-tight text-chart-critical sm:text-2xl">
              {formatUsd(summary.totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Net income</p>
            <p
              className={cn(
                "text-xl font-semibold tracking-tight sm:text-2xl",
                summary.net >= 0 ? "text-chart-good" : "text-chart-critical"
              )}
            >
              {formatUsd(summary.net)}
            </p>
          </div>
        </div>
      </Card>

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
