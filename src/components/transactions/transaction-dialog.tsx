"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus } from "lucide-react";

import { createTransaction, updateTransaction } from "@/lib/actions/transactions";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Account = { id: string; name: string; icon: string; currency: string };
// Accepts the full app-wide category list (which can include the "transfer" kind)
// for type compatibility with callers — the form itself only ever filters to
// "income"/"expense", so a transfer category is never actually selectable here.
type Category = { id: string; name: string; kind: "income" | "expense" | "transfer"; color: string };

const formSchema = z.object({
  accountId: z.string().min(1, "Choose an account"),
  categoryId: z.string().nullable(),
  kind: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.enum(SUPPORTED_CURRENCIES),
  merchant: z.string().optional(),
  date: z.string().min(1),
  notes: z.string().optional(),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

export function TransactionDialog({
  accounts,
  categories,
  transaction,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  accounts: Account[];
  categories: Category[];
  transaction?: {
    id: string;
    accountId: string;
    categoryId: string | null;
    kind: "income" | "expense";
    originalAmount: number;
    originalCurrency: string;
    merchant: string | null;
    date: Date;
    notes: string | null;
  };
  /** Pass `null` to render no trigger at all — useful when open state is fully controlled externally. */
  trigger?: React.ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChangeProp ?? setInternalOpen;
  const isEdit = !!transaction;

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: transaction
      ? {
          accountId: transaction.accountId,
          categoryId: transaction.categoryId,
          kind: transaction.kind,
          amount: transaction.originalAmount,
          currency: transaction.originalCurrency as FormValues["currency"],
          merchant: transaction.merchant ?? "",
          date: format(transaction.date, "yyyy-MM-dd"),
          notes: transaction.notes ?? "",
        }
      : {
          accountId: accounts[0]?.id ?? "",
          categoryId: null,
          kind: "expense",
          amount: 0,
          currency: "USD",
          merchant: "",
          date: format(new Date(), "yyyy-MM-dd"),
          notes: "",
        },
  });

  const kind = form.watch("kind");
  const filteredCategories = categories.filter((c) => c.kind === kind);

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        ...values,
        merchant: values.merchant ?? "",
        notes: values.notes ?? "",
        date: new Date(values.date),
      };
      if (isEdit) {
        await updateTransaction(transaction.id, payload);
        toast.success("Transaction updated");
      } else {
        await createTransaction(payload);
        toast.success("Transaction added");
        form.reset({
          accountId: values.accountId,
          categoryId: null,
          kind: values.kind,
          amount: 0,
          currency: values.currency,
          merchant: "",
          date: format(new Date(), "yyyy-MM-dd"),
          notes: "",
        });
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
          {trigger ?? (
            <Button className="px-2 sm:px-4">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add transaction</span>
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit transaction" : "Add transaction"}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={kind === "expense" ? "default" : "outline"}
              onClick={() => {
                form.setValue("kind", "expense");
                form.setValue("categoryId", null);
              }}
            >
              Expense
            </Button>
            <Button
              type="button"
              variant={kind === "income" ? "default" : "outline"}
              onClick={() => {
                form.setValue("kind", "income");
                form.setValue("categoryId", null);
              }}
            >
              Income
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount</Label>
              <CurrencyInput
                id="amount"
                value={Number(form.watch("amount"))}
                currency={form.watch("currency")}
                onChange={(v) => form.setValue("amount", v)}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <Select
                value={form.watch("currency")}
                onValueChange={(v) =>
                  form.setValue("currency", v as FormValues["currency"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label>Account</Label>
              <Select
                value={form.watch("accountId")}
                onValueChange={(v) => form.setValue("accountId", v)}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue
                    placeholder="Select account"
                    className="block min-w-0 flex-1 truncate text-left"
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="truncate">
                        {a.icon} {a.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label>Category</Label>
              <Select
                value={form.watch("categoryId") ?? undefined}
                onValueChange={(v) => form.setValue("categoryId", v)}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue
                    placeholder="Select category"
                    className="block min-w-0 flex-1 truncate text-left"
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex min-w-0 items-center gap-2 truncate">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="merchant">Merchant</Label>
              <Input id="merchant" placeholder="e.g. Trader Joe's" {...form.register("merchant")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...form.register("date")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} {...form.register("notes")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "Save changes" : "Add transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
