"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  CalendarDays,
  Home,
  LayoutGrid,
  Receipt,
  Swords,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store";
import Image from "next/image";
import logoImg from "@/assets/brand/logo.png";

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
  public?: boolean;
  match?: "exact" | "prefix";
};

const memberTabs: Tab[] = [
  { href: "/", label: "Home", icon: Home, public: true, match: "exact" },
  { href: "/jadwal", label: "Jadwal", icon: CalendarDays, public: true },
  { href: "/events", label: "Events", icon: Trophy, public: false },
  { href: "/play", label: "Play", icon: Swords, public: false },
  { href: "/profile", label: "Profile", icon: UserRound, public: false },
];

const adminTabs: Tab[] = [
  { href: "/club", label: "Hub", icon: LayoutGrid, match: "exact" },
  { href: "/club/members", label: "Members", icon: Users },
  { href: "/club/iuran", label: "Iuran", icon: Receipt },
  { href: "/club/jadwal", label: "Agenda", icon: CalendarDays },
  { href: "/", label: "App", icon: ArrowLeft, match: "exact" },
];

function isActive(pathname: string, tab: Tab) {
  if (tab.href === "/club" && tab.label === "Hub") {
    return pathname === "/club" || pathname.startsWith("/club/export");
  }
  if (tab.match === "exact") return pathname === tab.href;
  if (tab.href === "/") return pathname === "/";
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

// The role comes from the server (AppShell) instead of useSession(), which
// fetched /api/auth/session on every page load and window focus.
export function BottomNav({ role }: { role: Role | null }) {
  const pathname = usePathname();
  const openAuth = useUiStore((s) => s.openAuth);
  const loggedIn = role !== null;
  const isAdmin = role === "ADMIN";
  const inAdminArea = pathname.startsWith("/club");

  // Admins open /club from the shield button in the top bar, so the member
  // bar stays at five tabs and the active label always fits.
  const tabs: Tab[] = inAdminArea && isAdmin ? adminTabs : memberTabs;

  function go(tab: Tab, e: React.MouseEvent) {
    if (tab.public) return;
    if (!loggedIn) {
      e.preventDefault();
      openAuth(tab.href);
    }
  }

  const onAdminBar = inAdminArea && isAdmin;
  // Labels fit next to the active icon with up to 5 tabs on a 375px phone.
  const showLabel = tabs.length <= 5;
  const spring = { type: "spring", stiffness: 420, damping: 34 } as const;

  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-50 flex flex-col items-center px-2 md:hidden"
      >
        {onAdminBar && (
          <p className="mb-1.5 rounded-full bg-navy px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            Club Admin
          </p>
        )}
        <ul className="flex max-w-full items-center gap-[clamp(4px,1.6vw,8px)] rounded-full border border-white/70 bg-white/70 p-[clamp(5px,1.6vw,8px)] shadow-[0_20px_48px_rgba(14,44,60,0.2)] backdrop-blur-xl">
          {tabs.map((tab) => {
            const active = isActive(pathname, tab);
            const Icon = tab.icon;
            return (
              <motion.li key={`${tab.href}-${tab.label}`} layout transition={spring} className="relative">
                <Link
                  href={tab.href}
                  onClick={(e) => go(tab, e)}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    // Sizes scale with the screen: ~48px circles on a 375px phone, 56px max.
                    "relative flex h-[clamp(48px,13vw,56px)] items-center rounded-full text-[15px] font-bold transition-colors duration-200",
                    active
                      ? cn("text-white", showLabel ? "gap-2 pl-[5px] pr-[clamp(14px,4vw,20px)]" : "w-[clamp(48px,13vw,56px)] justify-center")
                      : "w-[clamp(48px,13vw,56px)] justify-center bg-white text-navy shadow-[0_2px_10px_rgba(14,44,60,0.08)] hover:bg-cream",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      transition={spring}
                      className="absolute inset-0 rounded-full bg-navy shadow-[0_10px_22px_rgba(14,44,60,0.35)]"
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex items-center justify-center rounded-full transition-all duration-300",
                      active ? "size-[clamp(38px,10.5vw,46px)] bg-white text-navy" : "size-6",
                    )}
                  >
                    <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
                  </span>
                  <AnimatePresence initial={false}>
                    {active && showLabel && (
                      <motion.span
                        key="label"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.2, delay: 0.05 }}
                        className="relative z-10 whitespace-nowrap"
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-navy/8 bg-white/70 p-5 backdrop-blur-xl md:flex">
        <Link href="/" className="mb-8 block px-2" aria-label="PB Wisdom, beranda">
          <Image src={logoImg} alt="PB Wisdom" width={170} height={129} priority className="h-auto w-[170px]" />
        </Link>

        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Member
        </p>
        <ul className="mb-6 space-y-1">
          {memberTabs.map((tab) => {
            const active = isActive(pathname, tab);
            const Icon = tab.icon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  onClick={(e) => go(tab, e)}
                  className={cn(
                    "flex items-center gap-3 rounded-full p-1.5 pr-4 text-sm font-semibold transition-colors duration-200",
                    active
                      ? "bg-navy text-white shadow-[0_10px_22px_rgba(14,44,60,0.25)]"
                      : "text-navy/70 hover:bg-sand hover:text-navy",
                  )}
                >
                  <span className={cn("flex size-9 items-center justify-center rounded-full", active ? "bg-white text-navy" : "bg-white/80")}>
                    <Icon className="size-4" />
                  </span>
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {isAdmin && (
          <>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-accent-ink">
              Club Admin
            </p>
            <ul className="space-y-1">
              {adminTabs
                .filter((t) => t.label !== "App")
                .map((tab) => {
                  const active = isActive(pathname, tab);
                  const Icon = tab.icon;
                  return (
                    <li key={tab.href}>
                      <Link
                        href={tab.href}
                        className={cn(
                          "flex items-center gap-3 rounded-full p-1.5 pr-4 text-sm font-semibold transition-colors duration-200",
                          active
                            ? "bg-accent text-navy shadow-[0_10px_22px_rgba(238,159,72,0.35)]"
                            : "text-navy/70 hover:bg-sand hover:text-navy",
                        )}
                      >
                        <span className={cn("flex size-9 items-center justify-center rounded-full", active ? "bg-white text-navy" : "bg-white/80")}>
                          <Icon className="size-4" />
                        </span>
                        {tab.label}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </>
        )}
      </aside>
    </>
  );
}
