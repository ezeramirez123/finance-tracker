import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateRegistrationOptions } from "@simplewebauthn/server";
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

  const existing = await db.passkey.findMany({ where: { userId: session.user.id } });

  const options = await generateRegistrationOptions({
    rpName: "Semanal",
    rpID: rpIdFromRequest(request),
    userName: session.user.email ?? session.user.id,
    userDisplayName: session.user.name ?? session.user.email ?? "User",
    attestationType: "none",
    excludeCredentials: existing.map((p) => ({
      id: p.credentialId,
      transports: p.transports
        ? (p.transports.split(",") as AuthenticatorTransportFuture[])
        : undefined,
    })),
    authenticatorSelection: {
      // Required (not "preferred") so the credential is discoverable — needed for
      // passwordless sign-in, where the passkey itself must identify the user.
      residentKey: "required",
      userVerification: "required",
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(WEBAUTHN_CHALLENGE_COOKIE, options.challenge, challengeCookieOptions);

  return NextResponse.json(options);
}
