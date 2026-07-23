"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { endOfMonth, format, startOfMonth } from "date-fns";

import { NetWorthSparkline } from "@/components/dashboard/net-worth-sparkline";
import { usePersistedPeriod } from "@/lib/use-persisted-period";

type Point = { date: string; netWorth: number };

/** The Total card's bar graph, where tapping a bar (a press+release that
 * didn't drag, as opposed to scrubbing) jumps the page to that bar's own
 * period — a single day, or the whole month when the graph is bucketed by
 * month (1Y/ALL views), matching getPeriodSummary's bucketing decision. */
export function TappableTotalGraph({
  data,
  color,
  bucketUnit,
  persistKey,
}: {
  data: Point[];
  color: string;
  bucketUnit: "day" | "month";
  persistKey: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const persistPeriod = usePersistedPeriod(persistKey);

  function handlePointTap(point: Point) {
    const date = new Date(`${point.date}T00:00:00`);
    const from =
      bucketUnit === "month" ? format(startOfMonth(date), "yyyy-MM-dd") : point.date;
    const to = bucketUnit === "month" ? format(endOfMonth(date), "yyyy-MM-dd") : point.date;

    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set("from", from);
    params.set("to", to);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    persistPeriod("custom", from, to);
  }

  return (
    <NetWorthSparkline
      color={color}
      data={data}
      size="lg"
      variant="bar"
      onPointTap={handlePointTap}
    />
  );
}
