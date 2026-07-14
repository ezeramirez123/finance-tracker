import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { disableMfa } from "@/lib/actions/mfa";
import { MfaCodeForm } from "@/components/mfa/mfa-code-form";
import { RegisterPasskeyButton } from "@/components/mfa/register-passkey-button";
import { PasskeyList } from "@/components/mfa/passkey-list";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function MfaManagePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: { passkeys: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Two-factor authentication</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Passkeys (Face ID, Touch ID, security keys) are phishing-resistant and
          recommended over authenticator app codes.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        <h2 className="text-sm font-medium">Passkeys</h2>
        <PasskeyList
          passkeys={user.passkeys.map((p) => ({
            id: p.id,
            name: p.name,
            createdAt: p.createdAt,
          }))}
        />
        <RegisterPasskeyButton />
      </div>

      <Separator className="max-w-sm" />

      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        <h2 className="text-sm font-medium">Authenticator app</h2>
        <p className="text-center text-xs text-muted-foreground">
          {user.mfaEnabled
            ? "Enabled as a fallback to passkeys."
            : "Not enabled."}
        </p>
        {user.mfaEnabled ? (
          <>
            <MfaCodeForm
              action={disableMfa}
              submitLabel="Disable"
              pendingLabel="Disabling..."
            />
            <p className="text-xs text-muted-foreground">
              Enter your current code to disable.
            </p>
          </>
        ) : (
          <Button variant="outline" asChild>
            <Link href="/mfa/setup">Set up authenticator app</Link>
          </Button>
        )}
      </div>

      <Button variant="ghost" asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
