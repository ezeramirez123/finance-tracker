import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";

export function StatTile({
  label,
  value,
  delta,
  deltaGoodDirection = "up",
  className,
  href,
}: {
  label: string;
  value: number;
  delta?: number | null;
  /** which direction of change should read as "good" (green) for this metric */
  deltaGoodDirection?: "up" | "down";
  className?: string;
  /** Where clicking the whole card should go. Omit for metrics with no dedicated page. */
  href?: string;
}) {
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  const isUp = hasDelta && delta! > 0;
  const isGood = hasDelta && (deltaGoodDirection === "up" ? isUp : !isUp);

  const content = (
    <Card
      className={cn(
        "gap-1.5",
        href && "cursor-pointer transition-colors hover:bg-accent",
        className
      )}
    >
      <p className="px-5 text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-col gap-1 px-5">
        <p className="text-2xl font-semibold tracking-tight">{formatUsd(value)}</p>
        <span
          className={cn(
            "flex items-center gap-0.5 text-xs font-medium",
            hasDelta && delta !== 0
              ? isGood
                ? "text-chart-good"
                : "text-chart-critical"
              : "invisible"
          )}
        >
          {isUp ? (
            <ArrowUpRight className="size-3.5" />
          ) : (
            <ArrowDownRight className="size-3.5" />
          )}
          {Math.abs(delta ?? 0).toFixed(0)}% vs last week
        </span>
      </div>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
