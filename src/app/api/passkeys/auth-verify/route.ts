import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { WEBAUTHN_CHALLENGE_COOKIE, originFromRequest, rpIdFromRequest } from "@/lib/webauthn";
import { MFA_COOKIE_NAME, mfaCookieOptions, signMfaCookie } from "@/lib/mfa";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(WEBAUTHN_CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) {
    return NextResponse.json({ error: "Verification expired, try again" }, { status: 400 });
  }

  const response = await request.json();

  const passkey = await db.passkey.findFirst({
    where: { credentialId: response.id, userId: session.user.id },
  });
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

  cookieStore.set(MFA_COOKIE_NAME, signMfaCookie(session.user.id), mfaCookieOptions);

  return NextResponse.json({ ok: true });
}
