"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/format";

const STORAGE_KEY = "hideBalances";

function BalanceCard({
  label,
  value,
  hint,
  hidden,
  onToggle,
}: {
  label: string;
  value: number;
  hint: string;
  hidden: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="gap-1.5">
      <div className="flex items-center justify-between px-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Button variant="ghost" size="icon" className="size-6" onClick={onToggle}>
          {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </Button>
      </div>
      <p className="px-5 text-2xl font-semibold tracking-tight">
        {hidden ? "••••••" : formatUsd(value)}
      </p>
      <p className="px-5 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

export function BalancesOverview({
  netWorth,
  totalBalance,
}: {
  netWorth: number;
  totalBalance: number;
}) {
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    // Read after mount (not in a lazy initializer) so server and client render
    // the same markup on first paint; localStorage isn't available during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(STORAGE_KEY) === "true") setHidden(true);
  }, []);

  function toggle() {
    setHidden((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <BalanceCard
        label="Net worth"
        value={netWorth}
        hint='Accounts marked "include in net worth"'
        hidden={hidden}
        onToggle={toggle}
      />
      <BalanceCard
        label="Total across all accounts"
        value={totalBalance}
        hint="Every account, regardless of net worth setting"
        hidden={hidden}
        onToggle={toggle}
      />
    </div>
  );
}
