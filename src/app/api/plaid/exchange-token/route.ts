import { NextResponse } from "next/server";
import { CountryCode } from "plaid";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlaidErrorDetails, plaidClient } from "@/lib/plaid";
import { syncPlaidTransactions } from "@/lib/plaid-sync";

function mapAccountType(
  plaidType: string,
  plaidSubtype: string | null
): "bank" | "cash" | "crypto" | "savings" | "credit" | "investment" {
  if (plaidType === "depository") {
    return plaidSubtype === "savings" ? "savings" : "bank";
  }
  if (plaidType === "credit" || plaidType === "loan") return "credit";
  if (plaidType === "investment" || plaidType === "brokerage") return "investment";
  return "bank";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { publicToken } = await request.json();
  if (!publicToken) {
    return NextResponse.json({ error: "Missing publicToken" }, { status: 400 });
  }

  try {
    const exchange = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    const [{ data: accountsData }, { data: itemData }] = await Promise.all([
      plaidClient.accountsGet({ access_token: accessToken }),
      plaidClient.itemGet({ access_token: accessToken }),
    ]);

    let institutionName: string | null = null;
    const institutionId = itemData.item.institution_id;
    if (institutionId) {
      const inst = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: [CountryCode.Us],
      });
      institutionName = inst.data.institution.name;
    }

    const plaidItem = await db.plaidItem.create({
      data: {
        userId: session.user.id,
        itemId,
        accessToken,
        institutionName,
      },
    });

    for (const account of accountsData.accounts) {
      await db.financialAccount.create({
        data: {
          userId: session.user.id,
          name: institutionName ? `${institutionName} ${account.name}` : account.name,
          type: mapAccountType(account.type, account.subtype),
          currency: account.balances.iso_currency_code ?? "USD",
          currentBalance: account.balances.current ?? 0,
          includeInNetWorth: true,
          isConnected: true,
          plaidItemId: plaidItem.id,
          plaidAccountId: account.account_id,
        },
      });
    }

    const { syncedCount } = await syncPlaidTransactions(plaidItem.id);

    return NextResponse.json({ ok: true, accounts: accountsData.accounts.length, syncedCount });
  } catch (err) {
    const plaidError = getPlaidErrorDetails(err);
    console.error("Plaid token exchange failed:", plaidError ?? err);
    return NextResponse.json(
      { error: plaidError?.error_message ?? "Couldn't finish connecting your bank" },
      { status: 502 }
    );
  }
}
