import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";

type CategoryTotal = { name: string; color: string; total: number };

export function CategoryBreakdown({
  title,
  categories,
}: {
  title: string;
  categories: CategoryTotal[];
}) {
  const max = Math.max(...categories.map((c) => c.total), 0.01);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing here yet
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {categories.slice(0, 8).map((cat) => (
              <div key={cat.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatUsd(cat.total)}
                  </span>
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
