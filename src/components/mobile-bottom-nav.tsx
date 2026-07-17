"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, Receipt, Wallet, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";

const LEFT_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/income", label: "Income", icon: TrendingUp },
] as const;

const RIGHT_ITEMS = [
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/accounts", label: "Accounts", icon: Wallet },
] as const;

type Account = { id: string; name: string; icon: string; currency: string };
type Category = { id: string; name: string; kind: "income" | "expense" | "transfer"; color: string };

function NavLink({
  item,
  active,
}: {
  item: { href: string; label: string; icon: typeof Home };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <Icon className="size-6" />
      {item.label}
    </Link>
  );
}

export function MobileBottomNav({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      {LEFT_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(item.href)} />
      ))}

      <div className="flex flex-1 justify-center">
        <TransactionDialog
          accounts={accounts}
          categories={categories}
          trigger={
            <button
              type="button"
              aria-label="Add transaction"
              className="flex size-12 cursor-pointer items-center justify-center rounded-full border bg-secondary text-secondary-foreground shadow-lg transition-transform hover:scale-105"
            >
              <Plus className="size-6" />
            </button>
          }
        />
      </div>

      {RIGHT_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(item.href)} />
      ))}
    </nav>
  );
}
