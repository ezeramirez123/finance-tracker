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
}: {
  label: string;
  value: number;
  delta?: number | null;
  /** which direction of change should read as "good" (green) for this metric */
  deltaGoodDirection?: "up" | "down";
  className?: string;
}) {
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  const isUp = hasDelta && delta! > 0;
  const isGood = hasDelta && (deltaGoodDirection === "up" ? isUp : !isUp);

  return (
    <Card className={cn("gap-1.5", className)}>
      <p className="px-5 text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-col gap-1 px-5">
        <p className="text-2xl font-semibold tracking-tight">{formatUsd(value)}</p>
        {hasDelta && delta !== 0 && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isGood ? "text-chart-good" : "text-chart-critical"
            )}
          >
            {isUp ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(delta!).toFixed(0)}% vs last week
          </span>
        )}
      </div>
    </Card>
  );
}
