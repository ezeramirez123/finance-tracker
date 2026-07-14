import { db } from "@/lib/db";
import { convertToUsd } from "@/lib/currency";
import type { DateRange } from "@/lib/period";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  subWeeks,
  addWeeks,
  subDays,
  eachDayOfInterval,
} from "date-fns";

/**
 * Signed effect (in USD) a transaction has on its own account's balance.
 * Income and expense are unambiguous; a transfer's sign depends on which
 * leg it is (transferDirection), since the same "transfer" kind covers both
 * money leaving the source account and arriving in the destination account.
 */
function signedBalanceImpact(t: {
  kind: string;
  transferDirection: string | null;
  usdEquivalent: unknown;
}): number {
  const usd = Number(t.usdEquivalent);
  if (t.kind === "income") return usd;
  if (t.kind === "expense") return -usd;
  return t.transferDirection === "in" ? usd : -usd;
}

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
    } else if (t.kind === "expense") {
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
    // transfers move money between the user's own accounts — they're neither
    // income nor an expense, so they're excluded from every total/breakdown above.

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

/** Per-day totals for every day in `range` (zero-filled), for a single transaction kind. */
export async function getDailyBreakdown(
  userId: string,
  range: DateRange,
  kind: "income" | "expense"
) {
  const days = eachDayOfInterval({ start: range.from, end: range.to });

  const transactions = await db.transaction.findMany({
    where: { userId, kind, date: { gte: range.from, lte: range.to } },
    select: { date: true, usdEquivalent: true },
  });

  return days.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    return {
      date: dayStart.toISOString(),
      total: transactions
        .filter((t) => t.date >= dayStart && t.date <= dayEnd)
        .reduce((sum, t) => sum + Number(t.usdEquivalent), 0),
    };
  });
}

/** Per-week totals covering every Mon-Sun week that overlaps `range` (zero-filled), for a single kind. */
export async function getWeeklyBreakdown(
  userId: string,
  range: DateRange,
  kind: "income" | "expense"
) {
  const weeks: DateRange[] = [];
  let cursor = startOfWeek(range.from, { weekStartsOn: 1 });
  while (cursor <= range.to) {
    weeks.push({ from: cursor, to: endOfWeek(cursor, { weekStartsOn: 1 }) });
    cursor = addWeeks(cursor, 1);
  }

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      kind,
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

/**
 * Reconstructs each account's daily USD balance for the past `days`, by walking
 * backward from its current balance through its transaction history. Relies on
 * `currentBalance` being kept in sync with the ledger (see lib/actions/transactions.ts
 * and lib/plaid-sync.ts) — accounts edited before that invariant existed may show
 * a discontinuity at the point balance maintenance began.
 */
export async function getAccountBalanceHistorySeries(userId: string, days = 90) {
  const accounts = await db.financialAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  const since = startOfDay(subDays(new Date(), days));
  const now = new Date();

  const perAccountPoints = await Promise.all(
    accounts.map(async (account) => {
      const transactions = await db.transaction.findMany({
        where: { userId, accountId: account.id, date: { gte: since } },
        orderBy: { date: "asc" },
      });

      const { usdEquivalent: currentBalanceUsd } = await convertToUsd(
        Number(account.currentBalance),
        account.currency
      );

      const totalImpact = transactions.reduce((sum, t) => sum + signedBalanceImpact(t), 0);

      let running = currentBalanceUsd - totalImpact;
      const points: { date: Date; balance: number }[] = [{ date: since, balance: running }];
      for (const t of transactions) {
        running += signedBalanceImpact(t);
        points.push({ date: t.date, balance: running });
      }
      points.push({ date: now, balance: currentBalanceUsd });

      return { accountId: account.id, points };
    })
  );

  const dayList = eachDayOfInterval({ start: since, end: now });
  const series = dayList.map((day) => {
    const dayEnd = endOfDay(day);
    const entry: Record<string, number | string> = { date: format(day, "yyyy-MM-dd") };
    for (const { accountId, points } of perAccountPoints) {
      const applicable = points.filter((p) => p.date <= dayEnd);
      entry[accountId] =
        applicable.length > 0 ? applicable[applicable.length - 1].balance : points[0].balance;
    }
    return entry;
  });

  return {
    accounts: accounts.map((a) => ({ id: a.id, name: a.name, icon: a.icon, color: a.color })),
    series,
  };
}

/** Income/expense totals for each of the 7 days (Mon-Sun) in the week `weekOffset` weeks from now. */
export async function getWeekDailyTotals(userId: string, weekOffset = 0) {
  const base = weekOffset === 0 ? new Date() : addWeeks(new Date(), weekOffset);
  const range = {
    from: startOfWeek(base, { weekStartsOn: 1 }),
    to: endOfWeek(base, { weekStartsOn: 1 }),
  };
  const days = eachDayOfInterval({ start: range.from, end: range.to });

  const transactions = await db.transaction.findMany({
    where: { userId, date: { gte: range.from, lte: range.to } },
    select: { date: true, kind: true, usdEquivalent: true },
  });

  return days.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const dayTxns = transactions.filter((t) => t.date >= dayStart && t.date <= dayEnd);
    return {
      date: dayStart.toISOString(),
      income: dayTxns
        .filter((t) => t.kind === "income")
        .reduce((sum, t) => sum + Number(t.usdEquivalent), 0),
      expense: dayTxns
        .filter((t) => t.kind === "expense")
        .reduce((sum, t) => sum + Number(t.usdEquivalent), 0),
    };
  });
}
