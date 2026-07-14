"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatUsd } from "@/lib/format";

type Bucket = { label: string; total: number };

export function PeriodBreakdownCollapsible({
  title,
  buckets,
  barColorVar,
}: {
  title: string;
  buckets: Bucket[];
  barColorVar: "--chart-good" | "--chart-critical";
}) {
  const [open, setOpen] = useState(true);
  const max = Math.max(...buckets.map((b) => b.total), 0.01);

  return (
    <Card className="gap-0 py-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-1.5 px-5 py-5 text-left">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-3 pb-5">
            {buckets.map((b) => (
              <div key={b.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{b.label}</span>
                  <span className="font-medium tabular-nums">{formatUsd(b.total)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max((b.total / max) * 100, 3)}%`,
                      backgroundColor: `var(${barColorVar})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
