import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { auth } from "@/lib/auth";
import { getMfaSetupData, confirmMfaSetup } from "@/lib/actions/mfa";
import { MfaCodeForm } from "@/components/mfa/mfa-code-form";

export default async function MfaSetupPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const data = await getMfaSetupData();
  if (data.alreadyEnabled) {
    redirect("/dashboard");
  }

  const qrDataUrl = await QRCode.toDataURL(data.otpauthUrl);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Set up MFA</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Scan this QR code with an authenticator app (Google Authenticator, Authy,
          1Password), then enter the 6-digit code it shows.
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrDataUrl} alt="MFA QR code" className="size-56 rounded-lg border" />
      <MfaCodeForm
        action={confirmMfaSetup}
        submitLabel="Enable MFA"
        pendingLabel="Verifying..."
      />
    </div>
  );
}
