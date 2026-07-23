import { differenceInCalendarDays } from "date-fns";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDateRange, getPeriodLabel, type Period } from "@/lib/period";
import { getPeriodSummary, getLargestTransactions } from "@/lib/dashboard-data";
import { PeriodRangeSelect } from "@/components/period-range-select";
import { CategoryPieBreakdown } from "@/components/dashboard/category-pie-breakdown";
import { IncomeExpenseTrendGraph } from "@/components/dashboard/income-expense-trend-chart";
import { TransactionListCard } from "@/components/dashboard/transaction-list-card";
import { CategoryFilterSelect } from "@/components/dashboard/category-filter-select";
import { Card, CardContent } from "@/components/ui/card";
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

  const [summary, largestTransactions, accounts, categories] = await Promise.all([
    getPeriodSummary(userId, range),
    getLargestTransactions(userId, range, params.category),
    db.financialAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { name: "asc" },
    }),
  ]);

  const allCategories = [...summary.incomeByCategory, ...summary.spendingByCategory];
  const bucketByMonth = differenceInCalendarDays(range.to, range.from) > 60;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
        <PeriodRangeSelect period={period} from={from} to={to} persistKey="reports" />
      </div>

      <Card className="gap-3">
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-3 divide-x border-b pb-4">
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

          <IncomeExpenseTrendGraph
            data={summary.dailyTrend}
            dateFormat={bucketByMonth ? "MMM" : "MMM d"}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryPieBreakdown
          title="Spending by category"
          categories={summary.spendingByCategory}
          periodLabel={getPeriodLabel(period, range)}
        />
        <CategoryPieBreakdown
          title="Income by category"
          categories={summary.incomeByCategory}
          periodLabel={getPeriodLabel(period, range)}
        />
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
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
