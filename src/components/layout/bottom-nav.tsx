"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { motion } from "motion/react";
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
import Image from "next/image";
import logoImg from "@/assets/brand/logo.png";

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
  match?: "exact" | "prefix";
  /** The raised center button (Play). */
  featured?: boolean;
};

const memberTabs: Tab[] = [
  { href: "/", label: "Home", icon: Home, match: "exact" },
  { href: "/jadwal", label: "Jadwal", icon: CalendarDays },
  { href: "/play", label: "Play", icon: Swords, featured: true },
  { href: "/events", label: "Events", icon: Trophy },
  { href: "/profile", label: "Profile", icon: UserRound },
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
  const isAdmin = role === "ADMIN";
  const inAdminArea = pathname.startsWith("/club");

  // Admins open /club from the shield button in the top bar, so the member
  // bar stays at five tabs and the active label always fits.
  const tabs: Tab[] = inAdminArea && isAdmin ? adminTabs : memberTabs;

  const onAdminBar = inAdminArea && isAdmin;
  const spring = { type: "spring", stiffness: 460, damping: 34 } as const;

  // Icons only, no labels: every tab keeps its size, so the bar never shifts
  // and Play stays exactly in the middle.
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
        <ul className="flex items-center gap-[clamp(6px,2.2vw,12px)] rounded-full border border-white/70 bg-white/75 p-[clamp(6px,1.8vw,8px)] shadow-[0_20px_48px_rgba(14,44,60,0.2)] backdrop-blur-xl">
          {tabs.map((tab) => {
            const active = isActive(pathname, tab);
            const Icon = tab.icon;
            if (tab.featured) {
              return (
                <li key={tab.href} className="relative">
                  <Link
                    href={tab.href}
                    aria-label={tab.label}
                    aria-current={active ? "page" : undefined}
                    className="group relative -my-5 flex size-[clamp(62px,17vw,70px)] items-center justify-center"
                  >
                    {/* soft glow ring; pulses while Play is the current page */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-0 rounded-full bg-accent/35 transition-transform duration-300",
                        active ? "play-pulse" : "scale-90 group-hover:scale-100",
                      )}
                    />
                    <span
                      className={cn(
                        "relative flex size-[86%] items-center justify-center rounded-full bg-gradient-to-br from-[#f6b46a] to-accent-2 text-navy shadow-[0_12px_26px_rgba(238,159,72,0.55)] ring-4 ring-white transition-transform duration-200 group-active:scale-95",
                        active && "scale-105",
                      )}
                    >
                      <Icon className="size-7" strokeWidth={2.4} />
                    </span>
                  </Link>
                </li>
              );
            }
            return (
              <li key={`${tab.href}-${tab.label}`} className="relative">
                <Link
                  href={tab.href}
                  
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex size-[clamp(46px,12.6vw,54px)] items-center justify-center rounded-full transition-colors duration-200",
                    active ? "text-white" : "bg-white text-navy/70 shadow-[0_2px_10px_rgba(14,44,60,0.08)] hover:text-navy",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-dot"
                      transition={spring}
                      className="absolute inset-0 rounded-full bg-navy shadow-[0_10px_22px_rgba(14,44,60,0.35)]"
                    />
                  )}
                  <Icon className="relative z-10 size-[22px]" strokeWidth={active ? 2.4 : 2} />
                </Link>
              </li>
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
