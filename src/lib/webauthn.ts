export const WEBAUTHN_CHALLENGE_COOKIE = "webauthn_challenge";

export function rpIdFromRequest(request: Request): string {
  return new URL(request.url).hostname;
}

export function originFromRequest(request: Request): string {
  return new URL(request.url).origin;
}

export const challengeCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 300, // 5 minutes — just long enough to complete the ceremony
};

// Matches Auth.js's own database-session cookie exactly (name, prefix, maxAge) so a session
// created here for a passwordless passkey sign-in is indistinguishable from an OAuth one.
export const AUTH_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // Auth.js default: 30 days

export function authSessionCookieName(): string {
  const useSecureCookies = process.env.NODE_ENV === "production";
  return `${useSecureCookies ? "__Secure-" : ""}authjs.session-token`;
}

export const authSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
};
