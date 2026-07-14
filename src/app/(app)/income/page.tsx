import { format, parseISO } from "date-fns";

import { auth } from "@/lib/auth";
import { getDateRange } from "@/lib/period";
import {
  getPeriodSummary,
  getIncomeTransactions,
  getDailyBreakdown,
  getWeeklyBreakdown,
} from "@/lib/dashboard-data";
import { PeriodTabs } from "@/components/period-tabs";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart";
import { TransactionListCard } from "@/components/dashboard/transaction-list-card";
import { PeriodBreakdownCollapsible } from "@/components/period-breakdown-collapsible";
import { Card } from "@/components/ui/card";

const TAB_TO_PERIOD = { day: "today", week: "week", month: "month" } as const;

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const tab = (params.period as keyof typeof TAB_TO_PERIOD) in TAB_TO_PERIOD
    ? (params.period as keyof typeof TAB_TO_PERIOD)
    : "week";
  const range = getDateRange(TAB_TO_PERIOD[tab]);

  const [summary, incomeTransactions] = await Promise.all([
    getPeriodSummary(userId, range),
    getIncomeTransactions(userId, range),
  ]);

  const dailyBreakdown = tab === "week" ? await getDailyBreakdown(userId, range, "income") : null;
  const weeklyBreakdown = tab === "month" ? await getWeeklyBreakdown(userId, range, "income") : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Income</h1>
          <p className="text-sm text-muted-foreground">
            Just the money coming in.
          </p>
        </div>
        <PeriodTabs period={tab} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Total income" value={summary.totalIncome} />
        <Card className="gap-1.5">
          <p className="px-5 text-sm font-medium text-muted-foreground">Transactions</p>
          <p className="px-5 text-3xl font-semibold tracking-tight">
            {incomeTransactions.length}
          </p>
        </Card>
      </div>

      {dailyBreakdown && (
        <PeriodBreakdownCollapsible
          title="Income by day"
          barColorVar="--chart-good"
          buckets={dailyBreakdown.map((d) => ({
            label: format(parseISO(d.date), "EEE, MMM d"),
            total: d.total,
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
          }))}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryDonutChart title="Income by category" categories={summary.incomeByCategory} />
        <CategoryBreakdown title="Income by category" categories={summary.incomeByCategory} />
      </div>

      <TransactionListCard
        title="All income"
        transactions={incomeTransactions.map((t) => ({
          ...t,
          originalAmount: Number(t.originalAmount),
        }))}
        emptyLabel="No income in this period"
      />
    </div>
  );
}
