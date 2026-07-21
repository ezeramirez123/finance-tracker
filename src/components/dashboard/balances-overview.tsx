"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/format";
import { useHiddenState } from "@/lib/use-hidden-state";
import { NetWorthSparkline } from "@/components/dashboard/net-worth-sparkline";
import { InlinePeriodSelect } from "@/components/dashboard/inline-period-select";
import { cn } from "@/lib/utils";

export function BalancesOverview({
  totalBalance,
  totalBalanceHistory,
  totalIncome,
  totalExpenses,
  net,
  incomeHref,
  expensesHref,
  netHref,
  period,
  from,
  to,
  persistKey,
}: {
  totalBalance: number;
  totalBalanceHistory?: { date: string; total: number }[];
  totalIncome: number;
  totalExpenses: number;
  net: number;
  incomeHref: string;
  expensesHref: string;
  netHref: string;
  period: string;
  from?: string;
  to?: string;
  persistKey: string;
}) {
  const [hidden, toggle] = useHiddenState("hideTotal");

  return (
    <Card className="gap-3">
      <Link href="/accounts" className="flex items-center justify-between px-5">
        <p className="text-sm font-medium text-muted-foreground">Balance</p>
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-full hover:bg-background/40"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle();
          }}
        >
          {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </Button>
      </Link>
      <Link href="/accounts" className="block px-5 transition-colors hover:text-foreground/90">
        <p className="text-3xl font-semibold tracking-tight">
          {hidden ? "••••••" : formatUsd(totalBalance)}
        </p>
      </Link>
      {!hidden && totalBalanceHistory && (
        <Link href="/accounts" className="px-5">
          <NetWorthSparkline
            data={totalBalanceHistory.map((d) => ({ date: d.date, netWorth: d.total }))}
            size="lg"
          />
        </Link>
      )}

      <div className="grid grid-cols-3 divide-x border-t px-5 pt-3 text-center">
        <Link
          href={incomeHref}
          scroll={false}
          className="cursor-pointer pr-4 transition-colors hover:text-foreground"
        >
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="text-sm font-semibold tabular-nums text-chart-good">
            {formatUsd(totalIncome)}
          </p>
        </Link>
        <Link
          href={expensesHref}
          scroll={false}
          className="cursor-pointer px-4 transition-colors hover:text-foreground"
        >
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="text-sm font-semibold tabular-nums text-chart-critical">
            {formatUsd(totalExpenses)}
          </p>
        </Link>
        <Link
          href={netHref}
          scroll={false}
          className="cursor-pointer pl-4 transition-colors hover:text-foreground"
        >
          <p className="text-xs text-muted-foreground">Net</p>
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              net >= 0 ? "text-chart-good" : "text-chart-critical"
            )}
          >
            {formatUsd(net)}
          </p>
        </Link>
      </div>

      <div className="border-t px-5 pt-3">
        <InlinePeriodSelect period={period} from={from} to={to} persistKey={persistKey} />
      </div>
    </Card>
  );
}
