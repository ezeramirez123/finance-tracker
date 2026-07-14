import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";

import { db } from "@/lib/db";
import {
  WEBAUTHN_CHALLENGE_COOKIE,
  originFromRequest,
  rpIdFromRequest,
  authSessionCookieName,
  authSessionCookieOptions,
  AUTH_SESSION_MAX_AGE_SECONDS,
} from "@/lib/webauthn";
import { MFA_COOKIE_NAME, mfaCookieOptions, signMfaCookie } from "@/lib/mfa";

/** Passwordless primary sign-in: the passkey alone identifies and authenticates the
 * user (no prior Google session). On success we create a real Auth.js database
 * session directly, indistinguishable from one created via OAuth. */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(WEBAUTHN_CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) {
    return NextResponse.json({ error: "Verification expired, try again" }, { status: 400 });
  }

  const response = await request.json();

  const passkey = await db.passkey.findUnique({ where: { credentialId: response.id } });
  if (!passkey) {
    return NextResponse.json({ error: "Unknown passkey" }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: originFromRequest(request),
      expectedRPID: rpIdFromRequest(request),
      requireUserVerification: true,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: passkey.counter,
        transports: passkey.transports
          ? (passkey.transports.split(",") as AuthenticatorTransportFuture[])
          : undefined,
      },
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  } finally {
    cookieStore.delete(WEBAUTHN_CHALLENGE_COOKIE);
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "Could not verify passkey" }, { status: 400 });
  }

  await db.passkey.update({
    where: { id: passkey.id },
    data: { counter: verification.authenticationInfo.newCounter },
  });

  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + AUTH_SESSION_MAX_AGE_SECONDS * 1000);
  await db.session.create({
    data: { sessionToken, userId: passkey.userId, expires },
  });

  cookieStore.set(authSessionCookieName(), sessionToken, authSessionCookieOptions);
  // The passkey itself is the phishing-resistant factor — don't also send them to /mfa/verify.
  cookieStore.set(MFA_COOKIE_NAME, signMfaCookie(passkey.userId), mfaCookieOptions);

  return NextResponse.json({ ok: true });
}
