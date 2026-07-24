"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export async function updateHomeCurrency(currency: string) {
  const userId = await requireUserId();
  const parsed = z.enum(SUPPORTED_CURRENCIES).parse(currency);

  await db.user.update({
    where: { id: userId },
    data: { homeCurrency: parsed },
  });

  revalidatePath("/", "layout");
}
