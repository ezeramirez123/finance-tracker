import { createHmac, timingSafeEqual } from "crypto";
import { generateSecret, generateURI, verify } from "otplib";

export const MFA_COOKIE_NAME = "mfa_verified";
const MFA_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function secretKey(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to sign MFA cookies");
  return secret;
}

export function generateMfaSecret(): string {
  return generateSecret();
}

export function getOtpAuthUrl(secret: string, accountLabel: string): string {
  return generateURI({ issuer: "Semanal", label: accountLabel, secret });
}

export async function verifyMfaToken(secret: string, token: string): Promise<boolean> {
  try {
    const result = await verify({ secret, token });
    return result.valid;
  } catch {
    return false;
  }
}

/** Signed, tamper-proof cookie value proving `userId` completed MFA before `expiresAt`. */
export function signMfaCookie(userId: string): string {
  const expiresAt = Date.now() + MFA_COOKIE_MAX_AGE_SECONDS * 1000;
  const signature = createHmac("sha256", secretKey())
    .update(`${userId}.${expiresAt}`)
    .digest("hex");
  return `${expiresAt}.${signature}`;
}

export function verifyMfaCookie(cookieValue: string, userId: string): boolean {
  const [expiresAtRaw, signature] = cookieValue.split(".");
  if (!expiresAtRaw || !signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const expectedSignature = createHmac("sha256", secretKey())
    .update(`${userId}.${expiresAt}`)
    .digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const mfaCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MFA_COOKIE_MAX_AGE_SECONDS,
};
