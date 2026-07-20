import Link from "next/link";
import { ShieldCheck, Tags, LogOut, ChevronRight } from "lucide-react";

import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const session = await auth();
  const name = session?.user?.name;
  const email = session?.user?.email;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account and security settings.</p>
      </div>

      <Card className="flex-row items-center gap-4 px-5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-medium">
          {(name ?? email ?? "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{name ?? "Account"}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
      </Card>

      <Link href="/mfa/manage" className="cursor-pointer transition-colors hover:bg-accent">
        <Card className="flex-row items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Two-factor authentication</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Card>
      </Link>

      <Link href="/categories" className="cursor-pointer transition-colors hover:bg-accent">
        <Card className="flex-row items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Tags className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Categories</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Card>
      </Link>

      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="w-full sm:w-auto">
          <LogOut className="size-4" />
          Sign out
        </Button>
      </form>
    </div>
  );
}
