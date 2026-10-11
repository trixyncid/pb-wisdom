import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns `next` only if it is a path on this site, otherwise "/". Blocks
 * open redirects such as `?next=https://evil.example` or `//evil.example`.
 */
export function safeRedirectPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/";
  }
  return next;
}

export function formatRp(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function weekdayLabel(weekday: number, locale: string = "id") {
  const daysId = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return locale === "en" ? daysEn[weekday] : daysId[weekday];
}
