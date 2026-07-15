"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { convertToUsd, convertFromUsd, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { guessCategoryName } from "@/lib/auto-categorize";

const transactionSchema = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().min(1).nullable(),
  kind: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.enum(SUPPORTED_CURRENCIES),
  merchant: z.string().max(120).optional().default(""),
  date: z.coerce.date(),
  notes: z.string().max(1000).optional().default(""),
});

const csvRowSchema = z.object({
  date: z.coerce.date(),
  account: z.string().min(1, "Account is required"),
  merchant: z.string().max(120).optional().default(""),
  amount: z.coerce.number().finite().refine((n) => n !== 0, "Amount can't be zero"),
  category: z.string().optional(),
});

const transferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.coerce.date(),
  notes: z.string().max(1000).optional().default(""),
});

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

async function guessCategoryId(
  client: typeof db | Prisma.TransactionClient,
  userId: string,
  kind: "income" | "expense",
  merchant: string
): Promise<string | null> {
  if (kind !== "expense") return null;
  const name = guessCategoryName(merchant);
  if (!name) return null;

  const matches = await client.category.findMany({
    where: { name, kind, OR: [{ userId }, { userId: null }] },
  });
  // Prefer the user's own category over the global default of the same name.
  return matches.find((c) => c.userId === userId)?.id ?? matches[0]?.id ?? null;
}

/** Maps a stored transaction to the "income"/"expense"-equivalent sign of its balance
 * effect. Income/expense map straight through; a transfer's sign depends on which leg
 * it is (transferDirection), since "transfer" alone doesn't say which way money moved. */
function balanceKindFor(t: {
  kind: string;
  transferDirection: string | null;
}): "income" | "expense" {
  if (t.kind === "income") return "income";
  if (t.kind === "expense") return "expense";
  return t.transferDirection === "in" ? "income" : "expense";
}

/** Nudges a account's stored balance by a transaction's effect (or its reverse, when undoing one). */
async function adjustAccountBalance(
  tx: Prisma.TransactionClient,
  accountId: string,
  kind: "income" | "expense",
  usdEquivalent: number,
  date: Date,
  direction: 1 | -1
) {
  const account = await tx.financialAccount.findUniqueOrThrow({ where: { id: accountId } });
  const signedUsd = (kind === "income" ? usdEquivalent : -usdEquivalent) * direction;
  const delta = await convertFromUsd(signedUsd, account.currency, date);

  await tx.financialAccount.update({
    where: { id: accountId },
    data: { currentBalance: { increment: delta } },
  });
}

export async function createTransaction(input: z.infer<typeof transactionSchema>) {
  const userId = await requireUserId();
  const data = transactionSchema.parse(input);

  const { usdEquivalent, exchangeRateToUsd } = await convertToUsd(
    data.amount,
    data.currency,
    data.date
  );

  const categoryId =
    data.categoryId ?? (await guessCategoryId(db, userId, data.kind, data.merchant));

  await db.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId,
        accountId: data.accountId,
        categoryId,
        kind: data.kind,
        originalAmount: data.amount,
        originalCurrency: data.currency,
        exchangeRateToUsd,
        usdEquivalent,
        merchant: data.merchant || null,
        date: data.date,
        notes: data.notes || null,
        source: "manual",
      },
    });

    await adjustAccountBalance(tx, data.accountId, data.kind, usdEquivalent, data.date, 1);
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/accounts");
}

