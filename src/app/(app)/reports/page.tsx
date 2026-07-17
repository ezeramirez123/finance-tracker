import { auth } from "@/lib/auth";
import { getDateRange, type Period } from "@/lib/period";
import { getPeriodSummary, getLargestTransactions } from "@/lib/dashboard-data";
import { PeriodRangeSelect } from "@/components/period-range-select";
import { CategoryPieBreakdown } from "@/components/dashboard/category-pie-breakdown";
import { IncomeExpenseTrendChart } from "@/components/dashboard/income-expense-trend-chart";
import { TransactionListCard } from "@/components/dashboard/transaction-list-card";
import { CategoryFilterSelect } from "@/components/dashboard/category-filter-select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/format";
import { readPersistedPeriod } from "@/lib/period-cookie";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string; category?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const persisted = params.period ? null : await readPersistedPeriod("reports");
  const period = ((params.period ?? persisted?.period) as Period) || "month";
  const from = params.from ?? persisted?.from;
  const to = params.to ?? persisted?.to;
  const range = getDateRange(
    period,
    period === "custom" && from && to ? { from: new Date(from), to: new Date(to) } : undefined
  );

  const [summary, largestTransactions] = await Promise.all([
    getPeriodSummary(userId, range),
    getLargestTransactions(userId, range, params.category),
  ]);

  const allCategories = [...summary.incomeByCategory, ...summary.spendingByCategory];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
        <PeriodRangeSelect period={period} from={from} to={to} persistKey="reports" />
      </div>

      <Card className="gap-3">
        <p className="px-5 text-sm font-medium text-muted-foreground">Totals</p>
        <div className="grid grid-cols-3 divide-x px-5">
          <div className="pr-4">
            <p className="text-xs font-medium text-muted-foreground">Income</p>
            <p className="text-xl font-semibold tracking-tight text-chart-good sm:text-2xl">
              {formatUsd(summary.totalIncome)}
            </p>
          </div>
          <div className="px-4">
            <p className="text-xs font-medium text-muted-foreground">Expenses</p>
            <p className="text-xl font-semibold tracking-tight text-chart-critical sm:text-2xl">
              {formatUsd(summary.totalExpenses)}
            </p>
          </div>
          <div className="pl-4">
            <p className="text-xs font-medium text-muted-foreground">Net</p>
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

      <IncomeExpenseTrendChart data={summary.dailyTrend} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryPieBreakdown title="Spending by category" categories={summary.spendingByCategory} />
        <CategoryPieBreakdown title="Income by category" categories={summary.incomeByCategory} />
      </div>

      <TransactionListCard
        title="Biggest transactions"
        titleAction={
          <CategoryFilterSelect categories={allCategories} category={params.category} />
        }
        transactions={largestTransactions.map((t) => ({
          ...t,
          originalAmount: Number(t.originalAmount),
        }))}
        emptyLabel="No transactions in this period"
      />
    </div>
  );
}
