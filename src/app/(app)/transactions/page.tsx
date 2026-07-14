import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransactionRowActions } from "@/components/transactions/transaction-row-actions";
import { formatMoney, formatUsd } from "@/lib/format";

export default async function TransactionsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [transactions, accounts, categories] = await Promise.all([
    db.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      include: { account: true, category: true },
      take: 200,
    }),
    db.financialAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Every expense and income entry, in one place.
          </p>
        </div>
        <TransactionDialog accounts={accounts} categories={categories} />
      </div>

      {transactions.length === 0 ? (
        <Card className="items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No transactions yet. Add your first one to see it here.
          </p>
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">USD</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground">
                    {t.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {t.merchant || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {t.category ? (
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${t.category.color}20`,
                          color: t.category.color,
                        }}
                      >
                        {t.category.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Uncategorized</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="mr-1.5">{t.account.icon}</span>
                    {t.account.name}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${
                      t.kind === "income" ? "text-emerald-500" : ""
                    }`}
                  >
                    {t.kind === "income" ? "+" : "-"}
                    {formatMoney(Number(t.originalAmount), t.originalCurrency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatUsd(Number(t.usdEquivalent))}
                  </TableCell>
                  <TableCell>
                    <TransactionRowActions
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
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
