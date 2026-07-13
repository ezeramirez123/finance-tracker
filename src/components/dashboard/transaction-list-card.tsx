import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";

type TransactionLike = {
  id: string;
  merchant: string | null;
  date: Date;
  kind: "income" | "expense";
  originalAmount: number | { toString(): string };
  originalCurrency: string;
  category: { name: string; color: string } | null;
};

export function TransactionListCard({
  title,
  transactions,
  emptyLabel,
}: {
  title: string;
  transactions: TransactionLike[];
  emptyLabel: string;
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
          <div className="flex flex-col divide-y">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {t.merchant || t.category?.name || "Uncategorized"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {t.category ? ` · ${t.category.name}` : ""}
                  </span>
                </div>
                <span
                  className={`text-sm font-medium tabular-nums ${
                    t.kind === "income" ? "text-chart-good" : ""
                  }`}
                >
                  {t.kind === "income" ? "+" : "-"}
                  {formatMoney(Number(t.originalAmount), t.originalCurrency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
