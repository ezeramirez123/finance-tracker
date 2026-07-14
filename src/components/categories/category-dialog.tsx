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
import { ColorPicker } from "@/components/color-picker";

const DEFAULT_COLOR = "#f59e0b";

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
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  category?: {
    id: string;
    name: string;
    kind: "income" | "expense";
    color: string;
  };
  defaultKind?: "income" | "expense";
  /** Pass `null` to render no trigger at all — useful when open state is fully controlled externally. */
  trigger?: React.ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChangeProp ?? setInternalOpen;
  const isEdit = !!category;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: category ?? {
      name: "",
      kind: defaultKind ?? "expense",
      color: DEFAULT_COLOR,
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
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? <Button>Add category</Button>}
        </DialogTrigger>
      )}
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
            <ColorPicker
              value={form.watch("color")}
              onChange={(color) => form.setValue("color", color)}
            />
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
