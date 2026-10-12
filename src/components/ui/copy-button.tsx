"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** Small pill that copies `value` and briefly shows a check. */
export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          toast.success(`${label} disalin`);
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("Tidak bisa menyalin, salin manual ya");
        }
      }}
      className={cn("inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-bold text-navy shadow-sm transition hover:bg-sand active:scale-95", className)}
    >
      {done ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {label}
    </button>
  );
}
