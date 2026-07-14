import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyMfaChallenge } from "@/lib/actions/mfa";
import { MfaCodeForm } from "@/components/mfa/mfa-code-form";
import { PasskeyVerifyButton } from "@/components/mfa/passkey-verify-button";

export default async function MfaVerifyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: { passkeys: { select: { id: true } } },
  });

  const hasPasskeys = user.passkeys.length > 0;
  if (!user.mfaEnabled && !hasPasskeys) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Two-factor verification
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {hasPasskeys
            ? "Verify with your passkey."
            : "Enter the 6-digit code from your authenticator app."}
        </p>
      </div>

      {hasPasskeys && <PasskeyVerifyButton />}

      {hasPasskeys && user.mfaEnabled && (
        <p className="text-xs text-muted-foreground">or use your authenticator app code</p>
      )}

      {user.mfaEnabled && (
        <MfaCodeForm
          action={verifyMfaChallenge}
          submitLabel="Verify"
          pendingLabel="Verifying..."
        />
      )}
    </div>
  );
}
