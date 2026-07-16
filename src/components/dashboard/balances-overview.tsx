"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/format";
import { useHiddenState } from "@/lib/use-hidden-state";

function BalanceCard({
  label,
  value,
  storageKey,
}: {
  label: string;
  value: number;
  storageKey: string;
}) {
  const [hidden, toggle] = useHiddenState(storageKey);

  return (
    <Link href="/accounts">
      <Card className="gap-1.5 cursor-pointer transition-colors hover:bg-accent">
        <div className="flex items-center justify-between px-5">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <Button
            variant="ghost"
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
    </Link>
  );
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
      <BalanceCard label="Net worth" value={netWorth} storageKey="hideNetWorth" />
      <BalanceCard label="Total" value={totalBalance} storageKey="hideTotal" />
    </div>
  );
}
