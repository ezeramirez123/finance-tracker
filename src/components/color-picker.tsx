"use client";

import { Check } from "lucide-react";

const DEFAULT_COLORS = [
  "#f59e0b",
  "#84cc16",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#a855f7",
  "#06b6d4",
  "#6366f1",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#6b7280",
];

export function ColorPicker({
  value,
  onChange,
  colors = DEFAULT_COLORS,
}: {
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => {
        const selected = value === color;
        return (
          <button
            key={color}
            type="button"
            className="flex size-7 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow"
            style={{
              backgroundColor: color,
              boxShadow: selected ? `0 0 0 2px var(--ring)` : "none",
            }}
            onClick={() => onChange(color)}
            aria-label={`Use color ${color}`}
          >
            {selected && (
              <Check className="size-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
