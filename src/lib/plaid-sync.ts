import type { Transaction as PlaidTransaction } from "plaid";

import { db } from "@/lib/db";
import { plaidClient } from "@/lib/plaid";
import { convertToUsd, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { guessCategoryName, guessIncomeCategoryName } from "@/lib/auto-categorize";

function resolveCurrency(code: string | null | undefined): string {
  return code && (SUPPORTED_CURRENCIES as readonly string[]).includes(code)
    ? code
    : "USD";
}

/** Finds a global default category by name/kind, creating it if this is the
 * first time it's needed — lets newly-introduced categories (e.g. "Zelle")
 * work immediately without requiring a manual re-seed of the database. */
async function ensureGlobalCategory(
  name: string,
  kind: "income" | "expense" | "transfer",
  color: string
) {
  const existing = await db.category.findFirst({ where: { name, kind, userId: null } });
  if (existing) return existing;
  return db.category.create({ data: { name, kind, userId: null, color } });
}

/** Plaid reports each linked account's own side of a transfer as an
 * independent transaction — there's no built-in flag saying "this is a
 * transfer between your own accounts", only signal to infer it from:
 * Plaid's own categorization, and the transaction's name (many banks name
 * these predictably, e.g. "Online Banking Transfer"). Neither is perfect
 * alone, so a transaction only needs to match one of the two. */
function detectTransferDirection(t: PlaidTransaction): "in" | "out" | null {
  const pfcPrimary = t.personal_finance_category?.primary;
  const isPfcTransfer = pfcPrimary === "TRANSFER_IN" || pfcPrimary === "TRANSFER_OUT";
  const name = (t.merchant_name ?? t.name ?? "").toLowerCase();
  const isNameTransfer = name.includes("transfer");

  if (!isPfcTransfer && !isNameTransfer) return null;
  // Plaid's amount convention: positive = money left the account, negative = money arrived.
  return t.amount > 0 ? "out" : "in";
}

async function upsertPlaidTransaction(
  userId: string,
  accountId: string,
  t: PlaidTransaction,
  expenseCategoryIdByName: Map<string, string>,
  incomeCategoryIdByName: Map<string, string>,
  transferCategoryId: string | null,
  isNew: boolean
) {
  const currency = resolveCurrency(t.iso_currency_code);
  const amount = Math.abs(t.amount);
  const transferDirection = detectTransferDirection(t);
  const kind = transferDirection ? "transfer" : t.amount > 0 ? "expense" : "income";
  const date = new Date(t.date);
  const { usdEquivalent, exchangeRateToUsd } = await convertToUsd(amount, currency, date);
  const merchant = t.merchant_name ?? t.name ?? null;

  let guessedCategoryId: string | null = null;
  if (transferDirection) {
    guessedCategoryId = transferCategoryId;
  } else if (isNew && kind === "expense") {
    guessedCategoryId = expenseCategoryIdByName.get(guessCategoryName(merchant) ?? "") ?? null;
  } else if (isNew && kind === "income") {
    guessedCategoryId = incomeCategoryIdByName.get(guessIncomeCategoryName(merchant) ?? "") ?? null;
  }

  await db.transaction.upsert({
    where: { plaidTransactionId: t.transaction_id },
    create: {
      userId,
      accountId,
      categoryId: guessedCategoryId,
      kind,
      transferDirection,
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
      transferDirection,
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

  function buildCategoryMap(categories: { id: string; name: string; userId: string | null }[]) {
    const map = new Map<string, string>();
    for (const c of categories.filter((c) => c.userId === null)) {
      map.set(c.name, c.id);
    }
    for (const c of categories.filter((c) => c.userId === item.userId)) {
      map.set(c.name, c.id); // user's own category overrides the global default
    }
    return map;
  }

  const [expenseCategories, incomeCategories] = await Promise.all([
    db.category.findMany({
      where: { kind: "expense", OR: [{ userId: null }, { userId: item.userId }] },
    }),
    db.category.findMany({
      where: { kind: "income", OR: [{ userId: null }, { userId: item.userId }] },
    }),
  ]);
  const expenseCategoryIdByName = buildCategoryMap(expenseCategories);
  const incomeCategoryIdByName = buildCategoryMap(incomeCategories);

  if (!expenseCategoryIdByName.has("Zelle")) {
    const zelle = await ensureGlobalCategory("Zelle", "expense", "#a855f7");
    expenseCategoryIdByName.set("Zelle", zelle.id);
  }
  if (!incomeCategoryIdByName.has("Zelle")) {
    const zelle = await ensureGlobalCategory("Zelle", "income", "#a855f7");
    incomeCategoryIdByName.set("Zelle", zelle.id);
  }

  const transferCategory = await db.category.findFirst({
    where: { name: "Transfer", kind: "transfer", OR: [{ userId: null }, { userId: item.userId }] },
  });

  // One-time retroactive fix for transactions synced before transfer
  // detection existed: transactionsSync's cursor only re-reports rows that
  // changed since the last sync, so historical transfers misclassified as
  // plain income/expense would otherwise never get corrected.
  if (transferCategory) {
    const accountIds = Array.from(accountIdByPlaidId.values());
    await db.transaction.updateMany({
      where: {
        accountId: { in: accountIds },
        source: "plaid",
        kind: "expense",
        merchant: { contains: "transfer", mode: "insensitive" },
      },
      data: { kind: "transfer", transferDirection: "out", categoryId: transferCategory.id },
    });
    await db.transaction.updateMany({
      where: {
        accountId: { in: accountIds },
        source: "plaid",
        kind: "income",
        merchant: { contains: "transfer", mode: "insensitive" },
      },
      data: { kind: "transfer", transferDirection: "in", categoryId: transferCategory.id },
    });
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
      await upsertPlaidTransaction(
        item.userId,
        accountId,
        t,
        expenseCategoryIdByName,
        incomeCategoryIdByName,
        transferCategory?.id ?? null,
        true
      );
      syncedCount++;
    }

    for (const t of resp.data.modified) {
      const accountId = accountIdByPlaidId.get(t.account_id);
      if (!accountId) continue;
      await upsertPlaidTransaction(
        item.userId,
        accountId,
        t,
        expenseCategoryIdByName,
        incomeCategoryIdByName,
        transferCategory?.id ?? null,
        false
      );
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

  // Refresh balances directly from Plaid — the source of truth for connected accounts.
  const { data: accountsData } = await plaidClient.accountsGet({
    access_token: item.accessToken,
  });
  for (const plaidAccount of accountsData.accounts) {
    const accountId = accountIdByPlaidId.get(plaidAccount.account_id);
    if (!accountId || plaidAccount.balances.current == null) continue;
    await db.financialAccount.update({
      where: { id: accountId },
      data: { currentBalance: plaidAccount.balances.current },
    });
  }

  return { syncedCount };
}
