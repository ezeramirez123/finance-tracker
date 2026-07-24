"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { ChevronDown, Plus, Trash2 } from "lucide-react";

import {
  createTransaction,
  updateTransaction,
  createTransfer,
  deleteTransaction,
} from "@/lib/actions/transactions";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

const formSchema = z
  .object({
    kind: z.enum(["income", "expense", "transfer"]),
    accountId: z.string().min(1, "Choose an account"),
    toAccountId: z.string().optional(),
    categoryId: z.string().nullable(),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    currency: z.enum(SUPPORTED_CURRENCIES),
    merchant: z.string().optional(),
    date: z.string().min(1),
    notes: z.string().optional(),
  })
  .refine((data) => data.kind !== "transfer" || !!data.toAccountId, {
    message: "Choose a destination account",
    path: ["toAccountId"],
  })
  .refine((data) => data.kind !== "transfer" || data.toAccountId !== data.accountId, {
    message: "Choose two different accounts",
    path: ["toAccountId"],
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
  defaultKind = "expense",
}: {
  accounts: Account[];
  categories: Category[];
  /** Which tab is selected when opening for a brand-new transaction (ignored when editing). */
  defaultKind?: "income" | "expense" | "transfer";
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
  const [notesOpen, setNotesOpen] = React.useState(!!transaction?.notes);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: transaction
      ? {
          kind: transaction.kind,
          accountId: transaction.accountId,
          toAccountId: accounts.find((a) => a.id !== transaction.accountId)?.id ?? "",
          categoryId: transaction.categoryId,
          amount: transaction.originalAmount,
          currency: transaction.originalCurrency as FormValues["currency"],
          merchant: transaction.merchant ?? "",
          date: format(transaction.date, "yyyy-MM-dd"),
          notes: transaction.notes ?? "",
        }
      : {
          kind: defaultKind,
          accountId: accounts[0]?.id ?? "",
          toAccountId: accounts[1]?.id ?? "",
          categoryId: null,
          amount: 0,
          currency: "USD",
          merchant: "",
          date: format(new Date(), "yyyy-MM-dd"),
          notes: "",
        },
  });

  const kind = form.watch("kind");
  const isTransfer = kind === "transfer";
  const filteredCategories = categories.filter((c) => c.kind === kind);
  const fromAccount = accounts.find((a) => a.id === form.watch("accountId"));

  async function onSubmit(values: FormValues) {
    try {
      if (values.kind === "transfer") {
        await createTransfer({
          fromAccountId: values.accountId,
          toAccountId: values.toAccountId!,
          amount: values.amount,
          date: new Date(values.date),
          notes: values.notes ?? "",
        });
        toast.success("Transfer added");
      } else {
        const payload = {
          ...values,
          kind: values.kind,
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
        }
      }
      if (!isEdit) {
        form.reset({
          kind: values.kind,
          accountId: values.accountId,
          toAccountId: values.toAccountId,
          categoryId: null,
          amount: 0,
          currency: values.currency,
          merchant: "",
          date: format(new Date(), "yyyy-MM-dd"),
          notes: "",
        });
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleDelete() {
    if (!transaction) return;
    setDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      toast.success("Transaction deleted");
      setOpen(false);
    } catch {
      toast.error("Couldn't delete transaction");
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmDelete(false);
        setOpen(next);
      }}
    >
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
      <DialogContent
        className={cn(
          "border-t-4",
          kind === "income" && "border-t-emerald-500",
          kind === "expense" && "border-t-rose-500",
          kind === "transfer" && "border-t-blue-500"
        )}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit transaction" : "Add transaction"}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className={cn("grid gap-2", isEdit ? "grid-cols-2" : "grid-cols-3")}>
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
            {!isEdit && (
              <Button
                type="button"
                variant={kind === "transfer" ? "default" : "outline"}
                onClick={() => {
                  form.setValue("kind", "transfer");
                  form.setValue("categoryId", null);
                }}
              >
                Transfer
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount</Label>
              <CurrencyInput
                id="amount"
                value={Number(form.watch("amount"))}
                currency={isTransfer ? (fromAccount?.currency ?? "USD") : form.watch("currency")}
                onChange={(v) => form.setValue("amount", v)}
                autoFocus={!isEdit}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
            {isTransfer ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...form.register("date")} />
              </div>
            ) : (
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
            )}
          </div>

          {isTransfer ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label>From</Label>
                <Select
                  value={form.watch("accountId")}
                  onValueChange={(v) => form.setValue("accountId", v)}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder="Select account" className="min-w-0 truncate" />
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
                <Label>To</Label>
                <Select
                  value={form.watch("toAccountId")}
                  onValueChange={(v) => form.setValue("toAccountId", v)}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder="Select account" className="min-w-0 truncate" />
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
                {form.formState.errors.toAccountId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.toAccountId.message}
                  </p>
                )}
              </div>
            </div>
          ) : (
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
          )}

          {!isTransfer && (
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
          )}

          <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ChevronDown
                className={cn("size-3.5 transition-transform", notesOpen && "rotate-180")}
              />
              Notes
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-1.5">
              <Textarea id="notes" rows={2} {...form.register("notes")} />
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter className={isEdit ? "sm:justify-between" : undefined}>
            {isEdit &&
              (confirmDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  <Trash2 className="size-4" />
                  Confirm delete
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              ))}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "Save changes" : isTransfer ? "Add transfer" : "Add transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
