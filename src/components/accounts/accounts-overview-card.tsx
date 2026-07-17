"use client";

import { Eye, EyeOff } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PeriodTabs } from "@/components/period-tabs";
import { useHiddenState } from "@/lib/use-hidden-state";
import { formatUsd } from "@/lib/format";

const HISTORY_OPTIONS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

type AccountMeta = { id: string; name: string; icon: string; color: string };
type SeriesPoint = Record<string, number | string>;

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">
        {label ? format(parseISO(label), "MMM d") : ""}
      </p>
      <span className="font-medium tabular-nums text-popover-foreground">
        {formatUsd(payload[0].value)}
      </span>
    </div>
  );
}

function BalanceStat({
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
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-full hover:bg-background/40"
          onClick={toggle}
        >
          {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </Button>
      </div>
      <p className="text-2xl font-semibold tracking-tight">
        {hidden ? "••••••" : formatUsd(value)}
      </p>
    </div>
  );
}

export function AccountsOverviewCard({
  netWorth,
  accounts,
  series,
  period,
}: {
  netWorth: number;
  accounts: AccountMeta[];
  series: SeriesPoint[];
  period: string;
}) {
  const tickFormat = period === "year" ? "MMM yy" : "MMM d";

  const totalSeries = series.map((point) => {
    const total = accounts.reduce((sum, a) => sum + (Number(point[a.id]) || 0), 0);
    return { date: point.date, total };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balances over time</CardTitle>
        <PeriodTabs period={period} paramName="historyPeriod" options={HISTORY_OPTIONS} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <BalanceStat label="Total balance" value={netWorth} storageKey="hideNetWorth" />

        {accounts.length > 0 && (
          <div className="h-64 [&_*]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={totalSeries} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(parseISO(v), tickFormat)}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={32}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickFormatter={(v) => formatUsd(v)}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--chart-good)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
