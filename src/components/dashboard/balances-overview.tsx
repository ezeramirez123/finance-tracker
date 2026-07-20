"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/format";
import { useHiddenState } from "@/lib/use-hidden-state";
import { NetWorthSparkline } from "@/components/dashboard/net-worth-sparkline";

export function BalancesOverview({
  totalBalance,
  totalBalanceHistory,
}: {
  totalBalance: number;
  totalBalanceHistory?: { date: string; total: number }[];
}) {
  const [hidden, toggle] = useHiddenState("hideTotal");

  return (
    <Link href="/accounts">
      <Card className="gap-3 transition-colors hover:bg-accent">
        <div className="flex items-center justify-between px-5">
          <p className="text-sm font-medium text-muted-foreground">Total</p>
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
        <p className="px-5 text-3xl font-semibold tracking-tight">
          {hidden ? "••••••" : formatUsd(totalBalance)}
        </p>
        {!hidden && totalBalanceHistory && (
          <div className="px-5">
            <NetWorthSparkline
              data={totalBalanceHistory.map((d) => ({ date: d.date, netWorth: d.total }))}
            />
          </div>
        )}
      </Card>
    </Link>
  );
}
