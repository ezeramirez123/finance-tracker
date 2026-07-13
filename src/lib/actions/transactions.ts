"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { convertToUsd, SUPPORTED_CURRENCIES } from "@/lib/currency";

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

export async function createTransaction(input: z.infer<typeof transactionSchema>) {
  const userId = await requireUserId();
  const data = transactionSchema.parse(input);

  const { usdEquivalent, exchangeRateToUsd } = await convertToUsd(
    data.amount,
    data.currency,
    data.date
  );

  await db.transaction.create({
    data: {
      userId,
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
      source: "manual",
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
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

  await db.transaction.update({
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

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function deleteTransaction(id: string) {
  const userId = await requireUserId();

  await db.transaction.delete({
    where: { id, userId },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}
