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
  const openRef = React.useRef(open);

  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  React.useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    function onTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      if (openRef.current) {
        // Drawer is open: any swipe-left anywhere on it should close it.
        startX = touch.clientX;
        startY = touch.clientY;
        tracking = true;
        return;
      }
      // Drawer is closed: only track swipes starting near the left screen
      // edge, so this doesn't hijack horizontal scrolling elsewhere.
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
      if (openRef.current) {
        if (deltaX < -60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
          setOpen(false);
          tracking = false;
        }
      } else if (deltaX > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
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
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-background px-4 py-2 md:hidden">
      <div className="flex items-center gap-2.5">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Open menu">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 gap-0 px-3 py-4">
            <SheetHeader className="px-2 pb-4">
              <SheetTitle asChild className="text-left text-xl font-bold tracking-tight">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  Semanal
                </Link>
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <Nav onNavigate={() => setOpen(false)} />
            </div>
            <div onClick={() => setOpen(false)}>
              <UserMenu name={name} email={email} />
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="text-base font-bold tracking-tight">
          Semanal
        </Link>
      </div>
      <UserMenu
        name={name}
        email={email}
        collapsed
        fullWidth={false}
        avatarClassName="size-8 text-xs"
      />
    </header>
  );
}
