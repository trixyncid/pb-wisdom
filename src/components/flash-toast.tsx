"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Messages for actions that end with a full page load (logout and friends),
// where a toast shown before the reload would be lost. The action sends the
// browser to `?flash=<key>`; this shows the toast and tidies the URL.
const FLASH: Record<string, string> = {
  logout: "Kamu sudah keluar. Sampai jumpa di lapangan!",
  "logout-all": "Semua perangkat sudah keluar. Silakan masuk lagi.",
  "account-deleted": "Akunmu sudah dihapus. Terima kasih sudah bermain bersama PB Wisdom.",
};

/** URL that shows a flash message after the next full page load. */
export function withFlash(path: string, key: keyof typeof FLASH) {
  return `${path}${path.includes("?") ? "&" : "?"}flash=${key}`;
}

export function FlashToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const key = params.get("flash");

  useEffect(() => {
    if (!key) return;
    const message = FLASH[key];
    if (message) toast.success(message, { id: `flash-${key}` });
    const rest = new URLSearchParams(params.toString());
    rest.delete("flash");
    const qs = rest.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [key, params, pathname, router]);

  return null;
}
