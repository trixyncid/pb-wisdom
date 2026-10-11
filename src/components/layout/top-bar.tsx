import Link from "next/link";
import { ChevronDown, Shield } from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function TopBar({
  nick,
  imageUrl,
  isAdmin,
  unread,
}: {
  nick: string;
  imageUrl: string | null;
  isAdmin: boolean;
  unread: number;
}) {
  const initials = nick.slice(0, 2).toUpperCase();
  const firstName = nick.split(" ")[0];

  return (
    <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
        <Link
          href="/profile"
          className="flex min-w-0 items-center gap-2.5 rounded-full border border-white/80 bg-white/80 p-1 pr-3.5 shadow-[0_6px_20px_rgba(14,44,60,0.08)] backdrop-blur-xl transition hover:bg-white"
        >
          <Avatar className="size-9 shrink-0 bg-sand">
            {imageUrl && <AvatarImage src={imageUrl} alt="" className="object-cover" />}
            <AvatarFallback className="text-[11px] font-bold text-navy">{initials}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium text-navy">
            Halo, <span className="font-bold">{firstName}!</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-navy/50" />
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/club"
              aria-label="Club admin"
              className="flex size-11 items-center justify-center rounded-full bg-accent text-navy shadow-[0_8px_20px_rgba(238,159,72,0.4)] transition hover:bg-accent-2"
            >
              <Shield className="size-5" />
            </Link>
          )}
          <NotificationBell unread={unread} />
        </div>
      </div>
    </header>
  );
}
