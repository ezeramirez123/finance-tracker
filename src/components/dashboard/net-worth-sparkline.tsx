"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/format";

type Point = { date: string; netWorth: number };

function SparklineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length || typeof label !== "string") return null;

  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="text-muted-foreground">{format(parseISO(label), "MMM d")}</p>
      <p className="font-medium tabular-nums text-popover-foreground">
        {formatUsd(payload[0].value)}
      </p>
    </div>
  );
}

export function NetWorthSparkline({ data }: { data: Point[] }) {
  if (data.length < 2) return null;

  const first = data[0].netWorth;
  const last = data[data.length - 1].netWorth;
  const isUp = last >= first;
  const color = isUp ? "var(--chart-good)" : "var(--chart-critical)";
  const gradientId = isUp ? "netWorthSparklineFillUp" : "netWorthSparklineFillDown";
  const percentChange = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;

  const values = data.map((d) => d.netWorth);
  const max = Math.max(...values);
  const min = Math.min(...values);

  return (
    <div className="flex items-stretch gap-3">
      <div className="flex shrink-0 flex-col justify-between py-1 text-[10px] tabular-nums text-muted-foreground">
        <p>{formatUsd(max)}</p>
        <p>{formatUsd(min)}</p>
      </div>
      <div className="h-16 min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={(v) => format(parseISO(v), "MMM d")}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <Tooltip content={<SparklineTooltip />} cursor={{ stroke: "var(--border)" }} />
            <Area
              dataKey="netWorth"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: "var(--card)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center gap-0.5 self-center text-xs font-medium tabular-nums",
          isUp ? "text-chart-good" : "text-chart-critical"
        )}
      >
        {isUp ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
        {Math.abs(percentChange).toFixed(1)}%
      </div>
    </div>
  );
}
