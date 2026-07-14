"use client";

import { cn } from "@/lib/utils";

const DEFAULT_ICONS = [
  "🏦", "💳", "💰", "💵", "🪙", "📈",
  "📉", "💎", "🏧", "🐷", "🧾", "💸",
  "🌐", "🚗", "🏠", "✈️", "🛒", "☕",
  "🍔", "🎓", "⚕️", "🎮", "📱", "🏷️",
];

export function IconPicker({
  value,
  onChange,
  icons = DEFAULT_ICONS,
}: {
  value: string;
  onChange: (icon: string) => void;
  icons?: string[];
}) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {icons.map((icon) => (
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
