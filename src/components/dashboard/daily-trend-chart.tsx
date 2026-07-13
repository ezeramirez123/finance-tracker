"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";

type DailyPoint = { date: string; income: number; expense: number };

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-popover-foreground">
        {label ? format(parseISO(label), "EEE, MMM d") : ""}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-medium tabular-nums text-popover-foreground">
            {formatUsd(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DailyTrendChart({ data }: { data: DailyPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily activity</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No activity yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid
                vertical={false}
                stroke="var(--chart-grid)"
                strokeDasharray="0"
              />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => format(parseISO(v), "EEE")}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tickFormatter={(v) => formatUsd(v)}
                tickLine={false}
                axisLine={false}
                width={64}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)" }} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="income"
                name="Income"
                fill="var(--chart-good)"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="var(--chart-critical)"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
