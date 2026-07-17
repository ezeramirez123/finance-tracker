"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePersistedPeriod } from "@/lib/use-persisted-period";

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
  const persistPeriod = usePersistedPeriod(paramName);

  function setPeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, value);
    router.push(`${pathname}?${params.toString()}`);
    persistPeriod(value);
  }

  return (
    <Select value={period} onValueChange={setPeriod}>
      <SelectTrigger className="w-[110px] min-w-0 shrink-0">
        <SelectValue placeholder="Period" className="min-w-0 truncate" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
