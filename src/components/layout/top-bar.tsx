import Link from "next/link";
import { NotificationBell } from "@/components/layout/notification-bell";

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

  return (
    <header className="sticky top-0 z-40 border-b border-[#0b2a4a]/10 bg-[#f3f8fc]/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
        <Link href="/profile" className="flex min-w-0 items-center gap-2.5">
          <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-[#d9e8f4]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-[11px] font-semibold text-[#0b2a4a]">
                {initials}
              </span>
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold leading-5 text-[#0b2a4a]">
              {nick}
            </span>
            <span className="block truncate text-xs leading-4 text-slate-500">
              {isAdmin ? "Admin" : "Member"}
            </span>
          </span>
        </Link>
        <NotificationBell unread={unread} />
      </div>
    </header>
  );
}
