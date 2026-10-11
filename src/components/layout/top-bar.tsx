import Image from "next/image";
import Link from "next/link";
import { Shield } from "lucide-react";
import logoImg from "@/assets/brand/logo.png";
import { NotificationBell } from "@/components/layout/notification-bell";
import { HomeGuestCta } from "@/components/home/home-guest-cta";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type TopBarMember = {
  nick: string;
  imageUrl: string | null;
  isAdmin: boolean;
  unread: number;
};

/**
 * Logo top-left on every page (on desktop the sidebar shows it instead).
 * Right side: member avatar + shortcuts, or a login button for guests.
 */
export function TopBar({ member, loggedIn }: { member: TopBarMember | null; loggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:border-none md:bg-transparent md:backdrop-blur-none">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
        <Link href="/" aria-label="PB Wisdom, beranda" className="shrink-0 md:invisible">
          <Image src={logoImg} alt="PB Wisdom" width={64} height={48} preload className="h-12 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          {member ? (
            <>
              {member.isAdmin && (
                <Link
                  href="/club"
                  aria-label="Club admin"
                  className="flex size-11 items-center justify-center rounded-full bg-accent text-navy shadow-[0_8px_20px_rgba(238,159,72,0.4)] transition hover:bg-accent-2"
                >
                  <Shield className="size-5" />
                </Link>
              )}
              <NotificationBell unread={member.unread} />
              <Link
                href="/profile"
                aria-label={`Profil ${member.nick}`}
                className="rounded-full ring-2 ring-white shadow-[0_6px_20px_rgba(14,44,60,0.12)] transition hover:ring-accent"
              >
                <Avatar className="size-11 bg-sand">
                  {member.imageUrl && <AvatarImage src={member.imageUrl} alt="" className="object-cover" />}
                  <AvatarFallback className="text-xs font-bold text-navy">
                    {member.nick.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            !loggedIn && <HomeGuestCta />
          )}
        </div>
      </div>
    </header>
  );
}
