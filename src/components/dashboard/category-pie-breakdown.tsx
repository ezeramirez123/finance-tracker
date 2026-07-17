"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";

type CategoryTotal = { id: string; name: string; color: string; total: number };

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: CategoryTotal }[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: entry.payload.color }} />
        <span className="text-popover-foreground">{entry.name}</span>
      </div>
      <p className="mt-1 font-medium tabular-nums text-popover-foreground">
        {formatUsd(entry.value)}
      </p>
    </div>
  );
}

/** A pie chart (no legend/slice labels) with the category list acting as its
 * legend underneath — the pie and the list share a single click target. */
export function CategoryPieBreakdown({
  title,
  categories,
  targetPath,
  action,
}: {
  title: string;
  categories: CategoryTotal[];
  /** Where clicking a category should go. Defaults to the current page (in-place
   * filtering); pass e.g. "/expenses" to navigate elsewhere instead. */
  targetPath?: string;
  /** Extra control rendered in the header next to the title, e.g. a category filter. */
  action?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const destination = targetPath ?? pathname;

  if (categories.length === 0) return null;

  const max = Math.max(...categories.map((c) => c.total), 0.01);

  function hrefFor(categoryId: string) {
    let params: URLSearchParams;
    if (destination === pathname) {
      params = new URLSearchParams(searchParams.toString());
    } else {
      // Cross-page navigation: carry over the current period/date-range
      // selection instead of resetting the target page to its own default.
      params = new URLSearchParams();
      for (const key of ["period", "from", "to"]) {
        const value = searchParams.get(key);
        if (value) params.set(key, value);
      }
    }
    params.set("category", categoryId);
    return `${destination}?${params.toString()}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="h-40 [&_*]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="total"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={2}
                  strokeWidth={0}
                  cursor="pointer"
                  onClick={(entry) =>
                    router.push(hrefFor((entry as unknown as CategoryTotal).id), {
                      scroll: false,
                    })
                  }
                >
                  {categories.map((c) => (
                    <Cell key={c.id} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-3">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={hrefFor(cat.id)}
                scroll={false}
                className="flex flex-col gap-1 rounded-md p-1 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </span>
                  <span className="font-medium tabular-nums">{formatUsd(cat.total)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max((cat.total / max) * 100, 3)}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
