import type { Transaction as PlaidTransaction } from "plaid";

import { db } from "@/lib/db";
import { plaidClient } from "@/lib/plaid";
import { convertToUsd, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { guessCategoryName } from "@/lib/auto-categorize";

function resolveCurrency(code: string | null | undefined): string {
  return code && (SUPPORTED_CURRENCIES as readonly string[]).includes(code)
    ? code
    : "USD";
}

async function upsertPlaidTransaction(
  userId: string,
  accountId: string,
  t: PlaidTransaction,
  categoryIdByName: Map<string, string>,
  isNew: boolean
) {
  const currency = resolveCurrency(t.iso_currency_code);
  const amount = Math.abs(t.amount);
  const kind = t.amount > 0 ? "expense" : "income";
  const date = new Date(t.date);
  const { usdEquivalent, exchangeRateToUsd } = await convertToUsd(amount, currency, date);
  const merchant = t.merchant_name ?? t.name ?? null;

  const guessedCategoryId =
    isNew && kind === "expense"
      ? categoryIdByName.get(guessCategoryName(merchant) ?? "") ?? null
      : null;

  await db.transaction.upsert({
    where: { plaidTransactionId: t.transaction_id },
    create: {
      userId,
      accountId,
      categoryId: guessedCategoryId,
      kind,
      originalAmount: amount,
      originalCurrency: currency,
      exchangeRateToUsd,
      usdEquivalent,
      merchant,
      date,
      source: "plaid",
      plaidTransactionId: t.transaction_id,
    },
    update: {
      kind,
      originalAmount: amount,
      originalCurrency: currency,
      exchangeRateToUsd,
      usdEquivalent,
      merchant,
      date,
    },
  });
}

/** Pulls new/changed/removed transactions for a linked item using Plaid's cursor-based sync. */
export async function syncPlaidTransactions(plaidItemId: string) {
  const item = await db.plaidItem.findUniqueOrThrow({
    where: { id: plaidItemId },
    include: { accounts: true },
  });

  const accountIdByPlaidId = new Map(
    item.accounts.map((a) => [a.plaidAccountId, a.id])
  );

  const categories = await db.category.findMany({
    where: { kind: "expense", OR: [{ userId: null }, { userId: item.userId }] },
  });
  const categoryIdByName = new Map<string, string>();
  for (const c of categories.filter((c) => c.userId === null)) {
    categoryIdByName.set(c.name, c.id);
  }
  for (const c of categories.filter((c) => c.userId === item.userId)) {
    categoryIdByName.set(c.name, c.id); // user's own category overrides the global default
  }

  let cursor = item.transactionsCursor ?? undefined;
  let hasMore = true;
  let syncedCount = 0;

  while (hasMore) {
    const resp = await plaidClient.transactionsSync({
      access_token: item.accessToken,
      cursor,
    });

    for (const t of resp.data.added) {
      const accountId = accountIdByPlaidId.get(t.account_id);
      if (!accountId) continue;
      await upsertPlaidTransaction(item.userId, accountId, t, categoryIdByName, true);
      syncedCount++;
    }

    for (const t of resp.data.modified) {
      const accountId = accountIdByPlaidId.get(t.account_id);
      if (!accountId) continue;
      await upsertPlaidTransaction(item.userId, accountId, t, categoryIdByName, false);
      syncedCount++;
    }

    for (const r of resp.data.removed) {
      if (!r.transaction_id) continue;
      await db.transaction.deleteMany({
        where: { plaidTransactionId: r.transaction_id },
      });
    }

    cursor = resp.data.next_cursor;
    hasMore = resp.data.has_more;
  }

  await db.plaidItem.update({
    where: { id: plaidItemId },
    data: { transactionsCursor: cursor },
  });

  return { syncedCount };
}
