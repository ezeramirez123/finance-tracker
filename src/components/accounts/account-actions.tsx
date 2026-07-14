"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteAccount, toggleIncludeInNetWorth } from "@/lib/actions/accounts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountDialog } from "@/components/accounts/account-dialog";

type AccountForActions = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "bank" | "cash" | "crypto" | "savings" | "credit" | "investment";
  currency: string;
  currentBalance: number;
  includeInNetWorth: boolean;
};

export function IncludeInNetWorthToggle({ account }: { account: AccountForActions }) {
  const [checked, setChecked] = React.useState(account.includeInNetWorth);
  const [pending, startTransition] = React.useTransition();

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Switch
        checked={checked}
        disabled={pending}
        onCheckedChange={(value) => {
          setChecked(value);
          startTransition(async () => {
            try {
              await toggleIncludeInNetWorth(account.id, value);
            } catch {
              setChecked(!value);
              toast.error("Couldn't update account");
            }
          });
        }}
      />
    </div>
  );
}

export function AccountRowActions({ account }: { account: AccountForActions }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  async function handleDelete() {
    try {
      await deleteAccount(account.id);
      toast.success("Account deleted");
    } catch {
      toast.error("Couldn't delete account");
    }
    setConfirmOpen(false);
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <AccountDialog
            account={account}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
            }
          />
          {confirmOpen ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              <Trash2 className="size-4" />
              Confirm delete
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                setConfirmOpen(true);
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
