import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
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
  userId,
}: {
  title: string;
  kind: "income" | "expense";
  categories: CategoryRecord[];
  userId: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between px-5">
        <h2 className="text-sm font-medium">{title}</h2>
        <CategoryDialog defaultKind={kind} trigger={<button className="text-xs text-muted-foreground hover:text-foreground">+ Add</button>} />
      </div>
      <div className="flex flex-col divide-y px-5">
        {categories.map((category) => {
          const row = (
            <>
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="truncate text-sm">{category.name}</span>
              </div>
              {category.userId === userId && <CategoryActions category={category} />}
            </>
          );

          return category.userId === userId ? (
            <CategoryRow key={category.id} category={category}>
              {row}
            </CategoryRow>
          ) : (
            <div key={category.id} className="flex items-center justify-between py-2.5">
              {row}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default async function CategoriesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const categories = await db.category.findMany({
    where: { OR: [{ userId }, { userId: null }] },
    orderBy: { name: "asc" },
  });

  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const incomeCategories = categories.filter((c) => c.kind === "income");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Organize where your money comes from and goes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryList
          title="Expense categories"
          kind="expense"
          categories={expenseCategories}
          userId={userId}
        />
        <CategoryList
          title="Income categories"
          kind="income"
          categories={incomeCategories}
          userId={userId}
        />
      </div>
    </div>
  );
}
