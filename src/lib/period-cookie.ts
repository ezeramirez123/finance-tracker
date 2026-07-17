import { cookies } from "next/headers";

import { periodCookieName } from "@/lib/period-cookie-name";

export type PersistedPeriod = { period: string; from?: string; to?: string };

/** Reads a page's last-persisted period (set client-side by usePersistedPeriod)
 * so the server can render with it directly instead of the page's hardcoded
 * default — avoiding a client-side redirect flash on return visits. */
export async function readPersistedPeriod(key: string): Promise<PersistedPeriod | null> {
  const store = await cookies();
  const raw = store.get(periodCookieName(key))?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed?.period !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
