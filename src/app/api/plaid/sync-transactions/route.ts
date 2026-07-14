import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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
  for (const item of items) {
    const { syncedCount } = await syncPlaidTransactions(item.id);
    total += syncedCount;
  }

  return NextResponse.json({ ok: true, synced: total });
}
