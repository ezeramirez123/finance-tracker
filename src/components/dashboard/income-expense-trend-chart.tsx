"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { format, parseISO } from "date-fns";

import { formatUsd } from "@/lib/format";

type DailyPoint = { date: string; income: number; expense: number };

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length || typeof label !== "string") return null;

  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="mb-1 text-muted-foreground">{format(parseISO(label), "MMM d")}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
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

/** A simple income/expense bar graph, without a surrounding Card — meant to
 * be embedded inside another card (the week card, the Reports totals card). */
export function IncomeExpenseTrendGraph({ data }: { data: DailyPoint[] }) {
  if (data.length < 2) return null;

  return (
    <div className="h-32 select-none [-webkit-touch-callout:none] [&_*]:outline-none [&_*]:select-none [&_*]:[touch-action:pan-y]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            height={20}
            tickFormatter={(v) => format(parseISO(v), "MMM d")}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ fill: "var(--accent)" }} />
          <Bar
            dataKey="income"
            name="Income"
            fill="var(--chart-good)"
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="expense"
            name="Expenses"
            fill="var(--chart-critical)"
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
