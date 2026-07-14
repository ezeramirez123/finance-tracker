"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteCategory } from "@/lib/actions/categories";
import { Button } from "@/components/ui/button";
import { CategoryDialog } from "@/components/categories/category-dialog";

export function CategoryActions({
  category,
}: {
  category: { id: string; name: string; kind: "income" | "expense"; color: string; icon: string };
}) {
  const [confirming, setConfirming] = React.useState(false);

  async function handleDelete() {
    try {
      await deleteCategory(category.id);
      toast.success("Category deleted");
    } catch {
      toast.error("Couldn't delete category");
    }
    setConfirming(false);
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <CategoryDialog
        category={category}
        trigger={
          <Button variant="ghost" size="icon">
            <Pencil className="size-3.5" />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon"
        className={confirming ? "text-destructive" : undefined}
        onClick={confirming ? handleDelete : () => setConfirming(true)}
        onBlur={() => setConfirming(false)}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
