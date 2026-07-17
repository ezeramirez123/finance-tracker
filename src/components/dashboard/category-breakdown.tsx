"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";

type CategoryTotal = { id: string; name: string; color: string; total: number };

export function CategoryBreakdown({
  title,
  categories,
  targetPath,
}: {
  title: string;
  categories: CategoryTotal[];
  /** Where clicking a category should go. Defaults to the current page (in-place
   * filtering); pass e.g. "/expenses" to navigate elsewhere instead. */
  targetPath?: string;
}) {
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
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
