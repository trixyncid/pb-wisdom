"use client";

import { LogIn } from "lucide-react";
import { useUiStore } from "@/lib/store";

export function JadwalRsvpGate() {
  const openAuth = useUiStore((s) => s.openAuth);
  return (
    <button
      type="button"
      onClick={() => openAuth("/jadwal")}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cream text-sm font-bold text-navy transition hover:bg-sand"
    >
      <LogIn className="size-4" /> Masuk untuk RSVP
    </button>
  );
}
