"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { createAccount, updateAccount } from "@/lib/actions/accounts";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import { IconPicker } from "@/components/icon-picker";
import { ColorPicker } from "@/components/color-picker";

const ACCOUNT_TYPES = [
  "bank",
  "cash",
  "crypto",
  "savings",
  "credit",
  "investment",
] as const;

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  icon: z.string().min(1).max(8),
  color: z.string().min(1),
  type: z.enum(ACCOUNT_TYPES),
  currency: z.enum(SUPPORTED_CURRENCIES),
  currentBalance: z.coerce.number().finite(),
  includeInNetWorth: z.boolean(),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

export function AccountDialog({
  account,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  account?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: (typeof ACCOUNT_TYPES)[number];
    currency: string;
    currentBalance: number;
    includeInNetWorth: boolean;
  };
  /** Pass `null` to render no trigger at all — useful when open state is fully controlled externally. */
  trigger?: React.ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChangeProp ?? setInternalOpen;
  const isEdit = !!account;

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: account
      ? {
          name: account.name,
          icon: account.icon,
          color: account.color,
          type: account.type,
          currency: account.currency as FormValues["currency"],
          currentBalance: account.currentBalance,
          includeInNetWorth: account.includeInNetWorth,
        }
      : {
          name: "",
          icon: "🏦",
          color: "#3b82f6",
          type: "bank",
          currency: "USD",
          currentBalance: 0,
          includeInNetWorth: true,
        },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit) {
        await updateAccount(account.id, values);
        toast.success("Account updated");
      } else {
        await createAccount(values);
        toast.success("Account created");
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
          {trigger ?? (
            <Button className="px-2 sm:px-4">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add account</span>
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit account" : "Add account"}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Bank of America"
              autoFocus
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Icon</Label>
              <IconPicker
                value={form.watch("icon")}
                onChange={(icon) => form.setValue("icon", icon)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Color</Label>
              <ColorPicker
                value={form.watch("color")}
                onChange={(color) => form.setValue("color", color)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(v) => form.setValue("type", v as FormValues["type"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentBalance">Current balance</Label>
            <CurrencyInput
              id="currentBalance"
              value={Number(form.watch("currentBalance"))}
              currency={form.watch("currency")}
              onChange={(v) => form.setValue("currentBalance", v)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Include in net worth</p>
              <p className="text-xs text-muted-foreground">
                Counts toward your total balance
              </p>
            </div>
            <Switch
              checked={form.watch("includeInNetWorth")}
              onCheckedChange={(v) => form.setValue("includeInNetWorth", v)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "Save changes" : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
