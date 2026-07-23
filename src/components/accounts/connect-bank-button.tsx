"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";

const LINK_TOKEN_STORAGE_KEY = "plaid_link_token";

export function ConnectBankButton() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  // OAuth institutions (Chase, BofA, Wells Fargo, etc.) send the browser away
  // to the bank's site and back to this same page with `oauth_state_id` in
  // the URL — Link must be resumed with the exact token issued before that
  // redirect, not a freshly-fetched one.
  const [isOAuthReturn] = useState(
    () => typeof window !== "undefined" && window.location.search.includes("oauth_state_id=")
  );
  const [linkToken, setLinkToken] = useState<string | null>(() =>
    isOAuthReturn && typeof window !== "undefined"
      ? sessionStorage.getItem(LINK_TOKEN_STORAGE_KEY)
      : null
  );

  useEffect(() => {
    if (isOAuthReturn) return;
    fetch("/api/plaid/link-token", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        sessionStorage.setItem(LINK_TOKEN_STORAGE_KEY, data.linkToken);
        setLinkToken(data.linkToken);
      })
      .catch(() => toast.error("Couldn't reach Plaid"));
  }, [isOAuthReturn]);

  const onSuccess = useCallback(
    async (publicToken: string) => {
      sessionStorage.removeItem(LINK_TOKEN_STORAGE_KEY);
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
    ...(isOAuthReturn ? { receivedRedirectUri: window.location.href } : {}),
  });

  // The user already clicked "Connect bank" before being sent to their
  // bank's OAuth page, so resume automatically once Link is ready instead
  // of waiting for a second click.
  useEffect(() => {
    if (isOAuthReturn && ready) {
      window.history.replaceState(null, "", window.location.pathname);
      open();
    }
  }, [isOAuthReturn, ready, open]);

  return (
    <Button
      variant="outline"
      onClick={() => open()}
      disabled={!ready || connecting}
      className="px-2 sm:px-4"
    >
      <Landmark className="size-4" />
      <span className="hidden sm:inline">
        {connecting ? "Connecting..." : "Connect bank"}
      </span>
    </Button>
  );
}
