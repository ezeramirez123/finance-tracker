"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PersistedPeriod = { period: string; from?: string; to?: string };

/**
 * Remembers the last period/date-range selected on this page (keyed by
 * pathname + paramName) so returning to the page later restores it instead
 * of falling back to the page's hardcoded default.
 */
export function usePersistedPeriod(paramName = "period") {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storageKey = `period:${pathname}:${paramName}`;

  React.useEffect(() => {
    if (searchParams.get(paramName)) return;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;

    let saved: PersistedPeriod;
    try {
      saved = JSON.parse(raw);
    } catch {
      return;
    }
    if (!saved.period) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, saved.period);
    if (saved.from) params.set("from", saved.from);
    if (saved.to) params.set("to", saved.to);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // Only ever run this restore once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return React.useCallback(
    (period: string, from?: string, to?: string) => {
      localStorage.setItem(storageKey, JSON.stringify({ period, from, to }));
    },
    [storageKey]
  );
}
