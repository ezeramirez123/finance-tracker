"use client";

import * as React from "react";

import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { formatMoney } from "@/lib/format";

type Account = { id: string; name: string; icon: string; currency: string };
type Category = {
  id: string;
  name: string;
  kind: "income" | "expense" | "transfer";
  color: string;
};

type RowTransaction = {
  id: string;
  accountId: string;
  categoryId: string | null;
  kind: "income" | "expense" | "transfer";
  transferDirection?: string | null;
  originalAmount: number;
  originalCurrency: string;
  merchant: string | null;
  date: Date;
  notes: string | null;
  category: { name: string; color: string } | null;
};

function isCredit(t: Pick<RowTransaction, "kind" | "transferDirection">): boolean {
  if (t.kind === "income") return true;
  if (t.kind === "expense") return false;
  return t.transferDirection === "in";
}

/** Income green, expense red — a transfer's amount must look visually
 * distinct from both, since it isn't counted as either one in any total,
 * and reusing the same styling reads as "this counts as income/expense"
 * even though it never does. */
function amountColorClass(t: Pick<RowTransaction, "kind" | "transferDirection">): string {
  if (t.kind === "income") return "text-chart-good";
  if (t.kind === "expense") return "text-chart-critical";
  return "text-chart-1";
}

/** A plain `!==` check on `.kind` narrows that expression, not the whole object —
 * a real type predicate is needed so TS carries the narrowing into the JSX below. */
function isEditable(
  t: RowTransaction
): t is RowTransaction & { kind: "income" | "expense" } {
  return t.kind !== "transfer";
}

export function TransactionListRow({
  transaction,
  accounts,
  categories,
}: {
  transaction: RowTransaction;
  accounts?: Account[];
  categories?: Category[];
}) {
  const [open, setOpen] = React.useState(false);
  const canEdit = !!accounts && !!categories && isEditable(transaction);

  return (
    <>
      <div
        className={`flex items-center justify-between gap-3 py-2.5 ${
          canEdit
            ? "cursor-pointer rounded-md px-1 transition-colors hover:bg-accent/50 active:bg-accent"
            : ""
        }`}
        onClick={canEdit ? () => setOpen(true) : undefined}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: transaction.category?.color ?? "var(--muted-foreground)" }}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">
              {transaction.merchant || transaction.category?.name || "Uncategorized"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {transaction.date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              {transaction.category ? ` · ${transaction.category.name}` : ""}
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 text-sm font-medium tabular-nums ${amountColorClass(transaction)}`}
        >
          {isCredit(transaction) ? "+" : "-"}
          {formatMoney(Number(transaction.originalAmount), transaction.originalCurrency)}
        </span>
      </div>
      {accounts && categories && isEditable(transaction) && (
        <TransactionDialog
          accounts={accounts}
          categories={categories}
          transaction={transaction}
          trigger={null}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
