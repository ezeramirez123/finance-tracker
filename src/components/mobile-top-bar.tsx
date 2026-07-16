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

  React.useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    function onTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      // Only start tracking swipes that begin near the left screen edge, so
      // this doesn't hijack horizontal scrolling elsewhere on the page.
      if (touch.clientX > 24) return;
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!tracking) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      if (deltaX > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        setOpen(true);
        tracking = false;
      }
    }

    function onTouchEnd() {
      tracking = false;
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-background px-4 py-3 md:hidden">
      <div className="flex items-center gap-3">
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
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          Semanal
        </Link>
      </div>
      <UserMenu
        name={name}
        email={email}
        collapsed
        fullWidth={false}
        avatarClassName="size-9 text-sm"
      />
    </header>
  );
}
