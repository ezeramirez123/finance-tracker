import { auth } from "@/lib/auth";
import { getDateRange } from "@/lib/period";
import { getPeriodSummary, getExpenseTransactions } from "@/lib/dashboard-data";
import { PeriodTabs } from "@/components/period-tabs";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { TransactionListCard } from "@/components/dashboard/transaction-list-card";
import { Card } from "@/components/ui/card";

const TAB_TO_PERIOD = { day: "today", week: "week", month: "month" } as const;

export default async function ExpensesPage({
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

  const [summary, expenseTransactions] = await Promise.all([
    getPeriodSummary(userId, range),
    getExpenseTransactions(userId, range),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Just the money going out.
          </p>
        </div>
        <PeriodTabs period={tab} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Total expenses" value={summary.totalExpenses} />
        <Card className="gap-1.5">
          <p className="px-5 text-sm font-medium text-muted-foreground">Transactions</p>
          <p className="px-5 text-3xl font-semibold tracking-tight">
            {expenseTransactions.length}
          </p>
        </Card>
      </div>

      <CategoryBreakdown title="Spending by category" categories={summary.spendingByCategory} />

      <TransactionListCard
        title="All expenses"
        transactions={expenseTransactions.map((t) => ({
          ...t,
          originalAmount: Number(t.originalAmount),
        }))}
        emptyLabel="No expenses in this period"
      />
    </div>
  );
}
