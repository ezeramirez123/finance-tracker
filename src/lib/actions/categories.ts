"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(40),
  kind: z.enum(["income", "expense"]),
  color: z.string().min(1),
});

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export async function createCategory(input: z.infer<typeof categorySchema>) {
  const userId = await requireUserId();
  const data = categorySchema.parse(input);

  await db.category.create({
    data: { ...data, userId },
  });

  revalidatePath("/categories");
}

async function requireEditableCategory(id: string, userId: string) {
  const category = await db.category.findUniqueOrThrow({ where: { id } });
  if (category.userId !== null && category.userId !== userId) {
    throw new Error("Not authorized to edit this category");
  }
  return category;
}

export async function updateCategory(
  id: string,
  input: z.infer<typeof categorySchema>
) {
  const userId = await requireUserId();
  const data = categorySchema.parse(input);
  await requireEditableCategory(id, userId);

  await db.category.update({ where: { id }, data });

  revalidatePath("/categories");
}

export async function deleteCategory(id: string) {
  const userId = await requireUserId();
  await requireEditableCategory(id, userId);

  await db.category.delete({ where: { id } });

  revalidatePath("/categories");
}
