"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RegisterPasskeyButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const optionsRes = await fetch("/api/passkeys/register-options", { method: "POST" });
      const options = await optionsRes.json();
      if (!optionsRes.ok) throw new Error(options.error ?? "Couldn't start registration");

      const attestation = await startRegistration({ optionsJSON: options });

      const name =
        window.prompt('Name this passkey (e.g. "MacBook Touch ID")', "Passkey") || "Passkey";

      const verifyRes = await fetch("/api/passkeys/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: attestation, name }),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok || data.error) throw new Error(data.error ?? "Verification failed");

      toast.success("Passkey added");
      router.refresh();
    } catch (err) {
      if (!(err instanceof Error && err.name === "NotAllowedError")) {
        toast.error(err instanceof Error ? err.message : "Couldn't add passkey");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      <KeyRound className="size-4" />
      {loading ? "Adding..." : "Add a passkey"}
    </Button>
  );
}
