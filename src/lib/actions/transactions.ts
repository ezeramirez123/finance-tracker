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

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

async function guessCategoryId(
  userId: string,
  kind: "income" | "expense",
  merchant: string
): Promise<string | null> {
  if (kind !== "expense") return null;
  const name = guessCategoryName(merchant);
  if (!name) return null;

  const matches = await db.category.findMany({
    where: { name, kind, OR: [{ userId }, { userId: null }] },
  });
  // Prefer the user's own category over the global default of the same name.
  return matches.find((c) => c.userId === userId)?.id ?? matches[0]?.id ?? null;
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
    data.categoryId ?? (await guessCategoryId(userId, data.kind, data.merchant));

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

    // Undo the old transaction's effect on its (possibly different) account, then apply the new one.
    await adjustAccountBalance(
      tx,
      existing.accountId,
      existing.kind,
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

export async function deleteTransaction(id: string) {
  const userId = await requireUserId();

  await db.$transaction(async (tx) => {
    const existing = await tx.transaction.findUniqueOrThrow({ where: { id, userId } });

    await adjustAccountBalance(
      tx,
      existing.accountId,
      existing.kind,
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
