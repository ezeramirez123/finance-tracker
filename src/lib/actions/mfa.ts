"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  MFA_COOKIE_NAME,
  generateMfaSecret,
  getOtpAuthUrl,
  mfaCookieOptions,
  signMfaCookie,
  verifyMfaToken,
} from "@/lib/mfa";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

export async function getMfaSetupData() {
  const user = await requireUser();
  const dbUser = await db.user.findUniqueOrThrow({ where: { id: user.id } });

  if (dbUser.mfaEnabled) {
    return { alreadyEnabled: true as const, otpauthUrl: null };
  }

  let secret = dbUser.mfaSecret;
  if (!secret) {
    secret = generateMfaSecret();
    await db.user.update({ where: { id: user.id }, data: { mfaSecret: secret } });
  }

  const otpauthUrl = getOtpAuthUrl(secret, user.email ?? user.id);
  return { alreadyEnabled: false as const, otpauthUrl };
}

export async function confirmMfaSetup(code: string) {
  const user = await requireUser();
  const dbUser = await db.user.findUniqueOrThrow({ where: { id: user.id } });

  if (!dbUser.mfaSecret) {
    return { error: "No pending MFA setup" };
  }

  const valid = await verifyMfaToken(dbUser.mfaSecret, code);
  if (!valid) {
    return { error: "Invalid code" };
  }

  await db.user.update({ where: { id: user.id }, data: { mfaEnabled: true } });

  const cookieStore = await cookies();
  cookieStore.set(MFA_COOKIE_NAME, signMfaCookie(user.id), mfaCookieOptions);

  redirect("/dashboard");
}

export async function verifyMfaChallenge(code: string) {
  const user = await requireUser();
  const dbUser = await db.user.findUniqueOrThrow({ where: { id: user.id } });

  if (!dbUser.mfaEnabled || !dbUser.mfaSecret) {
    redirect("/dashboard");
  }

  const valid = await verifyMfaToken(dbUser.mfaSecret, code);
  if (!valid) {
    return { error: "Invalid code" };
  }

  const cookieStore = await cookies();
  cookieStore.set(MFA_COOKIE_NAME, signMfaCookie(user.id), mfaCookieOptions);

  redirect("/dashboard");
}

export async function deletePasskey(passkeyId: string) {
  const user = await requireUser();

  await db.passkey.delete({
    where: { id: passkeyId, userId: user.id },
  });

  return { ok: true };
}

export async function disableMfa(code: string) {
  const user = await requireUser();
  const dbUser = await db.user.findUniqueOrThrow({ where: { id: user.id } });

  if (!dbUser.mfaEnabled || !dbUser.mfaSecret) {
    return { error: "MFA is not enabled" };
  }

  const valid = await verifyMfaToken(dbUser.mfaSecret, code);
  if (!valid) {
    return { error: "Invalid code" };
  }

  await db.user.update({
    where: { id: user.id },
    data: { mfaEnabled: false, mfaSecret: null },
  });

  const cookieStore = await cookies();
  cookieStore.delete(MFA_COOKIE_NAME);

  return { ok: true };
}
