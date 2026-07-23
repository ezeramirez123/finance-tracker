"use client";

import * as React from "react";

import { TableRow } from "@/components/ui/table";
import { AccountDialog } from "@/components/accounts/account-dialog";

type AccountForDialog = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "bank" | "cash" | "crypto" | "savings" | "credit" | "investment";
  currency: string;
  currentBalance: number;
  includeInNetWorth: boolean;
};

export function AccountRow({
  account,
  children,
}: {
  account: AccountForDialog;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <TableRow className="cursor-pointer active:bg-muted" onClick={() => setOpen(true)}>
        {children}
      </TableRow>
      <AccountDialog account={account} trigger={null} open={open} onOpenChange={setOpen} />
    </>
  );
}
