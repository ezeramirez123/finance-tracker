"use client";

import { useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { moveAccount } from "@/lib/actions/accounts";
import { cn } from "@/lib/utils";

export function AccountReorderButtons({
  accountId,
  isFirst,
  isLast,
}: {
  accountId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      try {
        await moveAccount(accountId, direction);
      } catch {
        toast.error("Couldn't reorder accounts");
      }
    });
  }

  return (
    <div
      className="flex shrink-0 flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Move up"
        disabled={isFirst || pending}
        onClick={() => move("up")}
        className={cn(
          "flex size-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          (isFirst || pending) && "pointer-events-none opacity-30"
        )}
      >
        <ChevronUp className="size-3" />
      </button>
      <button
        type="button"
        aria-label="Move down"
        disabled={isLast || pending}
        onClick={() => move("down")}
        className={cn(
          "flex size-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          (isLast || pending) && "pointer-events-none opacity-30"
        )}
      >
        <ChevronDown className="size-3" />
      </button>
    </div>
  );
}
