"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBell({ unread = 0 }: { unread?: number }) {
  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
      className="relative flex size-10 shrink-0 items-center justify-center rounded-full text-[#0b2a4a] hover:bg-[#0b2a4a]/5"
    >
      <Bell className="size-5" />
      {unread > 0 && (
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#2eb6ea]" />
      )}
    </Link>
  );
}
