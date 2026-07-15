import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

export function TransactionListCard({
  title,
  transactions,
  emptyLabel,
  accounts,
  categories,
}: {
  title: string;
  transactions: TransactionLike[];
  emptyLabel: string;
  /** When given (alongside `categories`), rows become clickable to open the edit dialog. */
  accounts?: Account[];
  categories?: Category[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
