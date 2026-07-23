import { redirect } from "next/navigation";
import { Zap } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyMfaChallenge } from "@/lib/actions/mfa";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
    <div className="relative flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_60%)] px-4 py-12">
      <div className="absolute top-6 left-6 flex items-center gap-2 sm:top-8 sm:left-8">
        <div className="flex size-7 items-center justify-center rounded-md bg-[#111111] text-[#facc15]">
          <Zap className="size-4 fill-current" />
        </div>
        <span className="text-lg font-bold tracking-tight">Semanal</span>
      </div>

      <Card className="w-full max-w-sm py-8 shadow-lg">
        <CardHeader className="flex-col gap-3 px-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#111111] text-[#facc15]">
            <Zap className="size-7 fill-current" />
          </div>
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
              Two-factor verification
            </CardTitle>
            <CardDescription>
              {hasPasskeys
                ? "Verify with your passkey."
                : "Enter the 6-digit code from your authenticator app."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 px-8">
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
        </CardContent>
      </Card>
    </div>
  );
}
