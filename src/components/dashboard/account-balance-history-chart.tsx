"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";

type AccountMeta = { id: string; name: string; icon: string; color: string };
type SeriesPoint = Record<string, number | string>;

function CustomTooltip({
  active,
  payload,
  label,
  accounts,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
  accounts: AccountMeta[];
}) {
  if (!active || !payload?.length) return null;
  const nameById = new Map(accounts.map((a) => [a.id, `${a.icon} ${a.name}`]));

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-popover-foreground">
        {label ? format(parseISO(label), "MMM d") : ""}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {nameById.get(entry.dataKey) ?? entry.dataKey}
          </span>
          <span className="font-medium tabular-nums text-popover-foreground">
            {formatUsd(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AccountBalanceHistoryChart({
  accounts,
  series,
}: {
  accounts: AccountMeta[];
  series: SeriesPoint[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account balances over time</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {accounts.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No accounts yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="0" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => format(parseISO(v), "MMM d")}
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
              <Tooltip content={<CustomTooltip accounts={accounts} />} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
                iconSize={8}
                formatter={(_value, entry) => {
                  const account = accounts.find((a) => a.id === (entry as { dataKey?: string }).dataKey);
                  return account ? `${account.icon} ${account.name}` : String(_value);
                }}
              />
              {accounts.map((account) => (
                <Line
                  key={account.id}
                  type="monotone"
                  dataKey={account.id}
                  name={account.id}
                  stroke={account.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
