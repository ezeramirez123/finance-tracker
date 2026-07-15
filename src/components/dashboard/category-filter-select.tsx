"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { id: string; name: string; color: string };

export function CategoryFilterSelect({
  categories,
  category,
}: {
  categories: Category[];
  category?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setCategory(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("category");
    else params.set("category", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <Select value={category ?? "all"} onValueChange={setCategory}>
      <SelectTrigger className="w-full min-w-0 sm:w-48">
        <SelectValue placeholder="All categories" className="min-w-0 truncate" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All categories</SelectItem>
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            <span className="flex items-center gap-2 truncate">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
