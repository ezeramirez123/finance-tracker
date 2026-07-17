"use client";

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
import { PeriodTabs } from "@/components/period-tabs";
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

export function AccountBalanceHistoryChart({
  accounts,
  series,
  period,
}: {
  accounts: AccountMeta[];
  series: SeriesPoint[];
  period: string;
}) {
  if (accounts.length === 0) return null;

  const tickFormat = period === "year" ? "MMM yy" : "MMM d";

  const totalSeries = series.map((point) => {
    const total = accounts.reduce((sum, a) => sum + (Number(point[a.id]) || 0), 0);
    return { date: point.date, total };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account balances over time</CardTitle>
        <PeriodTabs period={period} paramName="historyPeriod" options={HISTORY_OPTIONS} />
      </CardHeader>
      <CardContent className="h-72 [&_*]:outline-none">
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
      </CardContent>
    </Card>
  );
}
