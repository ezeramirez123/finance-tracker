"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { createCategory, updateCategory } from "@/lib/actions/categories";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRESET_COLORS = [
  "#f59e0b",
  "#84cc16",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#a855f7",
  "#06b6d4",
  "#6366f1",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#6b7280",
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(40),
  kind: z.enum(["income", "expense"]),
  color: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

export function CategoryDialog({
  category,
  defaultKind,
  trigger,
}: {
  category?: { id: string; name: string; kind: "income" | "expense"; color: string };
  defaultKind?: "income" | "expense";
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = !!category;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: category ?? {
      name: "",
      kind: defaultKind ?? "expense",
      color: PRESET_COLORS[0],
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit) {
        await updateCategory(category.id, values);
        toast.success("Category updated");
      } else {
        await createCategory(values);
        toast.success("Category created");
        form.reset();
      }
      setOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Add category</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Coffee" {...form.register("name")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select
              value={form.watch("kind")}
              onValueChange={(v) => form.setValue("kind", v as FormValues["kind"])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="size-6 rounded-full ring-offset-2 ring-offset-background transition-shadow"
                  style={{
                    backgroundColor: color,
                    boxShadow:
                      form.watch("color") === color ? `0 0 0 2px ${color}` : "none",
                  }}
                  onClick={() => form.setValue("color", color)}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
