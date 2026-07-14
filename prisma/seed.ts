import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const EXPENSE_CATEGORIES = [
  { name: "Food", color: "#f59e0b" },
  { name: "Groceries", color: "#84cc16" },
  { name: "Rent", color: "#ef4444" },
  { name: "Transportation", color: "#3b82f6" },
  { name: "Shopping", color: "#ec4899" },
  { name: "Entertainment", color: "#a855f7" },
  { name: "Travel", color: "#06b6d4" },
  { name: "Education", color: "#6366f1" },
  { name: "Healthcare", color: "#14b8a6" },
  { name: "Utilities", color: "#f97316" },
  { name: "Other", color: "#6b7280" },
];

const INCOME_CATEGORIES = [
  { name: "Salary", color: "#22c55e" },
  { name: "Internship", color: "#10b981" },
  { name: "Freelance", color: "#0ea5e9" },
  { name: "Gift", color: "#d946ef" },
  { name: "Refund", color: "#eab308" },
  { name: "Investment", color: "#8b5cf6" },
  { name: "Other", color: "#6b7280" },
];

const TRANSFER_CATEGORIES = [{ name: "Transfer", color: "#64748b" }];

async function seedDefault(
  category: { name: string; color: string },
  kind: "expense" | "income" | "transfer"
) {
  const existing = await db.category.findFirst({
    where: { name: category.name, userId: null, kind },
  });
  if (!existing) {
    await db.category.create({ data: { ...category, kind, userId: null } });
  }
}

async function main() {
  for (const category of EXPENSE_CATEGORIES) {
    await seedDefault(category, "expense");
  }

  for (const category of INCOME_CATEGORIES) {
    await seedDefault(category, "income");
  }

  for (const category of TRANSFER_CATEGORIES) {
    await seedDefault(category, "transfer");
  }

  console.log("Seeded default categories.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
