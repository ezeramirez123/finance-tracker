"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { toast } from "sonner";
import { Fingerprint } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PasskeySigninButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const optionsRes = await fetch("/api/passkeys/signin-options", { method: "POST" });
      const options = await optionsRes.json();
      if (!optionsRes.ok) throw new Error(options.error ?? "Couldn't start sign-in");

      const assertion = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch("/api/passkeys/signin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok || data.error) throw new Error(data.error ?? "Sign-in failed");

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (!(err instanceof Error && err.name === "NotAllowedError")) {
        toast.error(err instanceof Error ? err.message : "Couldn't sign in with passkey");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant="outline"
      size="lg"
      className={className}
    >
      <Fingerprint className="size-4" />
      {loading ? "Signing in..." : "Sign in with passkey"}
    </Button>
  );
}
