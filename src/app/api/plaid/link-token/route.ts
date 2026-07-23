import { NextResponse } from "next/server";
import { CountryCode, Products } from "plaid";

import { auth } from "@/lib/auth";
import { plaidClient } from "@/lib/plaid";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resp = await plaidClient.linkTokenCreate({
    user: { client_user_id: session.user.id },
    client_name: "Semanal",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
    // Required for OAuth institutions (Chase, BofA, Wells Fargo, etc.) —
    // without it Link fails when a user picks one of these in production.
    // Must exactly match a URI registered in the Plaid dashboard.
    ...(process.env.PLAID_REDIRECT_URI
      ? { redirect_uri: process.env.PLAID_REDIRECT_URI }
      : {}),
  });

  return NextResponse.json({ linkToken: resp.data.link_token });
}
