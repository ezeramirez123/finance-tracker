import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { endOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDateRange, type Period } from "@/lib/period";
import { Card } from "@/components/ui/card";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { CsvImportDialog } from "@/components/transactions/csv-import-dialog";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { formatMoney, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = ["date-desc", "date-asc", "amount-desc", "amount-asc"] as const;
type Sort = (typeof SORT_OPTIONS)[number];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    account?: string;
    period?: string;
    from?: string;
    to?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const sort: Sort = SORT_OPTIONS.includes(params.sort as Sort)
    ? (params.sort as Sort)
    : "date-desc";

  const PRESET_PERIODS = ["today", "week", "month", "year"] as const;
  const isPreset = PRESET_PERIODS.includes(params.period as (typeof PRESET_PERIODS)[number]);
  const isCustomRange = params.period === "custom" && !!params.from && !!params.to;

  const where: Prisma.TransactionWhereInput = { userId };
  if (params.category) where.categoryId = params.category;
  if (params.account) where.accountId = params.account;
  if (isPreset) {
    const range = getDateRange(params.period as Period);
    where.date = { gte: range.from, lte: range.to };
  } else if (isCustomRange) {
    where.date = { gte: new Date(params.from!), lte: endOfDay(new Date(params.to!)) };
  }

  const orderBy: Prisma.TransactionOrderByWithRelationInput =
    sort === "date-asc"
      ? { date: "asc" }
      : sort === "amount-desc"
        ? { usdEquivalent: "desc" }
        : sort === "amount-asc"
          ? { usdEquivalent: "asc" }
          : { date: "desc" };

  const [transactions, accounts, categories] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy,
      include: { account: true, category: true },
      take: 200,
    }),
    db.financialAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { name: "asc" },
    }),
  ]);

  function sortHref(column: "date" | "amount") {
    const params2 = new URLSearchParams();
    if (params.category) params2.set("category", params.category);
    if (params.account) params2.set("account", params.account);
    if (params.period) params2.set("period", params.period);
    if (params.from) params2.set("from", params.from);
    if (params.to) params2.set("to", params.to);

    const nextSort: Sort =
      column === "date"
        ? sort === "date-desc"
          ? "date-asc"
          : "date-desc"
        : sort === "amount-desc"
          ? "amount-asc"
          : "amount-desc";
    params2.set("sort", nextSort);
    return `/transactions?${params2.toString()}`;
  }

  function sortIcon(column: "date" | "amount") {
    const active = sort.startsWith(column);
    if (!active) return <ArrowUpDown className="size-3 text-muted-foreground/50" />;
    return sort.endsWith("asc") ? (
      <ArrowUp className="size-3" />
    ) : (
      <ArrowDown className="size-3" />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
        <div className="flex items-center gap-2">
          <CsvImportDialog />
          <TransactionDialog accounts={accounts} categories={categories} />
        </div>
      </div>

      <TransactionFilters
        accounts={accounts}
        categories={categories}
        category={params.category}
        account={params.account}
        period={params.period}
        from={params.from}
        to={params.to}
      />

      {transactions.length === 0 ? (
        <Card className="items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {params.category || params.account || params.period || params.from || params.to
              ? "No transactions match these filters."
              : "No transactions yet. Add your first one to see it here."}
          </p>
        </Card>
      ) : (
        <Card className="mx-auto w-full max-w-2xl py-0">
          <div className="flex items-center gap-3 border-b px-5 py-3 text-xs text-muted-foreground">
            <Link href={sortHref("date")} className="flex items-center gap-1 hover:text-foreground">
              Date
              {sortIcon("date")}
            </Link>
            <Link
              href={sortHref("amount")}
              className="flex items-center gap-1 hover:text-foreground"
            >
              Amount
              {sortIcon("amount")}
            </Link>
          </div>
          <div className="flex min-w-0 flex-col">
            {transactions.map((t) => {
              const category = categories.find((c) => c.id === t.categoryId);
              return (
                <TransactionRow
                  key={t.id}
                  transaction={{
                    id: t.id,
                    accountId: t.accountId,
                    categoryId: t.categoryId,
                    kind: t.kind,
                    originalAmount: Number(t.originalAmount),
                    originalCurrency: t.originalCurrency,
                    merchant: t.merchant,
                    date: t.date,
                    notes: t.notes,
                  }}
                  accounts={accounts}
                  categories={categories}
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {t.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className="min-w-0 truncate font-medium">
                        {t.merchant || <span className="text-muted-foreground">—</span>}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-medium tabular-nums",
                        t.kind === "income"
                          ? "text-chart-good"
                          : t.kind === "expense"
                            ? "text-chart-critical"
                            : "text-chart-1"
                      )}
                    >
                      {t.kind === "income" || (t.kind === "transfer" && t.transferDirection === "in")
                        ? "+"
                        : "-"}
                      {formatMoney(Number(t.originalAmount), t.originalCurrency)}
                    </span>
                  </div>

                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex min-w-0 items-center gap-1.5 truncate">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: category?.color ?? "var(--muted-foreground)" }}
                        />
                        {category?.name ?? "Uncategorized"}
                      </span>
                      <span className="shrink-0">·</span>
                      <span className="flex min-w-0 items-center gap-1.5 truncate">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: t.account.color }}
                        />
                        {t.account.name}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      ≈ {formatUsd(Number(t.usdEquivalent))}
                    </span>
                  </div>
                </TransactionRow>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
