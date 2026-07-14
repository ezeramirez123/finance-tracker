"use client";

import * as React from "react";

import { TableRow } from "@/components/ui/table";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";

type Account = { id: string; name: string; icon: string; currency: string };
type Category = { id: string; name: string; kind: "income" | "expense"; color: string };

export function TransactionRow({
  transaction,
  accounts,
  categories,
  children,
}: {
  transaction: {
    id: string;
    accountId: string;
    categoryId: string | null;
    kind: "income" | "expense";
    originalAmount: number;
    originalCurrency: string;
    merchant: string | null;
    date: Date;
    notes: string | null;
  };
  accounts: Account[];
  categories: Category[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setOpen(true)}>
        {children}
      </TableRow>
      <TransactionDialog
        accounts={accounts}
        categories={categories}
        transaction={transaction}
        trigger={null}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
