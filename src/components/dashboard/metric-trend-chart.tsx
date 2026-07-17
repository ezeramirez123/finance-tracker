"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { format, parseISO } from "date-fns";

import { formatUsd } from "@/lib/format";

type Point = { date: string; value: number };

function MetricTooltip({
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

/** A small trend chart with a Max/Min column on the left, matching the net
 * worth sparkline's layout — meant to be embedded inside a stat card rather
 * than rendering its own Card. */
export function MetricTrendChart({
  data,
  color,
}: {
  data: Point[];
  /** A CSS color value, e.g. "var(--chart-good)". */
  color: string;
}) {
  const gradientId = useId();

  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);

  return (
    <div className="flex items-stretch gap-3">
      <div className="flex h-32 shrink-0 flex-col justify-between py-1 text-[11px] tabular-nums text-muted-foreground">
        <p>{formatUsd(max)}</p>
        <p>{formatUsd(min)}</p>
      </div>
      <div className="h-32 min-w-0 flex-1 select-none [-webkit-touch-callout:none] [&_*]:outline-none [&_*]:select-none [&_*]:[touch-action:pan-y]">
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
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <Tooltip content={<MetricTooltip />} cursor={{ stroke: "var(--border)" }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
