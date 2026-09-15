"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBell({ unread = 0 }: { unread?: number }) {
  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="fixed right-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white text-[#0b2a4a] shadow-[0_10px_24px_rgba(11,42,74,0.12)] md:right-6 md:top-6"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2eb6ea] px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
