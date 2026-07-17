"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/format";
import { useHiddenState } from "@/lib/use-hidden-state";
import { NetWorthSparkline } from "@/components/dashboard/net-worth-sparkline";

function DeltaBadge({
  delta,
  deltaGoodDirection,
}: {
  delta?: number | null;
  deltaGoodDirection: "up" | "down";
}) {
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta) && delta !== 0;
  const isUp = hasDelta && delta! > 0;
  const isGood = deltaGoodDirection === "up" ? isUp : !isUp;

  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        hasDelta ? (isGood ? "text-chart-good" : "text-chart-critical") : "invisible"
      )}
    >
      {isUp ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
      {Math.abs(delta ?? 0).toFixed(0)}%
    </span>
  );
}

function Row({
  label,
  value,
  delta,
  deltaGoodDirection,
  valueColorClass,
  href,
}: {
  label: string;
  value: number;
  delta?: number | null;
  deltaGoodDirection: "up" | "down";
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
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("text-sm font-semibold tabular-nums", valueColorClass)}>
          {formatUsd(value)}
        </span>
        <DeltaBadge delta={delta} deltaGoodDirection={deltaGoodDirection} />
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export function MobileSummaryCard({
  netWorth,
  totalIncome,
  totalExpenses,
  net,
  incomeDelta,
  expenseDelta,
  netDelta,
  incomeHref = "/income",
  expensesHref = "/expenses",
  netHref = "/reports",
  netWorthHistory,
}: {
  netWorth: number;
  totalIncome: number;
  totalExpenses: number;
  net: number;
  incomeDelta?: number | null;
  expenseDelta?: number | null;
  netDelta?: number | null;
  incomeHref?: string;
  expensesHref?: string;
  netHref?: string;
  netWorthHistory?: { date: string; netWorth: number }[];
}) {
  const [hidden, toggle] = useHiddenState("hideNetWorth");

  return (
    <Card className="gap-3 md:hidden">
      <Link
        href="/accounts"
        className="block rounded-md px-5 py-1 transition-colors hover:bg-accent"
      >
        <div className="flex items-center justify-between">
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
        </div>
        <p className="text-4xl font-semibold tracking-tight">
          {hidden ? "••••••" : formatUsd(netWorth)}
        </p>
      </Link>
      {!hidden && netWorthHistory && (
        <div className="px-5">
          <NetWorthSparkline data={netWorthHistory} />
        </div>
      )}
      <div className="flex flex-col divide-y border-t px-5 pt-1">
        <Row
          label="Income"
          value={totalIncome}
          delta={incomeDelta}
          deltaGoodDirection="up"
          valueColorClass="text-chart-good"
          href={incomeHref}
        />
        <Row
          label="Expenses"
          value={totalExpenses}
          delta={expenseDelta}
          deltaGoodDirection="down"
          valueColorClass="text-chart-critical"
          href={expensesHref}
        />
        <Row
          label="Net"
          value={net}
          delta={netDelta}
          deltaGoodDirection="up"
          valueColorClass={net >= 0 ? "text-chart-good" : "text-chart-critical"}
          href={netHref}
        />
      </div>
    </Card>
  );
}
