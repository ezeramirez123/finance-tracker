"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SyncTransactionsButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/plaid/sync-transactions", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      const data: {
        synced: number;
        failed: { institutionName: string | null; error: string; removed: boolean }[];
      } = await res.json();

      if (data.failed.length === 0) {
        toast.success(`Synced ${data.synced} transaction${data.synced === 1 ? "" : "s"}`);
      } else {
        for (const f of data.failed) {
          const name = f.institutionName ?? "A connected bank";
          toast.error(
            f.removed
              ? `${name} was connected under the wrong Plaid environment and has been disconnected — reconnect it to fix.`
              : `${name} failed to sync: ${f.error}`
          );
        }
        if (data.synced > 0) {
          toast.success(`Synced ${data.synced} transaction${data.synced === 1 ? "" : "s"} from the rest`);
        }
      }
      router.refresh();
    } catch {
      toast.error("Couldn't sync transactions");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleSync} disabled={syncing} className="px-2 sm:px-4">
      <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">{syncing ? "Syncing..." : "Sync transactions"}</span>
    </Button>
  );
}
