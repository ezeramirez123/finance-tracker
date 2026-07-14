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
