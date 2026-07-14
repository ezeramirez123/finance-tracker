"use client";

import * as React from "react";

import { TableRow } from "@/components/ui/table";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";

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
  originalAmount: number;
  originalCurrency: string;
  merchant: string | null;
  date: Date;
  notes: string | null;
};

/** A plain `!==` check on `.kind` narrows that expression, not the whole object —
 * a real type predicate is needed so TS carries the narrowing into the JSX below. */
function isEditable(
  t: RowTransaction
): t is RowTransaction & { kind: "income" | "expense" } {
  return t.kind !== "transfer";
}

export function TransactionRow({
  transaction,
  accounts,
  categories,
  children,
}: {
  transaction: RowTransaction;
  accounts: Account[];
  categories: Category[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const canEdit = isEditable(transaction);

  return (
    <>
      <TableRow
        className={canEdit ? "cursor-pointer" : ""}
        onClick={canEdit ? () => setOpen(true) : undefined}
      >
        {children}
      </TableRow>
      {canEdit && (
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
