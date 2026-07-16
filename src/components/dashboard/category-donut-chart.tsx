"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

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
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: entry.payload.color }}
        />
        <span className="text-popover-foreground">{entry.name}</span>
      </div>
      <p className="mt-1 font-medium tabular-nums text-popover-foreground">
        {formatUsd(entry.value)}
      </p>
    </div>
  );
}

export function CategoryDonutChart({
  title,
  categories,
  targetPath,
}: {
  title: string;
  categories: CategoryTotal[];
  /** Where clicking a slice should go. Defaults to the current page (in-place
   * filtering); pass e.g. "/expenses" to navigate elsewhere instead. */
  targetPath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const destination = targetPath ?? pathname;

  function goToCategory(categoryId: string) {
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
    router.push(`${destination}?${params.toString()}`, { scroll: false });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {categories.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Nothing here yet
          </div>
        ) : (
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
                onClick={(entry) => goToCategory((entry as unknown as CategoryTotal).id)}
              >
                {categories.map((c) => (
                  <Cell key={c.id} fill={c.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
                layout="vertical"
                verticalAlign="middle"
                align="right"
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
