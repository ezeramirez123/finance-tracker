"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ConnectBankButton() {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetch("/api/plaid/link-token", { method: "POST" })
      .then((res) => res.json())
      .then((data) => setLinkToken(data.linkToken))
      .catch(() => toast.error("Couldn't reach Plaid"));
  }, []);

  const onSuccess = useCallback(
    async (publicToken: string) => {
      setConnecting(true);
      try {
        const res = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicToken }),
        });
        if (!res.ok) throw new Error("Exchange failed");
        toast.success("Bank connected");
        router.refresh();
      } catch {
        toast.error("Couldn't finish connecting your bank");
      } finally {
        setConnecting(false);
      }
    },
    [router]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  return (
    <Button variant="outline" onClick={() => open()} disabled={!ready || connecting}>
      <Landmark className="size-4" />
      {connecting ? "Connecting..." : "Connect bank"}
    </Button>
  );
}
