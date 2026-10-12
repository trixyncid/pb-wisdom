"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import type { SkillLevel } from "@prisma/client";
import { MessageCircle, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPhone } from "@/lib/phone";
import { SKILLS, SKILL_TONE, skillLabel, waLink } from "@/lib/people";
import { cn } from "@/lib/utils";

export type DirectoryMember = {
  id: string;
  role: string;
  nickname: string;
  phone: string | null;
  skill: SkillLevel;
  imageUrl: string;
};

export function DirectoryBrowser({ members, currentUserId }: { members: DirectoryMember[]; currentUserId: string }) {
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState<SkillLevel | "ALL">("ALL");
  const query = useDeferredValue(q.trim().toLowerCase());

  const filtered = useMemo(() => {
    const raw = query.replace(/\D/g, "");
    const digits = raw.startsWith("0") ? `62${raw.slice(1)}` : raw;
    return members.filter(
      (m) =>
        (skill === "ALL" || m.skill === skill) &&
        (!query || m.nickname.toLowerCase().includes(query) || (digits.length >= 3 && m.phone?.includes(digits))),
    );
  }, [members, query, skill]);

  return (
    <div className="flex flex-col gap-3">
      <label className="relative block">
        <span className="sr-only">Cari member</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama atau nomor…"
          className="h-12 w-full rounded-full border border-white bg-white/90 pl-11 pr-4 text-sm text-navy shadow-sm outline-none transition focus:ring-2 focus:ring-accent"
        />
      </label>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Filter level">
        {[{ value: "ALL" as const, label: "Semua" }, ...SKILLS].map((s) => (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={skill === s.value}
            onClick={() => setSkill(s.value)}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-sm font-bold transition",
              skill === s.value ? "bg-navy text-white shadow-[0_6px_14px_rgba(14,44,60,0.25)]" : "bg-white/80 text-navy/60 hover:text-navy",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="px-1 text-xs font-semibold text-slate-500">{filtered.length} member</p>

      {filtered.length === 0 ? (
        <p className="rounded-[24px] bg-white/90 p-5 text-center text-sm text-slate-500">Tidak ada member yang cocok.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((m) => {
            const wa = m.id === currentUserId ? null : waLink(m.phone, `Halo ${m.nickname}, aku dari PB Wisdom 👋`);
            return (
              <li key={m.id} className="flex items-center gap-2 rounded-[24px] border border-white bg-white/90 p-2 pr-2.5 shadow-[0_8px_22px_rgba(14,44,60,0.05)]">
                <Link href={`/members/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] p-1 transition hover:bg-cream">
                  <Avatar className="size-12">
                    <AvatarImage src={m.imageUrl} alt="" />
                    <AvatarFallback className="text-navy">{m.nickname.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-navy">
                      {m.nickname}
                      {m.id === currentUserId && <span className="ml-1.5 text-xs text-accent-ink">kamu</span>}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", SKILL_TONE[m.skill])}>{skillLabel(m.skill)}</span>
                      {m.role === "ADMIN" && <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-bold text-navy">Admin</span>}
                      {m.phone && <span className="truncate text-[11px] text-slate-400">{formatPhone(m.phone)}</span>}
                    </span>
                  </span>
                </Link>
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Chat ${m.nickname} di WhatsApp`}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_6px_14px_rgba(37,211,102,0.35)] transition active:scale-95"
                  >
                    <MessageCircle className="size-5" />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
