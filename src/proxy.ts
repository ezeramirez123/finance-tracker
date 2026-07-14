import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MFA_COOKIE_NAME, verifyMfaCookie } from "@/lib/mfa";

export default auth(async (req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  const userId = req.auth.user.id;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, passkeys: { select: { id: true }, take: 1 } },
  });

  const mfaRequired = user?.mfaEnabled || (user?.passkeys.length ?? 0) > 0;

  if (mfaRequired) {
    const cookieValue = req.cookies.get(MFA_COOKIE_NAME)?.value;
    const verified = cookieValue ? verifyMfaCookie(cookieValue, userId) : false;
    if (!verified) {
      return NextResponse.redirect(new URL("/mfa/verify", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|api/passkeys|signin|mfa|_next/static|_next/image|favicon.ico).*)",
  ],
};
