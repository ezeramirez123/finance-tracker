import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";

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
}) {
  return (
    <Card className="gap-3 md:hidden">
      <Link
        href="/accounts"
        className="block rounded-md px-5 py-1 transition-colors hover:bg-accent"
      >
        <p className="text-sm font-medium text-muted-foreground">Net worth</p>
        <p className="text-4xl font-semibold tracking-tight">{formatUsd(netWorth)}</p>
      </Link>
      <div className="flex flex-col divide-y px-5">
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
        />
      </div>
    </Card>
  );
}
