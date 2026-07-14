"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteTransaction } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function TransactionRowActions({
  transaction,
  accounts,
  categories,
}: {
  transaction: RowTransaction;
  accounts: Account[];
  categories: Category[];
}) {
  const [confirming, setConfirming] = React.useState(false);

  async function handleDelete() {
    try {
      await deleteTransaction(transaction.id);
      toast.success("Transaction deleted");
    } catch {
      toast.error("Couldn't delete transaction");
    }
    setConfirming(false);
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isEditable(transaction) && (
            <TransactionDialog
              transaction={transaction}
              accounts={accounts}
              categories={categories}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
              }
            />
          )}
          {confirming ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              <Trash2 className="size-4" />
              Confirm delete
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                setConfirming(true);
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
