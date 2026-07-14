import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyRegistrationResponse } from "@simplewebauthn/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { WEBAUTHN_CHALLENGE_COOKIE, originFromRequest, rpIdFromRequest } from "@/lib/webauthn";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(WEBAUTHN_CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) {
    return NextResponse.json({ error: "Registration expired, try again" }, { status: 400 });
  }

  const { response, name } = await request.json();

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: originFromRequest(request),
      expectedRPID: rpIdFromRequest(request),
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  } finally {
    cookieStore.delete(WEBAUTHN_CHALLENGE_COOKIE);
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Could not verify passkey" }, { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  await db.passkey.create({
    data: {
      userId: session.user.id,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports?.join(",") ?? null,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      name: typeof name === "string" && name.trim() ? name.trim() : "Passkey",
    },
  });

  return NextResponse.json({ ok: true });
}
