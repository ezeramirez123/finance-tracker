"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

import { updateTransactionCategory } from "@/lib/actions/transactions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Category = { id: string; name: string; color: string; kind: "income" | "expense" };

export function CategoryCombobox({
  transactionId,
  categoryId,
  categories,
  kind,
}: {
  transactionId: string;
  categoryId: string | null;
  categories: Category[];
  kind: "income" | "expense";
}) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(categoryId);
  const [pending, startTransition] = React.useTransition();

  const options = categories.filter((c) => c.kind === kind);
  const current = options.find((c) => c.id === selected);

  function handleSelect(nextId: string | null) {
    const previous = selected;
    setSelected(nextId);
    setOpen(false);
    startTransition(async () => {
      try {
        await updateTransactionCategory(transactionId, nextId);
      } catch {
        setSelected(previous);
        toast.error("Couldn't update category");
      }
    });
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            role="combobox"
            aria-expanded={open}
            disabled={pending}
            className="h-auto w-40 justify-between gap-1.5 px-2 py-1 font-normal"
          >
            {current ? (
              <Badge
                variant="secondary"
                className="min-w-0 max-w-full"
                style={{ backgroundColor: `${current.color}20`, color: current.color }}
              >
                <span className="truncate">{current.name}</span>
              </Badge>
            ) : (
              <span className="min-w-0 truncate text-muted-foreground">Uncategorized</span>
            )}
            <ChevronsUpDown className="size-3 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              <CommandGroup>
                <CommandItem value="Uncategorized" onSelect={() => handleSelect(null)}>
                  <Check className={cn("size-4", selected !== null && "opacity-0")} />
                  Uncategorized
                </CommandItem>
                {options.map((c) => (
                  <CommandItem key={c.id} value={c.name} onSelect={() => handleSelect(c.id)}>
                    <Check className={cn("size-4", selected !== c.id && "opacity-0")} />
                    <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
