"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Nav } from "@/components/nav";
import { UserMenu } from "@/components/user-menu";

export function MobileTopBar({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background px-4 py-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 gap-0 px-3 py-4">
          <SheetHeader className="px-2 pb-4">
            <SheetTitle className="text-left text-xl font-bold tracking-tight">
              Semanal
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <Nav onNavigate={() => setOpen(false)} />
          </div>
          <UserMenu name={name} email={email} />
        </SheetContent>
      </Sheet>
      <Link href="/dashboard" className="text-lg font-bold tracking-tight">
        Semanal
      </Link>
    </header>
  );
}
