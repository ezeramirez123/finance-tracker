"use client";

import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";

export function UserMenu({
  name,
  email,
  collapsed,
  fullWidth = true,
}: {
  name?: string | null;
  email?: string | null;
  collapsed?: boolean;
  /** Set false when the trigger sits in a flex row that should size it to content
   * (e.g. the mobile top bar) instead of stretching to fill its container. */
  fullWidth?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-accent/50",
          fullWidth && "w-full",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {(name ?? email ?? "?").charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name ?? "Account"}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/mfa/manage">
            <ShieldCheck className="size-4" />
            Two-factor authentication
          </Link>
        </DropdownMenuItem>
        <form action={signOutAction}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut className="size-4" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
