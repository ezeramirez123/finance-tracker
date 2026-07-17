import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/sidebar";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const userId = session.user.id;
  const [accounts, categories] = await Promise.all([
    db.financialAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <MobileTopBar name={session.user.name} email={session.user.email} />
      <div className="hidden md:flex">
        <Sidebar name={session.user.name} email={session.user.email} />
      </div>
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 pb-24 md:px-8 md:py-8">{children}</div>
      </main>
      <MobileBottomNav accounts={accounts} categories={categories} />
    </div>
  );
}
