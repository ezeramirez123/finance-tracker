"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeftRight } from "lucide-react";

import { createTransfer } from "@/lib/actions/transactions";
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

const formSchema = z
  .object({
    fromAccountId: z.string().min(1, "Choose an account"),
    toAccountId: z.string().min(1, "Choose an account"),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    date: z.string().min(1),
    notes: z.string().optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Choose two different accounts",
    path: ["toAccountId"],
  });

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

export function TransferDialog({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromAccountId: accounts[0]?.id ?? "",
      toAccountId: accounts[1]?.id ?? "",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  const fromAccountId = form.watch("fromAccountId");
  const fromAccount = accounts.find((a) => a.id === fromAccountId);

  async function onSubmit(values: FormValues) {
    try {
      await createTransfer({
        ...values,
        notes: values.notes ?? "",
        date: new Date(values.date),
      });
      toast.success("Transfer added");
      form.reset({
        fromAccountId: values.fromAccountId,
        toAccountId: values.toAccountId,
        amount: 0,
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="px-2 sm:px-4">
          <ArrowLeftRight className="size-4" />
          <span className="hidden sm:inline">Add transfer</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer between accounts</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label>From</Label>
              <Select
                value={form.watch("fromAccountId")}
                onValueChange={(v) => form.setValue("fromAccountId", v)}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount</Label>
              <CurrencyInput
                id="amount"
                value={Number(form.watch("amount"))}
                currency={fromAccount?.currency ?? "USD"}
                onChange={(v) => form.setValue("amount", v)}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
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
              Add transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
