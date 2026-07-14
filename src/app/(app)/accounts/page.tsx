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
import { AccountDialog } from "@/components/accounts/account-dialog";
import {
  AccountRowActions,
  IncludeInNetWorthToggle,
} from "@/components/accounts/account-actions";
import { ConnectBankButton } from "@/components/accounts/connect-bank-button";
import { SyncTransactionsButton } from "@/components/accounts/sync-transactions-button";
import { formatMoney } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = {
  bank: "Bank",
  cash: "Cash",
  crypto: "Crypto",
  savings: "Savings",
  credit: "Credit",
  investment: "Investment",
};

export default async function AccountsPage() {
  const session = await auth();
  const accounts = await db.financialAccount.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Every place your money lives.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {accounts.some((a) => a.isConnected) && <SyncTransactionsButton />}
          <ConnectBankButton />
          <AccountDialog />
        </div>
      </div>

      {accounts.length === 0 ? (
        <Card className="items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No accounts yet. Add your first one to start tracking.
          </p>
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Net worth</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{account.icon}</span>
                      {account.name}
                      {account.isConnected && (
                        <Badge variant="outline" className="text-xs">
                          Connected
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{TYPE_LABELS[account.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.currency}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(account.currentBalance), account.currency)}
                  </TableCell>
                  <TableCell className="text-center">
                    <IncludeInNetWorthToggle
                      account={{
                        ...account,
                        currentBalance: Number(account.currentBalance),
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <AccountRowActions
                      account={{
                        ...account,
                        currentBalance: Number(account.currentBalance),
                      }}
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
