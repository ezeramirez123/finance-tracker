import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getAccountBalanceHistorySeries,
  getNetWorth,
  getTotalBalance,
} from "@/lib/dashboard-data";
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
import { AccountRow } from "@/components/accounts/account-row";
import {
  AccountRowActions,
  IncludeInNetWorthToggle,
} from "@/components/accounts/account-actions";
import { ConnectBankButton } from "@/components/accounts/connect-bank-button";
import { SyncTransactionsButton } from "@/components/accounts/sync-transactions-button";
import { AccountBalanceHistoryChart } from "@/components/accounts/account-balance-history-chart";
import { BalancesOverview } from "@/components/dashboard/balances-overview";
import { formatMoney } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = {
  bank: "Bank",
  cash: "Cash",
  crypto: "Crypto",
  savings: "Savings",
  credit: "Credit",
  investment: "Investment",
};

const HISTORY_PERIOD_DAYS: Record<string, number> = {
  week: 7,
  month: 30,
  year: 365,
};

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ historyPeriod?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const historyPeriod =
    params.historyPeriod && params.historyPeriod in HISTORY_PERIOD_DAYS
      ? params.historyPeriod
      : "month";

  const [accounts, balanceHistory, netWorth, totalBalance] = await Promise.all([
    db.financialAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    getAccountBalanceHistorySeries(userId, HISTORY_PERIOD_DAYS[historyPeriod]),
    getNetWorth(userId),
    getTotalBalance(userId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
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

      <BalancesOverview netWorth={netWorth} totalBalance={totalBalance} />

      <AccountBalanceHistoryChart
        accounts={balanceHistory.accounts}
        series={balanceHistory.series}
        period={historyPeriod}
      />

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
                <AccountRow
                  key={account.id}
                  account={{ ...account, currentBalance: Number(account.currentBalance) }}
                >
                  <TableCell className="max-w-[280px] font-medium">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: account.color }}
                      />
                      <span className="shrink-0 text-base">{account.icon}</span>
                      <span className="truncate">{account.name}</span>
                      {account.isConnected && (
                        <Badge variant="outline" className="shrink-0 text-xs">
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
                </AccountRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
