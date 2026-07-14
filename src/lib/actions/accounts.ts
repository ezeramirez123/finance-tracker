"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  icon: z.string().min(1).max(8).default("🏦"),
  type: z.enum(["bank", "cash", "crypto", "savings", "credit", "investment"]),
  currency: z.enum(SUPPORTED_CURRENCIES),
  currentBalance: z.coerce.number().finite(),
  includeInNetWorth: z.boolean().default(true),
});

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export async function createAccount(input: z.infer<typeof accountSchema>) {
  const userId = await requireUserId();
  const data = accountSchema.parse(input);

  await db.financialAccount.create({
    data: { ...data, userId },
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function updateAccount(
  id: string,
  input: z.infer<typeof accountSchema>
) {
  const userId = await requireUserId();
  const data = accountSchema.parse(input);

  await db.financialAccount.update({
    where: { id, userId },
    data,
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function deleteAccount(id: string) {
  const userId = await requireUserId();

  await db.financialAccount.delete({
    where: { id, userId },
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function toggleIncludeInNetWorth(id: string, includeInNetWorth: boolean) {
  const userId = await requireUserId();

  await db.financialAccount.update({
    where: { id, userId },
    data: { includeInNetWorth },
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}
