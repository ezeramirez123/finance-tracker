"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Nav } from "@/components/nav";
import { UserMenu } from "@/components/user-menu";

const STORAGE_KEY = "sidebarCollapsed";

export function Sidebar({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    // Read after mount (not in a lazy initializer) so server and client render
    // the same markup on first paint; localStorage isn't available during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(STORAGE_KEY) === "true") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r py-4 transition-[width] duration-200",
        collapsed ? "w-16 px-2" : "w-60 px-3"
      )}
    >
      <div
        className={cn(
          "flex items-center pb-6",
          collapsed ? "justify-center" : "justify-between px-2"
        )}
      >
        {!collapsed && (
          <Link href="/dashboard" className="text-2xl font-bold tracking-tight">
            Semanal
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <Nav collapsed={collapsed} />
      </div>

      <UserMenu name={name} email={email} collapsed={collapsed} />
    </aside>
  );
}
