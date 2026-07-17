import { Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryDialog } from "@/components/categories/category-dialog";
import { CategoryActions } from "@/components/categories/category-actions";
import { CategoryRow } from "@/components/categories/category-row";

type CategoryRecord = {
  id: string;
  name: string;
  kind: "income" | "expense";
  color: string;
  userId: string | null;
};

function CategoryList({
  title,
  kind,
  categories,
}: {
  title: string;
  kind: "income" | "expense";
  categories: CategoryRecord[];
}) {
  return (
    <Card>
      <div className="flex items-center justify-between px-5">
        <h2 className="text-sm font-medium">{title}</h2>
        <CategoryDialog
          defaultKind={kind}
          trigger={
            <Button variant="outline" size="sm">
              <Plus className="size-3.5" />
              Add
            </Button>
          }
        />
      </div>
      <div className="flex flex-col divide-y px-5">
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category}>
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="truncate text-sm">{category.name}</span>
            </div>
            <CategoryActions category={category} />
          </CategoryRow>
        ))}
      </div>
    </Card>
  );
}

export default async function CategoriesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const categories = await db.category.findMany({
    where: { OR: [{ userId }, { userId: null }], kind: { not: "transfer" } },
    orderBy: { name: "asc" },
  });

  const expenseCategories = categories.filter(
    (c): c is typeof c & { kind: "expense" } => c.kind === "expense"
  );
  const incomeCategories = categories.filter(
    (c): c is typeof c & { kind: "income" } => c.kind === "income"
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Categories</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryList title="Expense categories" kind="expense" categories={expenseCategories} />
        <CategoryList title="Income categories" kind="income" categories={incomeCategories} />
      </div>
    </div>
  );
}
