"use client";

import { useUiStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function JadwalRsvpGate() {
  const openAuth = useUiStore((s) => s.openAuth);
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#e8f3fb] px-3 py-3">
      <p className="text-xs font-medium text-slate-600">
        Login member untuk RSVP latihan
      </p>
      <Button size="sm" onClick={() => openAuth("/jadwal")}>
        Login
      </Button>
    </div>
  );
}
