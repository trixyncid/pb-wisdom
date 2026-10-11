import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBell({ unread = 0 }: { unread?: number }) {
  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
      className="relative flex size-11 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/80 text-navy shadow-[0_6px_20px_rgba(14,44,60,0.08)] backdrop-blur-xl transition hover:bg-white"
    >
      <Bell className="size-5" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-5 text-navy ring-2 ring-cream">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
