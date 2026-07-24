"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFormatHome } from "@/components/home-currency-provider";

type CategoryTotal = { id: string; name: string; color: string; total: number };

const VISIBLE_COUNT = 5;

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: CategoryTotal }[];
}) {
  const formatHome = useFormatHome();
  if (!active || !payload?.length) return null;
  const entry = payload[0];

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: entry.payload.color }} />
        <span className="text-popover-foreground">{entry.name}</span>
      </div>
      <p className="mt-1 font-medium tabular-nums text-popover-foreground">
        {formatHome(entry.value)}
      </p>
    </div>
  );
}

/** A pie chart (no legend/slice labels) with the category list acting as its
 * legend — the pie and the list share a single click target. Stacks on
 * mobile, splits pie-left/list-right on desktop. */
export function CategoryPieBreakdown({
  title,
  categories,
  targetPath,
  periodLabel,
}: {
  title: string;
  categories: CategoryTotal[];
  /** Where clicking a category should go. Defaults to the current page (in-place
   * filtering); pass e.g. "/expenses" to navigate elsewhere instead. */
  targetPath?: string;
  /** Human-readable period, e.g. "July", "This week" — shown in the pie's
   * center as "{Income|Spending} in {periodLabel}" instead of the raw title. */
  periodLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formatHome = useFormatHome();
  const destination = targetPath ?? pathname;

  if (categories.length === 0) return null;

  const totalSum = categories.reduce((sum, c) => sum + c.total, 0) || 0.01;
  const metricLabel = title.replace(/ by category$/i, "");
  const centerLabel = periodLabel ? `${metricLabel} in ${periodLabel}` : title;

  // Only truncate when there's somewhere else to send people for the rest —
  // on the category's own tab (e.g. Income by category on /income) there's
  // nowhere further to go, so just show everything.
  const respectiveHref = /income/i.test(metricLabel) ? "/income" : "/expenses";
  const sectionId = `${metricLabel.toLowerCase()}-by-category`;
  const isOwnTab = pathname === respectiveHref;
  const showTruncated = !isOwnTab && categories.length > VISIBLE_COUNT;
  const visible = showTruncated ? categories.slice(0, VISIBLE_COUNT) : categories;

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

  function moreHref() {
    const params = new URLSearchParams();
    for (const key of ["period", "from", "to"]) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return `${respectiveHref}${qs ? `?${qs}` : ""}#${sectionId}`;
  }

  return (
    <Card id={sectionId} className="scroll-mt-16">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
          <div className="relative h-52 shrink-0 [&_*]:outline-none lg:h-72 lg:w-2/5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="total"
                  nameKey="name"
                  innerRadius="80%"
                  outerRadius="88%"
                  paddingAngle={2}
                  strokeWidth={0}
                  cursor="pointer"
                  isAnimationActive={false}
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
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 px-6 text-center">
              <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
              <span className="text-base font-semibold tabular-nums">{formatHome(totalSum)}</span>
            </div>
          </div>

          <div className="hidden w-px shrink-0 self-stretch bg-border lg:block" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-col divide-y">
              {visible.map((cat) => (
                <Link
                  key={cat.id}
                  href={hrefFor(cat.id)}
                  scroll={false}
                  className="-mx-2 flex flex-col gap-1.5 rounded-md px-2 py-3 text-sm transition-colors hover:bg-accent/50 active:bg-accent"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 truncate">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-medium tabular-nums">{formatHome(cat.total)}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {((cat.total / totalSum) * 100).toFixed(0)}%
                      </span>
                    </span>
                  </span>
                  <span className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.min((cat.total / totalSum) * 100, 100)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </span>
                </Link>
              ))}
            </div>
            {showTruncated && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full text-muted-foreground"
                asChild
              >
                <Link href={moreHref()}>See more</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
