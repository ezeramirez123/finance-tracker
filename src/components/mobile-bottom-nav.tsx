"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Receipt,
  Wallet,
  Plus,
} from "lucide-react";

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

const KIND_OPTIONS = [
  { kind: "income", label: "Income", icon: TrendingUp, colorClass: "bg-emerald-500", x: -52, y: -84 },
  { kind: "transfer", label: "Transfer", icon: ArrowLeftRight, colorClass: "bg-blue-500", x: 52, y: -84 },
  { kind: "expense", label: "Expense", icon: TrendingDown, colorClass: "bg-rose-500", x: 0, y: -148 },
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
        "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-[color,opacity] active:opacity-50",
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogKind, setDialogKind] = useState<"income" | "expense" | "transfer" | null>(null);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        {LEFT_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <div className="relative flex flex-1 justify-center">
          <div className="pointer-events-none absolute bottom-1/2 left-1/2">
            {KIND_OPTIONS.map((opt, i) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.kind}
                  type="button"
                  aria-label={`Add ${opt.label.toLowerCase()}`}
                  onClick={() => {
                    setMenuOpen(false);
                    setDialogKind(opt.kind);
                  }}
                  className={cn(
                    "pointer-events-auto absolute top-0 left-0 flex size-12 items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 ease-out active:brightness-75",
                    opt.colorClass,
                    menuOpen ? "scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0"
                  )}
                  style={{
                    transform: menuOpen
                      ? `translate(calc(-50% + ${opt.x}px), calc(-50% + ${opt.y}px))`
                      : "translate(-50%, -50%)",
                    transitionDelay: menuOpen ? `${(2 - i) * 40}ms` : "0ms",
                  }}
                >
                  <Icon className="size-5" />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close add transaction menu" : "Add transaction"}
            onClick={() => setMenuOpen((v) => !v)}
            className="relative z-10 flex size-12 cursor-pointer items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg transition-transform hover:scale-105 active:scale-90"
          >
            <Plus
              className={cn("size-6 transition-transform duration-200", menuOpen && "rotate-45")}
            />
          </button>
        </div>

        {RIGHT_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      <TransactionDialog
        key={dialogKind ?? "closed"}
        accounts={accounts}
        categories={categories}
        trigger={null}
        open={dialogKind !== null}
        onOpenChange={(open) => !open && setDialogKind(null)}
        defaultKind={dialogKind ?? "expense"}
      />
    </>
  );
}
