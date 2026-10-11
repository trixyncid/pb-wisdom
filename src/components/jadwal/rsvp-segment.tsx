"use client";

import { cn } from "@/lib/utils";

/** Segmented RSVP control shared by training and events. */
export function RsvpSegment<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string; activeClass?: string }[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label="RSVP" className="flex gap-1 rounded-full bg-cream p-1">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-10 flex-1 rounded-full text-sm font-bold transition-all duration-200 disabled:opacity-60",
              active
                ? (o.activeClass ?? "bg-navy text-white shadow-[0_6px_14px_rgba(14,44,60,0.25)]")
                : "text-navy/60 hover:bg-white hover:text-navy",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