export async function updateTransaction(
  id: string,
  input: z.infer<typeof transactionSchema>
) {
  const userId = await requireUserId();
  const data = transactionSchema.parse(input);

  const { usdEquivalent, exchangeRateToUsd } = await convertToUsd(
    data.amount,
    data.currency,
    data.date
  );

  await db.$transaction(async (tx) => {
    const existing = await tx.transaction.findUniqueOrThrow({ where: { id, userId } });
    if (existing.kind === "transfer") {
      throw new Error("Transfers can't be edited — delete it and create a new one instead");
    }

    // Undo the old transaction's effect on its (possibly different) account, then apply the new one.
    await adjustAccountBalance(
      tx,
      existing.accountId,
      balanceKindFor(existing),
      Number(existing.usdEquivalent),
      existing.date,
      -1
    );
    await adjustAccountBalance(tx, data.accountId, data.kind, usdEquivalent, data.date, 1);

    await tx.transaction.update({
      where: { id, userId },
      data: {
        accountId: data.accountId,
        categoryId: data.categoryId,
        kind: data.kind,
        originalAmount: data.amount,
        originalCurrency: data.currency,
        exchangeRateToUsd,
        usdEquivalent,
        merchant: data.merchant || null,
        date: data.date,
        notes: data.notes || null,
      },
    });
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/accounts");
}

export async function updateTransactionCategory(id: string, categoryId: string | null) {
  const userId = await requireUserId();

  await db.transaction.update({
    where: { id, userId },
    data: { categoryId },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function deleteTransaction(id: string) {
  const userId = await requireUserId();

  await db.$transaction(async (tx) => {
    const existing = await tx.transaction.findUniqueOrThrow({ where: { id, userId } });

    await adjustAccountBalance(
      tx,
      existing.accountId,
      balanceKindFor(existing),
      Number(existing.usdEquivalent),
      existing.date,
      -1
    );

    await tx.transaction.delete({ where: { id, userId } });
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/accounts");
}

/**
 * Bulk-imports CSV rows. Each row names its own account by `account` — matched by
 * name (case-insensitive) against the user's existing accounts, or created fresh
 * (as a "bank" account in USD) if no match exists. Amount sign determines kind
 * (negative = expense, positive = income), matching common bank/Excel exports.
 *
 * Rows whose `category` is "Transfer" are paired up with another transfer row on
 * the same date with the opposite sign and matching magnitude, and imported as a
 * single linked transfer between those two rows' accounts (see createTransfer) —
 * this is what lets a CSV that lists both legs of an internal transfer avoid
 * double-counting it as two unrelated transactions. A transfer-tagged row with no
 * matching partner falls back to a plain expense/income entry, since we don't know
 * which account the other side belongs to.
 */
export async function importTransactions(rows: z.infer<typeof csvRowSchema>[]) {
  const userId = await requireUserId();
  const parsedRows = rows.map((row) => csvRowSchema.parse(row));

  // Resolve (or create) every distinct account name up front.
  const nameByKey = new Map<string, string>();
  for (const row of parsedRows) {
    const key = row.account.trim().toLowerCase();
    if (!nameByKey.has(key)) nameByKey.set(key, row.account.trim());
  }

  const accountIdByKey = new Map<string, string>();
  const accountCurrencyById = new Map<string, string>();
  let accountsCreated = 0;

  for (const [key, name] of nameByKey) {
    let account = await db.financialAccount.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" } },
    });
    if (!account) {
      account = await db.financialAccount.create({
        data: { userId, name, type: "bank", currency: "USD" },
      });
      accountsCreated++;
    }
    accountIdByKey.set(key, account.id);
    accountCurrencyById.set(account.id, account.currency);
  }

  function resolveAccount(name: string) {
    const id = accountIdByKey.get(name.trim().toLowerCase())!;
    return { id, currency: accountCurrencyById.get(id)! };
  }

  let imported = 0;
  let categorized = 0;
  let transfersCreated = 0;

  async function createPlainTransaction(row: (typeof parsedRows)[number]) {
    const account = resolveAccount(row.account);
    const kind: "income" | "expense" = row.amount < 0 ? "expense" : "income";
    const amount = Math.abs(row.amount);

    await db.$transaction(async (tx) => {
      const { usdEquivalent, exchangeRateToUsd } = await convertToUsd(
        amount,
        account.currency,
        row.date
      );

      let categoryId: string | null = null;
      if (row.category) {
        const match = await tx.category.findFirst({
          where: {
            name: { equals: row.category, mode: "insensitive" },
            kind,
            OR: [{ userId }, { userId: null }],
          },
        });
        categoryId = match?.id ?? null;
      }
      if (!categoryId) {
        categoryId = await guessCategoryId(tx, userId, kind, row.merchant);
      }
      if (categoryId) categorized++;

      await tx.transaction.create({
        data: {
          userId,
          accountId: account.id,
          categoryId,
          kind,
          originalAmount: amount,
          originalCurrency: account.currency,
          exchangeRateToUsd,
          usdEquivalent,
          merchant: row.merchant || null,
          date: row.date,
          source: "csv",
        },
      });

      await adjustAccountBalance(tx, account.id, kind, usdEquivalent, row.date, 1);
    });
    imported++;
  }

  const isTransferRow = (row: (typeof parsedRows)[number]) =>
    row.category?.trim().toLowerCase() === "transfer";
  const normalRows = parsedRows.filter((r) => !isTransferRow(r));
  const transferRows = parsedRows.filter(isTransferRow);

  for (const row of normalRows) {
    await createPlainTransaction(row);
  }

  // Pair same-day, opposite-sign, equal-magnitude transfer rows.
  const byDate = new Map<string, (typeof parsedRows)[number][]>();
  for (const row of transferRows) {
    const key = row.date.toISOString().slice(0, 10);
    const list = byDate.get(key) ?? [];
    list.push(row);
    byDate.set(key, list);
  }

  for (const dayRows of byDate.values()) {
    const used = new Array(dayRows.length).fill(false);
    for (let i = 0; i < dayRows.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      const row = dayRows[i];
      const partnerIdx = dayRows.findIndex(
        (r, j) =>
          j !== i &&
          !used[j] &&
          Math.sign(r.amount) === -Math.sign(row.amount) &&
          Math.abs(r.amount) === Math.abs(row.amount)
      );

      if (partnerIdx === -1) {
        await createPlainTransaction(row);
        continue;
      }

      used[partnerIdx] = true;
      const partner = dayRows[partnerIdx];
      const outgoing = row.amount < 0 ? row : partner;
      const incoming = row.amount < 0 ? partner : row;

      await createTransfer({
        fromAccountId: resolveAccount(outgoing.account).id,
        toAccountId: resolveAccount(incoming.account).id,
        amount: Math.abs(row.amount),
        date: row.date,
        notes: "",
      });
      transfersCreated++;
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/accounts");

  return { imported, categorized, transfersCreated, accountsCreated };
}

/**
 * Moves money between two of the user's own accounts as a linked pair of "transfer"
 * transactions — one leaving the source account, one arriving in the destination
 * account. Neither counts as income or an expense anywhere in reports/dashboards.
 */
export async function createTransfer(input: z.infer<typeof transferSchema>) {
  const userId = await requireUserId();
  const data = transferSchema.parse(input);

  if (data.fromAccountId === data.toAccountId) {
    throw new Error("Choose two different accounts");
  }

  const transferCategory = await db.category.findFirst({
    where: { name: "Transfer", kind: "transfer", OR: [{ userId }, { userId: null }] },
  });

  await db.$transaction(async (tx) => {
    const fromAccount = await tx.financialAccount.findUniqueOrThrow({
      where: { id: data.fromAccountId, userId },
    });
    const toAccount = await tx.financialAccount.findUniqueOrThrow({
      where: { id: data.toAccountId, userId },
    });

    const { usdEquivalent, exchangeRateToUsd: fromRate } = await convertToUsd(
      data.amount,
      fromAccount.currency,
      data.date
    );
    const toAmount = await convertFromUsd(usdEquivalent, toAccount.currency, data.date);
    const { exchangeRateToUsd: toRate } = await convertToUsd(
      toAmount,
      toAccount.currency,
      data.date
    );

    await tx.transaction.create({
      data: {
        userId,
        accountId: data.fromAccountId,
        categoryId: transferCategory?.id ?? null,
        kind: "transfer",
        transferDirection: "out",
        originalAmount: data.amount,
        originalCurrency: fromAccount.currency,
        exchangeRateToUsd: fromRate,
        usdEquivalent,
        merchant: `Transfer to ${toAccount.icon} ${toAccount.name}`,
        date: data.date,
        notes: data.notes || null,
        source: "manual",
      },
    });
    await adjustAccountBalance(tx, data.fromAccountId, "expense", usdEquivalent, data.date, 1);

    await tx.transaction.create({
      data: {
        userId,
        accountId: data.toAccountId,
        categoryId: transferCategory?.id ?? null,
        kind: "transfer",
        transferDirection: "in",
        originalAmount: toAmount,
        originalCurrency: toAccount.currency,
        exchangeRateToUsd: toRate,
        usdEquivalent,
        merchant: `Transfer from ${fromAccount.icon} ${fromAccount.name}`,
        date: data.date,
        notes: data.notes || null,
        source: "manual",
      },
    });
    await adjustAccountBalance(tx, data.toAccountId, "income", usdEquivalent, data.date, 1);
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/accounts");
}
