"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, Receipt, Wallet, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";

const NAV_ITEMS = [
  { href: "/income", label: "Income", icon: TrendingUp },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/accounts", label: "Accounts", icon: Wallet },
] as const;

type Account = { id: string; name: string; icon: string; currency: string };
type Category = { id: string; name: string; kind: "income" | "expense" | "transfer"; color: string };

export function MobileBottomNav({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const pathname = usePathname();

  return (
    <>
      <TransactionDialog
        accounts={accounts}
        categories={categories}
        trigger={
          <button
            type="button"
            aria-label="Add transaction"
            className="fixed right-4 bottom-20 z-40 flex size-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 md:hidden"
          >
            <Plus className="size-6" />
          </button>
        }
      />
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
