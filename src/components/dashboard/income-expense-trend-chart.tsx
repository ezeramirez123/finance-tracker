"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis } from "recharts";
import { format, parseISO } from "date-fns";

import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/format";

type DailyPoint = { date: string; income: number; expense: number };

/** A simple income/expense bar graph, without a surrounding Card — meant to
 * be embedded inside another card (the week card, the Reports totals card).
 *
 * Scrubbing is driven by our own pointer events + setPointerCapture rather
 * than Recharts' built-in Tooltip/touch handling, which is unreliable on
 * touch devices (throttles updates via requestAnimationFrame, doesn't
 * capture the pointer, and can leave the tooltip stuck visible after
 * release) — see net-worth-sparkline.tsx for the same fix applied there. */
export function IncomeExpenseTrendGraph({ data }: { data: DailyPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrub, setScrub] = useState<{ index: number; x: number; width: number } | null>(null);

  if (data.length < 2) return null;

  function pointFromClientX(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const ratio = x / rect.width;
    const index = Math.round(ratio * (data.length - 1));
    return { index, x, width: rect.width };
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const found = pointFromClientX(e.clientX);
    if (found) setScrub(found);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const found = pointFromClientX(e.clientX);
    if (found) setScrub(found);
  }

  function handlePointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setScrub(null);
  }

  const scrubPoint = scrub ? data[scrub.index] : null;
  const tooltipWidth = 128;
  const tooltipLeft = scrub
    ? Math.min(Math.max(scrub.x - tooltipWidth / 2, 4), Math.max(scrub.width - tooltipWidth - 4, 4))
    : 0;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      style={{ touchAction: "pan-y" }}
      className="relative h-32 select-none [-webkit-touch-callout:none] [&_*]:outline-none [&_*]:select-none"
    >
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
          <Bar dataKey="income" name="Income" fill="var(--chart-good)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="expense" name="Expenses" fill="var(--chart-critical)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>

      {scrub && scrubPoint && (
        <>
          <div
            className="pointer-events-none absolute top-0 bottom-5 w-px bg-border"
            style={{ left: scrub.x }}
          />
          <div
            className="pointer-events-none absolute top-1 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: tooltipLeft, width: tooltipWidth }}
          >
            <p className="mb-1 text-muted-foreground">{format(parseISO(scrubPoint.date), "MMM d")}</p>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className={cn("size-2 rounded-full", "bg-chart-good")} />
                Income
              </span>
              <span className="font-medium tabular-nums text-popover-foreground">
                {formatUsd(scrubPoint.income)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className={cn("size-2 rounded-full", "bg-chart-critical")} />
                Expenses
              </span>
              <span className="font-medium tabular-nums text-popover-foreground">
                {formatUsd(scrubPoint.expense)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
