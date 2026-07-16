"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { format, parseISO } from "date-fns";

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
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="text-muted-foreground">{label ? format(parseISO(label), "MMM d") : ""}</p>
      <p className="font-medium tabular-nums text-popover-foreground">
        {formatUsd(payload[0].value)}
      </p>
    </div>
  );
}

export function NetWorthSparkline({ data }: { data: Point[] }) {
  if (data.length < 2) return null;

  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="netWorthSparklineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip content={<SparklineTooltip />} cursor={{ stroke: "var(--border)" }} />
          <Area
            dataKey="netWorth"
            stroke="var(--muted-foreground)"
            strokeWidth={2}
            fill="url(#netWorthSparklineFill)"
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 4, fill: "var(--muted-foreground)", stroke: "var(--card)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
