"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { deletePasskey } from "@/lib/actions/mfa";
import { Button } from "@/components/ui/button";

export function PasskeyList({
  passkeys,
}: {
  passkeys: { id: string; name: string | null; createdAt: Date }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function onDelete(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await deletePasskey(id);
        toast.success("Passkey removed");
        router.refresh();
      } catch {
        toast.error("Couldn't remove passkey");
      } finally {
        setPendingId(null);
      }
    });
  }

  if (passkeys.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No passkeys registered yet.</p>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col divide-y rounded-md border">
      {passkeys.map((p) => (
        <div key={p.id} className="flex items-center justify-between px-3 py-2.5">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{p.name ?? "Passkey"}</span>
            <span className="text-xs text-muted-foreground">
              Added {p.createdAt.toLocaleDateString()}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(p.id)}
            disabled={isPending && pendingId === p.id}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
