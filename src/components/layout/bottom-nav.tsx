"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CalendarDays,
  Home,
  LayoutGrid,
  Receipt,
  Shield,
  Swords,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store";

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
  { href: "/club/jadwal", label: "Jadwal", icon: CalendarDays },
  { href: "/club/events", label: "Events", icon: Trophy },
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

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const openAuth = useUiStore((s) => s.openAuth);
  const loggedIn = status === "authenticated";
  const isAdmin = session?.user?.role === "ADMIN";
  const inAdminArea = pathname.startsWith("/club");

  const tabs: Tab[] = inAdminArea && isAdmin
    ? adminTabs
    : [
        ...memberTabs,
        ...(isAdmin
          ? [
              {
                href: "/club",
                label: "Admin",
                icon: Shield,
                public: false,
                match: "prefix" as const,
              },
            ]
          : []),
      ];

  function go(tab: Tab, e: React.MouseEvent) {
    if (tab.public) return;
    if (!loggedIn) {
      e.preventDefault();
      openAuth(tab.href);
      return;
    }
    if (!loggedIn) {
      e.preventDefault();
      router.push(`/?login=1&next=${encodeURIComponent(tab.href)}`);
    }
  }

  const layoutId = inAdminArea ? "admin-nav-pill" : "nav-pill";
  const compact = tabs.length > 5;

  return (
    <>
      <nav className="fixed bottom-4 left-1/2 z-50 w-[min(94vw,440px)] -translate-x-1/2 md:hidden">
        {inAdminArea && isAdmin && (
          <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#2eb6ea]">
            Club Admin
          </p>
        )}
        <ul
          className={cn(
            "flex items-center justify-between rounded-[28px] border border-white/80 bg-white/95 py-2 shadow-[0_16px_40px_rgba(11,42,74,0.14)] backdrop-blur-xl",
            compact ? "px-1.5" : "px-2",
            inAdminArea && "border-[#2eb6ea]/25 bg-[#0b2a4a]",
          )}
        >
          {tabs.map((tab) => {
            const active = isActive(pathname, tab);
            const Icon = tab.icon;
            const onAdminBar = inAdminArea && isAdmin;
            return (
              <li key={`${tab.href}-${tab.label}`} className="relative">
                <Link
                  href={tab.href}
                  onClick={(e) => go(tab, e)}
                  aria-label={tab.label}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-full text-[9px] font-bold transition",
                    compact ? "h-11 w-11" : "h-12 w-12",
                    onAdminBar
                      ? active
                        ? "text-[#0b2a4a]"
                        : "text-white/55"
                      : active
                        ? "text-white"
                        : "text-slate-400",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={layoutId}
                      className={cn(
                        "absolute inset-0 rounded-full shadow-[0_8px_18px_rgba(46,182,234,0.45)]",
                        onAdminBar ? "bg-white" : "bg-[#2eb6ea]",
                      )}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    />
                  )}
                  <Icon className={cn("relative z-10", compact ? "h-4 w-4" : "h-5 w-5")} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <aside className="fixed left-0 top-0 z-40 hidden h-full w-60 flex-col border-r border-[#0b2a4a]/8 bg-white/90 p-4 backdrop-blur md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/shuttle-3d.png" alt="" className="h-10 w-10" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2eb6ea]">
              PB Wisdom
            </p>
            <p className="text-lg font-black text-[#0b2a4a]">Club App</p>
          </div>
        </div>

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
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition",
                    active
                      ? "bg-[#2eb6ea] text-white shadow-md shadow-sky-300/40"
                      : "text-[#0b2a4a]/70 hover:bg-[#e8f3fb]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {isAdmin && (
          <>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2eb6ea]">
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
                          "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition",
                          active
                            ? "bg-[#0b2a4a] text-white shadow-md"
                            : "text-[#0b2a4a]/70 hover:bg-[#e8f3fb]",
                        )}
                      >
                        <Icon className="h-4 w-4" />
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
