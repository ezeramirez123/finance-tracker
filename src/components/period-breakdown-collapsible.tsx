"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useFormatHome } from "@/components/home-currency-provider";

type Bucket = { label: string; total: number; from: string; to: string };

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
  const router = useRouter();
  const pathname = usePathname();
  const formatHome = useFormatHome();
  const max = Math.max(...buckets.map((b) => b.total), 0.01);

  function goToBucket(bucket: Bucket) {
    const params = new URLSearchParams();
    params.set("period", "custom");
    params.set("from", bucket.from.slice(0, 10));
    params.set("to", bucket.to.slice(0, 10));
    router.push(`${pathname}?${params.toString()}`);
  }

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
              <button
                key={b.label}
                type="button"
                onClick={() => goToBucket(b)}
                className="flex cursor-pointer flex-col gap-1 rounded-md p-1 text-left transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between text-sm">
                  <span>{b.label}</span>
                  <span className="font-medium tabular-nums">{formatHome(b.total)}</span>
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
              </button>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
