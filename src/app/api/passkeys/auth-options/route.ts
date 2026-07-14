import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  WEBAUTHN_CHALLENGE_COOKIE,
  challengeCookieOptions,
  rpIdFromRequest,
} from "@/lib/webauthn";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const passkeys = await db.passkey.findMany({ where: { userId: session.user.id } });
  if (passkeys.length === 0) {
    return NextResponse.json({ error: "No passkeys registered" }, { status: 400 });
  }

  const options = await generateAuthenticationOptions({
    rpID: rpIdFromRequest(request),
    allowCredentials: passkeys.map((p) => ({
      id: p.credentialId,
      transports: p.transports
        ? (p.transports.split(",") as AuthenticatorTransportFuture[])
        : undefined,
    })),
    userVerification: "preferred",
  });

  const cookieStore = await cookies();
  cookieStore.set(WEBAUTHN_CHALLENGE_COOKIE, options.challenge, challengeCookieOptions);

  return NextResponse.json(options);
}
