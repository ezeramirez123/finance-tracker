"use client";

import { cn } from "@/lib/utils";

const ACCOUNT_ICONS = [
  "🏦", "💳", "💰", "💵", "🪙", "📈",
  "📉", "💎", "🏧", "🐷", "🧾", "💸",
  "🌐", "🚗", "🏠", "✈️", "🛒", "☕",
];

export function AccountIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {ACCOUNT_ICONS.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => onChange(icon)}
          className={cn(
            "flex size-9 items-center justify-center rounded-md border text-lg transition-colors hover:bg-accent",
            value === icon ? "border-primary bg-accent" : "border-transparent"
          )}
          aria-label={`Use icon ${icon}`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
