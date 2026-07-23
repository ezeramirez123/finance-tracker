"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Eye, EyeOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/format";
import { useHiddenState } from "@/lib/use-hidden-state";
import { NetWorthSparkline } from "@/components/dashboard/net-worth-sparkline";
import { InlinePeriodSelect } from "@/components/dashboard/inline-period-select";

export function AccountsOverviewCard({
  totalBalance,
  totalBalanceHistory,
  period,
  from,
  to,
}: {
  totalBalance: number;
  totalBalanceHistory: { date: string; total: number }[];
  period: string;
  from?: string;
  to?: string;
}) {
  const [hidden, toggle] = useHiddenState("hideNetWorth");
  const [scrubbed, setScrubbed] = useState<{ date: string; netWorth: number } | null>(null);

  return (
    <Card className="gap-3">
      <div className="flex items-center justify-between px-5">
        <p className="text-sm font-medium text-muted-foreground">
          {scrubbed ? format(parseISO(scrubbed.date), "MMM d") : "Total balance"}
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
      <p className="px-5 text-3xl font-semibold tracking-tight">
        {hidden ? "••••••" : formatUsd(scrubbed ? scrubbed.netWorth : totalBalance)}
      </p>
      {!hidden && totalBalanceHistory.length > 1 && (
        <div className="px-5">
          <NetWorthSparkline
            data={totalBalanceHistory.map((d) => ({ date: d.date, netWorth: d.total }))}
            size="lg"
            showLabels={false}
            showXAxis={false}
            onScrub={setScrubbed}
          />
        </div>
      )}
      <div className="border-t px-5 pt-3">
        <InlinePeriodSelect period={period} from={from} to={to} persistKey="accounts" />
      </div>
    </Card>
  );
}
