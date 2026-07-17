"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  /** Where clicking a slice/bar should go. Defaults to the current page (in-place
   * filtering); pass e.g. "/expenses" to navigate elsewhere instead. */
  targetPath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const destination = targetPath ?? pathname;

  if (categories.length === 0) return null;

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

  const topCategories = categories.slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="h-48 [&_*]:outline-none">
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
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div
          className="[&_*]:outline-none"
          style={{ height: Math.max(topCategories.length * 32, 64) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topCategories}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={88}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)" }} />
              <Bar
                dataKey="total"
                radius={[0, 4, 4, 0]}
                maxBarSize={16}
                cursor="pointer"
                onClick={(entry) => goToCategory((entry as unknown as CategoryTotal).id)}
              >
                {topCategories.map((c) => (
                  <Cell key={c.id} fill={c.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
