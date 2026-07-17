"use client";

import * as React from "react";

import { periodCookieName } from "@/lib/period-cookie-name";

/**
 * Persists a page's period/date-range selection to a cookie so the server
 * can render with it directly on the next visit — see period-cookie.ts's
 * readPersistedPeriod for the server-side read.
 */
export function usePersistedPeriod(key: string) {
  return React.useCallback(
    (period: string, from?: string, to?: string) => {
      const value = encodeURIComponent(JSON.stringify({ period, from, to }));
      document.cookie = `${periodCookieName(key)}=${value}; path=/; max-age=31536000; SameSite=Lax`;
    },
    [key]
  );
}
