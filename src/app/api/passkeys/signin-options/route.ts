import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

import {
  WEBAUTHN_CHALLENGE_COOKIE,
  challengeCookieOptions,
  rpIdFromRequest,
} from "@/lib/webauthn";

/** No session required — this IS the sign-in. The passkey itself (a discoverable
 * credential) identifies the user, so we don't restrict to a known allow-list. */
export async function POST(request: Request) {
  const options = await generateAuthenticationOptions({
    rpID: rpIdFromRequest(request),
    userVerification: "required",
  });

  const cookieStore = await cookies();
  cookieStore.set(WEBAUTHN_CHALLENGE_COOKIE, options.challenge, challengeCookieOptions);

  return NextResponse.json(options);
}
