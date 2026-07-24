"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { plaidClient } from "@/lib/plaid";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  icon: z.string().min(1).max(8).default("🏦"),
  color: z.string().min(1).default("#3b82f6"),
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

  const last = await db.financialAccount.findFirst({
    where: { userId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await db.financialAccount.create({
    data: { ...data, userId, sortOrder: (last?.sortOrder ?? -1) + 1 },
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

  const account = await db.financialAccount.findUnique({
    where: { id, userId },
    select: { plaidItemId: true },
  });

  await db.financialAccount.delete({
    where: { id, userId },
  });

  // If this was the last account under its Plaid item, revoke access with
  // Plaid too — otherwise the Item (and its production billing) lives on
  // indefinitely with no local trace a user ever "disconnected" it.
  if (account?.plaidItemId) {
    const remaining = await db.financialAccount.count({
      where: { plaidItemId: account.plaidItemId },
    });
    if (remaining === 0) {
      const plaidItem = await db.plaidItem.findUnique({
        where: { id: account.plaidItemId },
      });
      if (plaidItem) {
        try {
          await plaidClient.itemRemove({ access_token: plaidItem.accessToken });
        } catch {
          // Item may already be invalid/revoked on Plaid's side — still
          // clean up our local record so it doesn't linger either.
        }
        await db.plaidItem.delete({ where: { id: plaidItem.id } });
      }
    }
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

/** Swaps an account's position with its neighbor in display order. */
export async function moveAccount(id: string, direction: "up" | "down") {
  const userId = await requireUserId();

  const accounts = await db.financialAccount.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });

  const index = accounts.findIndex((a) => a.id === id);
  if (index === -1) return;

  const neighborIndex = direction === "up" ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= accounts.length) return;

  const current = accounts[index];
  const neighbor = accounts[neighborIndex];

  await db.$transaction([
    db.financialAccount.update({
      where: { id: current.id, userId },
      data: { sortOrder: neighbor.sortOrder },
    }),
    db.financialAccount.update({
      where: { id: neighbor.id, userId },
      data: { sortOrder: current.sortOrder },
    }),
  ]);

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
