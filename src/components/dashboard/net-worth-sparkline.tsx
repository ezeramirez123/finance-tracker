"use client";

import { useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  type MouseHandlerDataParam,
} from "recharts";
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

export function NetWorthSparkline({
  data,
  color: fixedColor,
  size = "sm",
  showLabels = true,
  showXAxis = true,
  variant = "area",
  onScrub,
}: {
  data: Point[];
  /** Use a fixed line/badge color instead of green-up/red-down — for series
   * like income or expenses where "up" isn't inherently good or bad. */
  color?: string;
  /** "lg" gives the chart more vertical room — for contexts with more space
   * to spare, e.g. the desktop Total card. */
  size?: "sm" | "lg";
  /** Set false to hide the max/mid/min column and trend badge, letting the
   * chart fill the full width — e.g. mobile's compact balance card. */
  showLabels?: boolean;
  /** Set false to hide the date labels below the chart, giving the plot the
   * full height instead of reserving space for them. */
  showXAxis?: boolean;
  /** "bar" renders one bar per point instead of a filled area/line. */
  variant?: "area" | "bar";
  /** Called with the point under the cursor/finger while hovering or
   * touch-dragging, and null once released — lets a parent (e.g. the
   * balance card) show the scrubbed value instead of the latest one. */
  onScrub?: (point: Point | null) => void;
}) {
  // Recharts throttles touchmove updates via requestAnimationFrame — the
  // deferred update from the last touchmove can land *after* touchend fires,
  // re-activating the scrub state right after we cleared it. This flag
  // suppresses any move update that arrives once we've released.
  const releasedRef = useRef(false);
  // Controls Tooltip's `active` prop directly instead of trusting Recharts'
  // own internal active-state, which is subject to the same stray-update
  // bug — without this, the tooltip popup and cursor line can stay stuck
  // visible after release even though our own scrub state correctly clears.
  const [scrubActive, setScrubActive] = useState(false);

  if (data.length < 2) return null;

  const first = data[0].netWorth;
  const last = data[data.length - 1].netWorth;
  const isUp = last >= first;
  const color = fixedColor ?? (isUp ? "var(--chart-good)" : "var(--chart-critical)");
  const gradientId = isUp ? "netWorthSparklineFillUp" : "netWorthSparklineFillDown";
  const percentChange = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;

  const values = data.map((d) => d.netWorth);
  const max = Math.max(...values);
  const min = Math.min(...values);

  const heightClass = size === "lg" ? "h-40" : "h-16";

  function handleScrubStart() {
    releasedRef.current = false;
  }

  function handleScrubMove(state: MouseHandlerDataParam) {
    if (releasedRef.current || !state.isTooltipActive) return;
    const index = Number(state.activeIndex);
    if (!Number.isInteger(index)) return;
    const point = data[index];
    if (!point) return;
    setScrubActive(true);
    onScrub?.(point);
  }

  function handleScrubEnd() {
    releasedRef.current = true;
    setScrubActive(false);
    onScrub?.(null);
  }

  return (
    <div className="flex items-stretch gap-3">
      {showLabels && (
        <div
          className={cn(
            "flex shrink-0 flex-col justify-between pt-1 text-[10px] tabular-nums text-muted-foreground",
            showXAxis ? "pb-5" : "pb-1",
            heightClass
          )}
        >
          <p>{formatUsd(max)}</p>
          <p>{formatUsd((max + min) / 2)}</p>
          <p>{formatUsd(min)}</p>
        </div>
      )}
      <div
        className={cn(
          "min-w-0 flex-1 select-none [-webkit-touch-callout:none] [&_*]:outline-none [&_*]:select-none [&_*]:[touch-action:pan-y]",
          heightClass
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          {variant === "bar" ? (
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              onMouseEnter={handleScrubStart}
              onTouchStart={handleScrubStart}
              onMouseMove={handleScrubMove}
              onTouchMove={handleScrubMove}
              onMouseLeave={handleScrubEnd}
              onTouchEnd={handleScrubEnd}
            >
              <XAxis
                dataKey="date"
                height={showXAxis ? 20 : 0}
                tickFormatter={(v) => format(parseISO(v), "MMM d")}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tick={showXAxis ? { fontSize: 10, fill: "var(--muted-foreground)" } : false}
              />
              <Tooltip
                active={scrubActive}
                content={<SparklineTooltip />}
                cursor={{ fill: "var(--accent)" }}
              />
              <Bar
                dataKey="netWorth"
                fill={color}
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          ) : (
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              onMouseEnter={handleScrubStart}
              onTouchStart={handleScrubStart}
              onMouseMove={handleScrubMove}
              onTouchMove={handleScrubMove}
              onMouseLeave={handleScrubEnd}
              onTouchEnd={handleScrubEnd}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                height={showXAxis ? 20 : 0}
                tickFormatter={(v) => format(parseISO(v), "MMM d")}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tick={showXAxis ? { fontSize: 10, fill: "var(--muted-foreground)" } : false}
              />
              <Tooltip
                active={scrubActive}
                content={<SparklineTooltip />}
                cursor={{ stroke: "var(--border)" }}
              />
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
          )}
        </ResponsiveContainer>
      </div>
      {showLabels && (
        <div
          className={cn(
            "flex shrink-0 items-center gap-0.5 self-center text-xs font-medium tabular-nums",
            fixedColor ? undefined : isUp ? "text-chart-good" : "text-chart-critical"
          )}
          style={fixedColor ? { color: fixedColor } : undefined}
        >
          {isUp ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {Math.abs(percentChange).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
