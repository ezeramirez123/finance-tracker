"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Eye, EyeOff, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/format";
import { useHiddenState } from "@/lib/use-hidden-state";
import { NetWorthSparkline } from "@/components/dashboard/net-worth-sparkline";
import { InlinePeriodSelect } from "@/components/dashboard/inline-period-select";

function Row({
  label,
  icon: Icon,
  iconColorClass,
  value,
  valueColorClass,
  href,
}: {
  label: string;
  icon: LucideIcon;
  iconColorClass: string;
  value: number;
  valueColorClass?: string;
  href?: string;
}) {
  const content = (
    <div
      className={cn(
        "flex items-center justify-between py-3",
        href && "-mx-5 cursor-pointer rounded-md px-5 transition-colors hover:bg-accent"
      )}
    >
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon className={cn("size-3.5", iconColorClass)} />
        {label}
      </span>
      <span className={cn("text-sm font-semibold tabular-nums", valueColorClass)}>
        {formatUsd(value)}
      </span>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export function MobileSummaryCard({
  netWorth,
  totalIncome,
  totalExpenses,
  net,
  incomeHref = "/income",
  expensesHref = "/expenses",
  netHref = "/reports",
  netWorthHistory,
  period,
  from,
  to,
  persistKey,
}: {
  netWorth: number;
  totalIncome: number;
  totalExpenses: number;
  net: number;
  incomeHref?: string;
  expensesHref?: string;
  netHref?: string;
  netWorthHistory?: { date: string; netWorth: number }[];
  period: string;
  from?: string;
  to?: string;
  persistKey: string;
}) {
  const [hidden, toggle] = useHiddenState("hideNetWorth");
  const [scrubbed, setScrubbed] = useState<{ date: string; netWorth: number } | null>(null);

  return (
    <Card className="gap-3 md:hidden">
      <div className="px-5 py-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {scrubbed ? format(parseISO(scrubbed.date), "MMM d") : "Balance"}
          </p>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-full hover:bg-background/40"
            onClick={toggle}
          >
            {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </Button>
        </div>
        <p className="text-3xl font-semibold tracking-tight">
          {hidden ? "••••••" : formatUsd(scrubbed ? scrubbed.netWorth : netWorth)}
        </p>
      </div>
      {!hidden && netWorthHistory && (
        <div className="px-5">
          <NetWorthSparkline
            data={netWorthHistory}
            size="lg"
            showLabels={false}
            showXAxis={false}
            onScrub={setScrubbed}
          />
        </div>
      )}
      <div className="flex flex-col divide-y border-t px-5 pt-1">
        <Row
          label="Income"
          icon={ArrowUpRight}
          iconColorClass="text-chart-good"
          value={totalIncome}
          valueColorClass="text-chart-good"
          href={incomeHref}
        />
        <Row
          label="Expenses"
          icon={ArrowDownRight}
          iconColorClass="text-chart-critical"
          value={totalExpenses}
          valueColorClass="text-chart-critical"
          href={expensesHref}
        />
        <Row
          label="Balance"
          icon={Scale}
          iconColorClass="text-muted-foreground"
          value={net}
          valueColorClass={net >= 0 ? "text-chart-good" : "text-chart-critical"}
          href={netHref}
        />
      </div>
      <div className="border-t px-5 py-2">
        <InlinePeriodSelect period={period} from={from} to={to} persistKey={persistKey} />
      </div>
    </Card>
  );
}
