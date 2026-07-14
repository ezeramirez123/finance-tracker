import { db } from "@/lib/db";
import { convertToUsd } from "@/lib/currency";
import type { DateRange } from "@/lib/period";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";

export async function getNetWorth(userId: string) {
  const accounts = await db.financialAccount.findMany({
    where: { userId, includeInNetWorth: true },
  });

  let totalUsd = 0;
  for (const account of accounts) {
    const { usdEquivalent } = await convertToUsd(
      Number(account.currentBalance),
      account.currency
    );
    totalUsd += usdEquivalent;
  }

  return totalUsd;
}

export async function getTotalBalance(userId: string) {
  const accounts = await db.financialAccount.findMany({ where: { userId } });

  let totalUsd = 0;
  for (const account of accounts) {
    const { usdEquivalent } = await convertToUsd(
      Number(account.currentBalance),
      account.currency
    );
    totalUsd += usdEquivalent;
  }

  return totalUsd;
}

export async function getPeriodSummary(userId: string, range: DateRange) {
  const transactions = await db.transaction.findMany({
    where: { userId, date: { gte: range.from, lte: range.to } },
    include: { category: true, account: true },
    orderBy: { date: "desc" },
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  const spendingByCategory = new Map<string, { name: string; color: string; total: number }>();
  const incomeByCategory = new Map<string, { name: string; color: string; total: number }>();
  const dailyTotals = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const usd = Number(t.usdEquivalent);
    const day = format(t.date, "yyyy-MM-dd");
    const dayEntry = dailyTotals.get(day) ?? { income: 0, expense: 0 };

    if (t.kind === "income") {
      totalIncome += usd;
      dayEntry.income += usd;
      if (t.category) {
        const entry = incomeByCategory.get(t.category.id) ?? {
          name: t.category.name,
          color: t.category.color,
          total: 0,
        };
        entry.total += usd;
        incomeByCategory.set(t.category.id, entry);
      }
    } else {
      totalExpenses += usd;
      dayEntry.expense += usd;
      if (t.category) {
        const entry = spendingByCategory.get(t.category.id) ?? {
          name: t.category.name,
          color: t.category.color,
          total: 0,
        };
        entry.total += usd;
        spendingByCategory.set(t.category.id, entry);
      }
    }

    dailyTotals.set(day, dayEntry);
  }

  const largestExpenses = transactions
    .filter((t) => t.kind === "expense")
    .sort((a, b) => Number(b.usdEquivalent) - Number(a.usdEquivalent))
    .slice(0, 5);

  const dailyTrend = Array.from(dailyTotals.entries())
    .map(([date, totals]) => ({ date, ...totals }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses,
    spendingByCategory: Array.from(spendingByCategory.values()).sort(
      (a, b) => b.total - a.total
    ),
    incomeByCategory: Array.from(incomeByCategory.values()).sort(
      (a, b) => b.total - a.total
    ),
    largestExpenses,
    dailyTrend,
    recentTransactions: transactions.slice(0, 8),
    transactionCount: transactions.length,
  };
}

export async function getExpenseTransactions(userId: string, range: DateRange) {
  return db.transaction.findMany({
    where: { userId, kind: "expense", date: { gte: range.from, lte: range.to } },
    include: { category: true },
    orderBy: { date: "desc" },
  });
}

export async function getIncomeTransactions(userId: string, range: DateRange) {
  return db.transaction.findMany({
    where: { userId, kind: "income", date: { gte: range.from, lte: range.to } },
    include: { category: true },
    orderBy: { date: "desc" },
  });
}

/** Expense totals for the past `weeksCount` weeks (most recent week last), Mon-Sun buckets. */
export async function getWeeklySpending(userId: string, weeksCount = 4) {
  const now = new Date();
  const weeks = Array.from({ length: weeksCount }, (_, i) => {
    const weekDate = subWeeks(now, weeksCount - 1 - i);
    return {
      from: startOfWeek(weekDate, { weekStartsOn: 1 }),
      to: endOfWeek(weekDate, { weekStartsOn: 1 }),
    };
  });

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      kind: "expense",
      date: { gte: weeks[0].from, lte: weeks[weeks.length - 1].to },
    },
    select: { date: true, usdEquivalent: true },
  });

  return weeks.map((week) => ({
    from: week.from.toISOString(),
    to: week.to.toISOString(),
    total: transactions
      .filter((t) => t.date >= week.from && t.date <= week.to)
      .reduce((sum, t) => sum + Number(t.usdEquivalent), 0),
  }));
}
