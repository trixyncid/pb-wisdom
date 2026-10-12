"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { MemberStatus, Role, SkillLevel } from "@prisma/client";
import { Check, ChevronDown, MessageCircle, Search, Shield, ShieldOff, UserRound, UserRoundX, X } from "lucide-react";
import { withToast } from "@/lib/with-toast";
import type { ActionResult } from "@/lib/action-result";
import { approveMemberAction, deactivateMemberAction } from "@/actions/auth";
import { setAdminRoleAction } from "@/actions/admin";
import { formatPhone } from "@/lib/phone";
import { SKILL_TONE, skillLabel, waLink } from "@/lib/people";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResetLinkButton } from "@/components/club/reset-link-button";

export type ManagedMember = {
  id: string;
  nickname: string;
  email: string;
  phone: string | null;
  role: Role;
  status: MemberStatus;
  skill: SkillLevel;
  avatar: string;
  joined: string;
};

const TABS = [
  { key: "aktif", label: "Aktif", test: (m: ManagedMember) => (m.role === "MEMBER" || m.role === "ADMIN") && m.status === "ACTIVE" },
  { key: "menunggu", label: "Menunggu", test: (m: ManagedMember) => m.role === "PENDING" },
  { key: "admin", label: "Admin", test: (m: ManagedMember) => m.role === "ADMIN" },
  { key: "nonaktif", label: "Nonaktif", test: (m: ManagedMember) => (m.role === "MEMBER" || m.role === "ADMIN") && m.status === "INACTIVE" },
  { key: "ditolak", label: "Ditolak", test: (m: ManagedMember) => m.role === "REJECTED" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function MemberManager({ members, currentUserId, initialTab }: { members: ManagedMember[]; currentUserId: string; initialTab?: string }) {
  const [tab, setTab] = useState<TabKey>(() => TABS.find((t) => t.key === initialTab)?.key ?? (members.some((m) => m.role === "PENDING") ? "menunggu" : "aktif"));
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const query = useDeferredValue(q.trim().toLowerCase());
  const current = TABS.find((t) => t.key === tab)!;

  const list = useMemo(() => {
    const raw = query.replace(/\D/g, "");
    const digits = raw.startsWith("0") ? `62${raw.slice(1)}` : raw;
    const matches = (m: ManagedMember) =>
      !query || m.nickname.toLowerCase().includes(query) || m.email.toLowerCase().includes(query) || (digits.length >= 3 && !!m.phone?.includes(digits));
    return members.filter((m) => current.test(m) && matches(m));
  }, [members, current, query]);

  return (
    <div className="flex flex-col gap-3">
      <label className="relative block">
        <span className="sr-only">Cari member</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama, email atau nomor…"
          className="h-12 w-full rounded-full border border-white bg-white/90 pl-11 pr-4 text-sm text-navy shadow-sm outline-none transition focus:ring-2 focus:ring-accent"
        />
      </label>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Status member">
        {TABS.map((t) => {
          const count = members.filter(t.test).length;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition",
                tab === t.key ? "bg-navy text-white shadow-[0_6px_14px_rgba(14,44,60,0.25)]" : "bg-white/80 text-navy/60 hover:text-navy",
              )}
            >
              {t.label}
              <span className={cn("rounded-full px-1.5 text-xs", tab === t.key ? "bg-white/15" : t.key === "menunggu" && count > 0 ? "bg-accent text-navy" : "bg-cream")}>{count}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="rounded-[24px] bg-white/90 p-5 text-center text-sm text-slate-500">Tidak ada member di sini.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((m) => (
            <MemberRow key={m.id} m={m} isMe={m.id === currentUserId} open={open === m.id} onToggle={() => setOpen(open === m.id ? null : m.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MemberRow({ m, isMe, open, onToggle }: { m: ManagedMember; isMe: boolean; open: boolean; onToggle: () => void }) {
  const [pending, start] = useTransition();
  const run = (action: Promise<ActionResult<object>>, success: string) =>
    start(async () => {
      await withToast(action, { success });
    });
  const wa = waLink(m.phone);
  const approved = m.role === "MEMBER" || m.role === "ADMIN";

  return (
    <li className={cn("overflow-hidden rounded-[24px] border bg-white/90 shadow-[0_8px_22px_rgba(14,44,60,0.05)]", m.role === "PENDING" ? "border-accent/40" : "border-white")}>
      <div className="flex items-center gap-3 p-3">
        <Avatar className="size-12">
          <AvatarImage src={m.avatar} alt="" />
          <AvatarFallback className="text-navy">{m.nickname.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-navy">
            {m.nickname}
            {isMe && <span className="ml-1.5 text-xs text-accent-ink">kamu</span>}
          </p>
          <p className="truncate text-xs text-slate-500">{m.email}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {m.role === "ADMIN" && <span className="rounded-full bg-navy px-2 py-0.5 text-[11px] font-bold text-white">Admin</span>}
            {approved && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", SKILL_TONE[m.skill])}>{skillLabel(m.skill)}</span>}
            {approved && m.status === "INACTIVE" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">Nonaktif</span>}
            {!approved && <span className="text-[11px] text-slate-400">Daftar {m.joined}</span>}
          </div>
        </div>
        {m.role === "PENDING" ? (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(approveMemberAction(m.id, false), "Pendaftaran ditolak")}
              aria-label={`Tolak ${m.nickname}`}
              className="flex size-10 items-center justify-center rounded-full bg-cream text-navy/60 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(approveMemberAction(m.id, true), `${m.nickname} disetujui`)}
              className="flex h-10 items-center gap-1 rounded-full bg-accent px-3.5 text-sm font-bold text-navy shadow-[0_6px_14px_rgba(238,159,72,0.35)] disabled:opacity-50"
            >
              <Check className="size-4" /> Setujui
            </button>
          </div>
        ) : (
          <button type="button" onClick={onToggle} aria-expanded={open} aria-label={`Kelola ${m.nickname}`} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cream text-navy transition hover:bg-sand">
            <ChevronDown className={cn("size-4 transition", open && "rotate-180")} />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && m.role !== "PENDING" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-wrap gap-2 border-t border-navy/6 p-3">
              {m.phone && <p className="w-full text-xs text-slate-500">WhatsApp {formatPhone(m.phone)} · bergabung {m.joined}</p>}
              {approved && (
                <Link href={`/members/${m.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-cream px-3 text-xs font-bold text-navy hover:bg-sand">
                  <UserRound className="size-3.5" /> Profil
                </Link>
              )}
              {wa && !isMe && (
                <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25d366] px-3 text-xs font-bold text-white">
                  <MessageCircle className="size-3.5" /> Chat
                </a>
              )}
              {approved && !isMe && <ResetLinkButton userId={m.id} />}
              {m.role === "MEMBER" && m.status === "ACTIVE" && (
                <ActionChip
                  disabled={pending}
                  icon={Shield}
                  label="Jadikan admin"
                  onClick={() => window.confirm(`Jadikan ${m.nickname} admin? Admin bisa mengelola member, iuran dan agenda.`) && run(setAdminRoleAction(m.id, true), `${m.nickname} sekarang admin`)}
                />
              )}
              {m.role === "ADMIN" && !isMe && (
                <ActionChip disabled={pending} icon={ShieldOff} label="Cabut admin" onClick={() => window.confirm(`Cabut peran admin ${m.nickname}?`) && run(setAdminRoleAction(m.id, false), "Peran admin dicabut")} />
              )}
              {m.role === "MEMBER" && (
                <ActionChip
                  disabled={pending}
                  icon={UserRoundX}
                  label={m.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan lagi"}
                  danger={m.status === "ACTIVE"}
                  onClick={() => run(deactivateMemberAction(m.id, m.status !== "ACTIVE"), m.status === "ACTIVE" ? "Member dinonaktifkan" : "Member aktif lagi")}
                />
              )}
              {m.role === "REJECTED" && <ActionChip disabled={pending} icon={Check} label="Pulihkan sebagai member" onClick={() => run(approveMemberAction(m.id, true), `${m.nickname} dipulihkan`)} />}
              {isMe && <p className="text-xs text-slate-500">Ini akunmu. Peran dan status diubah oleh admin lain.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function ActionChip({ icon: Icon, label, onClick, disabled, danger }: { icon: typeof Shield; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition disabled:opacity-50",
        danger ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-cream text-navy hover:bg-sand",
      )}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  );
}
