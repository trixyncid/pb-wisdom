"use client";

import { LogIn } from "lucide-react";
import { useUiStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function HomeGuestCta() {
  const openAuth = useUiStore((s) => s.openAuth);
  return (
    <Button variant="accent" onClick={() => openAuth("/")}>
      <LogIn className="size-4" />
      Masuk
    </Button>
  );
}
