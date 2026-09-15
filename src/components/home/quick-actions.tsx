"use client";

import Link from "next/link";
import { CalendarDays, Swords, Trophy, Users } from "lucide-react";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const actions = [
  { href: "/jadwal", label: "Training", icon: CalendarDays, public: true },
  { href: "/events", label: "Events", icon: Trophy, public: false },
  { href: "/play", label: "Matches", icon: Swords, public: false },
  { href: "/directory", label: "Members", icon: Users, public: false },
];

export function QuickActions({ loggedIn }: { loggedIn: boolean }) {
  const openAuth = useUiStore((s) => s.openAuth);

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {actions.map((a, i) => {
        const Icon = a.icon;
        const active = i === 0;
        const className = cn(
          "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold shadow-sm transition",
          active
            ? "bg-[#0b2a4a] text-white"
            : "bg-white text-[#0b2a4a] border border-[#0b2a4a]/8",
        );

        if (!a.public && !loggedIn) {
          return (
            <button
              key={a.href}
              type="button"
              className={className}
              onClick={() => openAuth(a.href)}
            >
              <Icon className="h-4 w-4" />
              {a.label}
            </button>
          );
        }

        return (
          <Link key={a.href} href={a.href} className={className}>
            <Icon className="h-4 w-4" />
            {a.label}
          </Link>
        );
      })}
    </div>
  );
}
