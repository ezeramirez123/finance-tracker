import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlaidErrorDetails } from "@/lib/plaid";
import { syncPlaidTransactions } from "@/lib/plaid-sync";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const items = await db.plaidItem.findMany({
    where: { userId: session.user.id },
  });

  let total = 0;
  const failed: { institutionName: string | null; error: string; removed: boolean }[] = [];

  for (const item of items) {
    try {
      const { syncedCount } = await syncPlaidTransactions(item.id);
      total += syncedCount;
    } catch (err) {
      const plaidError = getPlaidErrorDetails(err);
      console.error(`Plaid sync failed for item ${item.id} (${item.institutionName}):`, plaidError ?? err);

      // A token issued under a different Plaid environment (e.g. left over
      // from Sandbox testing, now running against production credentials)
      // can never succeed — retrying won't fix it, so drop the dead item
      // instead of letting it block every future sync for every other item.
      const isWrongEnvironment = plaidError?.error_code === "INVALID_ACCESS_TOKEN";
      if (isWrongEnvironment) {
        await db.financialAccount.deleteMany({ where: { plaidItemId: item.id } });
        await db.plaidItem.delete({ where: { id: item.id } });
      }

      failed.push({
        institutionName: item.institutionName,
        error: plaidError?.error_message ?? "Sync failed",
        removed: isWrongEnvironment,
      });
    }
  }

  return NextResponse.json({ ok: true, synced: total, failed });
}
