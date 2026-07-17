"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/format";
import { useHiddenState } from "@/lib/use-hidden-state";

function BalanceCard({
  label,
  value,
  storageKey,
  href,
}: {
  label: string;
  value: number;
  storageKey: string;
  href?: string;
}) {
  const [hidden, toggle] = useHiddenState(storageKey);

  const card = (
    <Card
      className={cn("gap-1.5", href && "cursor-pointer transition-colors hover:bg-accent")}
    >
      <div className="flex items-center justify-between px-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
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
      <p className="px-5 text-2xl font-semibold tracking-tight">
        {hidden ? "••••••" : formatUsd(value)}
      </p>
    </Card>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

export function BalancesOverview({
  netWorth,
  totalBalance,
}: {
  netWorth: number;
  totalBalance: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <BalanceCard label="Balance" value={netWorth} storageKey="hideNetWorth" />
      <BalanceCard label="Total" value={totalBalance} storageKey="hideTotal" href="/accounts" />
    </div>
  );
}
