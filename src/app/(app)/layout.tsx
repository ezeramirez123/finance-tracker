import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { UserMenu } from "@/components/user-menu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside className="flex w-60 shrink-0 flex-col border-r px-3 py-4">
        <div className="px-2 pb-4 text-sm font-semibold tracking-tight">
          Semanal
        </div>
        <div className="flex-1">
          <Nav />
        </div>
        <UserMenu
          name={session.user.name}
          email={session.user.email}
          image={session.user.image}
        />
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
