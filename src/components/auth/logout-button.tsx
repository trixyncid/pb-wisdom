"use client";

import { useUiStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  className,
  variant = "secondary",
}: {
  className?: string;
  variant?: "secondary" | "outline" | "ghost" | "danger";
}) {
  const openLogout = useUiStore((s) => s.openLogout);

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={openLogout}
    >
      Keluar
    </Button>
  );
}
