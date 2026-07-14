"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MfaCodeForm({
  action,
  submitLabel,
  pendingLabel,
  onSuccess,
}: {
  action: (code: string) => Promise<{ error?: string; ok?: boolean } | undefined>;
  submitLabel: string;
  pendingLabel: string;
  onSuccess?: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await action(code);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      if (result?.ok) {
        onSuccess?.();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">6-digit code</Label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          autoFocus
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <Button type="submit" disabled={isPending || code.length !== 6}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
