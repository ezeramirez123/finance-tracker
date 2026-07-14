"use client";

import * as React from "react";

import { CategoryDialog } from "@/components/categories/category-dialog";

type CategoryForDialog = {
  id: string;
  name: string;
  kind: "income" | "expense";
  color: string;
  icon: string;
};

export function CategoryRow({
  category,
  children,
}: {
  category: CategoryForDialog;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div
        className="flex cursor-pointer items-center justify-between py-2.5"
        onClick={() => setOpen(true)}
      >
        {children}
      </div>
      <CategoryDialog category={category} trigger={null} open={open} onOpenChange={setOpen} />
    </>
  );
}
