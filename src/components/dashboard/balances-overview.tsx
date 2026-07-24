"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Eye, EyeOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHiddenState } from "@/lib/use-hidden-state";
import { useFormatHome } from "@/components/home-currency-provider";
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
  const [scrubbed, setScrubbed] = useState<{ date: string; netWorth: number } | null>(null);
  const formatHome = useFormatHome();

  return (
    <Card className="gap-3">
      <Link href="/accounts" className="flex items-center justify-between px-5">
        <p className="text-sm font-medium text-muted-foreground">
          {scrubbed ? format(parseISO(scrubbed.date), "MMM d") : "Balance"}
        </p>
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
          {hidden ? "••••••" : formatHome(scrubbed ? scrubbed.netWorth : totalBalance)}
        </p>
      </Link>
      {!hidden && totalBalanceHistory && (
        <Link href="/accounts" className="px-5">
          <NetWorthSparkline
            data={totalBalanceHistory.map((d) => ({ date: d.date, netWorth: d.total }))}
            size="lg"
            onScrub={setScrubbed}
          />
        </Link>
      )}

      <div className="grid grid-cols-3 divide-x border-t px-5 pt-3 text-center">
        <Link
          href={incomeHref}
          scroll={false}
          className="cursor-pointer py-1.5 pr-4 transition-colors hover:text-foreground"
        >
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="text-sm font-semibold tabular-nums text-chart-good">
            {formatHome(totalIncome)}
          </p>
        </Link>
        <Link
          href={expensesHref}
          scroll={false}
          className="cursor-pointer py-1.5 px-4 transition-colors hover:text-foreground"
        >
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="text-sm font-semibold tabular-nums text-chart-critical">
            {formatHome(totalExpenses)}
          </p>
        </Link>
        <Link
          href={netHref}
          scroll={false}
          className="cursor-pointer py-1.5 pl-4 transition-colors hover:text-foreground"
        >
          <p className="text-xs text-muted-foreground">Net</p>
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              net >= 0 ? "text-chart-good" : "text-chart-critical"
            )}
          >
            {formatHome(net)}
          </p>
        </Link>
      </div>

      <div className="border-t px-5 pt-3">
        <InlinePeriodSelect period={period} from={from} to={to} persistKey={persistKey} />
      </div>
    </Card>
  );
}
