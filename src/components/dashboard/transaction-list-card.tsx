"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TransactionListRow } from "@/components/dashboard/transaction-list-row";

type Account = { id: string; name: string; icon: string; currency: string };
type Category = {
  id: string;
  name: string;
  kind: "income" | "expense" | "transfer";
  color: string;
};

type TransactionLike = {
  id: string;
  accountId: string;
  categoryId: string | null;
  merchant: string | null;
  notes: string | null;
  date: Date;
  kind: "income" | "expense" | "transfer";
  transferDirection?: string | null;
  originalAmount: number | { toString(): string };
  originalCurrency: string;
  category: { name: string; color: string } | null;
};

function TransactionList({
  transactions,
  emptyLabel,
  accounts,
  categories,
}: {
  transactions: TransactionLike[];
  emptyLabel: string;
  accounts?: Account[];
  categories?: Category[];
}) {
  if (transactions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <div className="flex max-h-[28rem] flex-col divide-y overflow-y-auto">
      {transactions.map((t) => (
        <TransactionListRow
          key={t.id}
          transaction={{ ...t, originalAmount: Number(t.originalAmount) }}
          accounts={accounts}
          categories={categories}
        />
      ))}
    </div>
  );
}

export function TransactionListCard({
  title,
  titleAction,
  transactions,
  emptyLabel,
  accounts,
  categories,
  collapsible = false,
}: {
  title: string;
  /** Extra control rendered next to the title, e.g. a category filter. */
  titleAction?: ReactNode;
  transactions: TransactionLike[];
  emptyLabel: string;
  /** When given (alongside `categories`), rows become clickable to open the edit dialog. */
  accounts?: Account[];
  categories?: Category[];
  /** Render the whole card as an open-by-default collapsible section. */
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);

  if (collapsible) {
    return (
      <Card className="gap-0 py-0">
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center justify-between gap-1.5 px-5 py-5">
            <CollapsibleTrigger className="flex flex-1 items-center justify-between gap-1.5 text-left">
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
              <ChevronDown
                className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            {titleAction}
          </div>
          <CollapsibleContent>
            <CardContent className="pb-5">
              <TransactionList
                transactions={transactions}
                emptyLabel={emptyLabel}
                accounts={accounts}
                categories={categories}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {titleAction}
      </CardHeader>
      <CardContent>
        <TransactionList
          transactions={transactions}
          emptyLabel={emptyLabel}
          accounts={accounts}
          categories={categories}
        />
      </CardContent>
    </Card>
  );
}
