import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }
});

export const config = {
  matcher: ["/((?!api/auth|signin|_next/static|_next/image|favicon.ico).*)"],
};
