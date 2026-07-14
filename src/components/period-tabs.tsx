"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

export function PeriodTabs({
  period,
  paramName = "period",
  options = DEFAULT_OPTIONS,
}: {
  period: string;
  paramName?: string;
  options?: readonly { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setPeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Tabs value={period} onValueChange={setPeriod}>
      <TabsList>
        {options.map((opt) => (
          <TabsTrigger key={opt.value} value={opt.value}>
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
