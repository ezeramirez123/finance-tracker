import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDateRange, type Period } from "@/lib/period";
import { getEarliestTransactionDate, getTotalBalance, getTotalBalanceHistory } from "@/lib/dashboard-data";
import { convertToUsd } from "@/lib/currency";
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
import { ConnectBankButton } from "@/components/accounts/connect-bank-button";
import { SyncTransactionsButton } from "@/components/accounts/sync-transactions-button";
import { AccountsOverviewCard } from "@/components/accounts/accounts-overview-card";
import { formatMoney, formatUsd } from "@/lib/format";
import { readPersistedPeriod } from "@/lib/period-cookie";

const TYPE_LABELS: Record<string, string> = {
  bank: "Bank",
  cash: "Cash",
  crypto: "Crypto",
  savings: "Savings",
  credit: "Credit",
  investment: "Investment",
};

// Values match the shared `Period` type so a period selected on the Dashboard
// (or any other page) survives a cross-page link unchanged.
const PRESET_PERIODS = ["today", "week", "month", "year"] as const;

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const persisted = params.period ? null : await readPersistedPeriod("accounts");
  const effectivePeriod = params.period ?? persisted?.period;
  const effectiveFrom = params.from ?? persisted?.from;
  const effectiveTo = params.to ?? persisted?.to;

  const isCustom = effectivePeriod === "custom" && !!effectiveFrom && !!effectiveTo;
  const isAll = effectivePeriod === "all";
  const tab =
    !isCustom &&
    !isAll &&
    PRESET_PERIODS.includes(effectivePeriod as (typeof PRESET_PERIODS)[number])
      ? (effectivePeriod as (typeof PRESET_PERIODS)[number])
      : "month";
  const period: Period = isCustom ? "custom" : isAll ? "all" : tab;

  const earliestTransactionDate = isAll ? await getEarliestTransactionDate(userId) : null;
  const range = isCustom
    ? getDateRange("custom", { from: new Date(effectiveFrom!), to: new Date(effectiveTo!) })
    : getDateRange(period, undefined, earliestTransactionDate ?? undefined);

  const [accounts, totalBalance, totalBalanceHistory] = await Promise.all([
    db.financialAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    getTotalBalance(userId),
    getTotalBalanceHistory(userId, range),
  ]);

  const usdEquivalents = new Map(
    await Promise.all(
      accounts.map(async (a) => {
        const { usdEquivalent } = await convertToUsd(Number(a.currentBalance), a.currency);
        return [a.id, usdEquivalent] as const;
      })
    )
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Accounts</h1>
        <div className="flex items-center gap-2">
          {accounts.some((a) => a.isConnected) && <SyncTransactionsButton />}
          <ConnectBankButton />
          <AccountDialog />
        </div>
      </div>

      <AccountsOverviewCard
        totalBalance={totalBalance}
        totalBalanceHistory={totalBalanceHistory}
        period={period}
        from={effectiveFrom}
        to={effectiveTo}
      />

      {accounts.length === 0 ? (
        <Card className="items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No accounts yet. Add your first one to start tracking.
          </p>
        </Card>
      ) : (
        <Card className="py-0">
          <Table className="table-fixed" hideScrollHint>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden w-24 sm:table-cell">Type</TableHead>
                <TableHead className="w-12">Currency</TableHead>
                <TableHead className="w-24 text-right">Balance</TableHead>
                <TableHead className="w-24 text-right">USD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={{ ...account, currentBalance: Number(account.currentBalance) }}
                >
                  <TableCell className="font-medium">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: account.color }}
                      />
                      <span className="truncate">{account.name}</span>
                      {account.isConnected && (
                        <Badge variant="outline" className="hidden shrink-0 text-xs sm:inline-flex">
                          Connected
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden overflow-hidden sm:table-cell">
                    <Badge variant="secondary" className="block max-w-full overflow-hidden">
                      <span className="block truncate">{TYPE_LABELS[account.type]}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{account.currency}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(account.currentBalance), account.currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatUsd(usdEquivalents.get(account.id) ?? 0)}
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
