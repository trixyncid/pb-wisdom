"use client";

import { useUiStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function HomeGuestCta() {
  const openAuth = useUiStore((s) => s.openAuth);
  return (
    <Button size="sm" onClick={() => openAuth("/")}>
      Login
    </Button>
  );
}
