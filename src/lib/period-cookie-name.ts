// Pure, environment-agnostic helper — kept in its own module (no
// "next/headers" import) so client components can safely import it without
// pulling a server-only module into the client bundle. See period-cookie.ts
// for the server-side reader that DOES use next/headers.
export function periodCookieName(key: string) {
  return `period_${key}`;
}
