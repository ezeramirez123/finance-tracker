"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/format";

type Point = { date: string; netWorth: number };

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
  /** Called with the point under the finger/cursor while pressed, and null
   * once released — lets a parent (e.g. the balance card) show the scrubbed
   * value instead of the latest one. */
  onScrub?: (point: Point | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Scrubbing is driven entirely by our own pointer events + setPointerCapture
  // instead of Recharts' onMouseMove/onTouchMove — Recharts throttles touch
  // updates via requestAnimationFrame internally (a deferred update can land
  // *after* release, re-activating state we just cleared) and doesn't capture
  // the pointer, so a fast drag that strays outside the chart loses tracking.
  // Owning the pointer directly avoids both failure modes.
  const [scrub, setScrub] = useState<{ index: number; x: number; width: number } | null>(null);

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

  function pointFromClientX(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const ratio = x / rect.width;
    const index = Math.round(ratio * (data.length - 1));
    return { index, x, width: rect.width };
  }

  function updateFromEvent(e: ReactPointerEvent<HTMLDivElement>) {
    const found = pointFromClientX(e.clientX);
    if (!found) return;
    setScrub(found);
    onScrub?.(data[found.index] ?? null);
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromEvent(e);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    updateFromEvent(e);
  }

  function handlePointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setScrub(null);
    onScrub?.(null);
  }

  const scrubPoint = scrub ? data[scrub.index] : null;
  const tooltipWidth = 104;
  const tooltipLeft = scrub
    ? Math.min(Math.max(scrub.x - tooltipWidth / 2, 4), Math.max(scrub.width - tooltipWidth - 4, 4))
    : 0;

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
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        style={{ touchAction: "pan-y" }}
        className={cn(
          "relative min-w-0 flex-1 select-none [-webkit-touch-callout:none] [&_*]:outline-none [&_*]:select-none",
          heightClass
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          {variant === "bar" ? (
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                height={showXAxis ? 20 : 0}
                tickFormatter={(v) => format(parseISO(v), "MMM d")}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tick={showXAxis ? { fontSize: 10, fill: "var(--muted-foreground)" } : false}
              />
              <Bar
                dataKey="netWorth"
                fill={color}
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
              <Area
                dataKey="netWorth"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
                dot={false}
                activeDot={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>

        {scrub && scrubPoint && (
          <>
            <div
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-border"
              style={{ left: scrub.x }}
            />
            <div
              className="pointer-events-none absolute top-1 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
              style={{ left: tooltipLeft, width: tooltipWidth }}
            >
              <p className="text-muted-foreground">{format(parseISO(scrubPoint.date), "MMM d")}</p>
              <p className="font-medium tabular-nums text-popover-foreground">
                {formatUsd(scrubPoint.netWorth)}
              </p>
            </div>
          </>
        )}
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
