import Link from "next/link";
import { id as localeId } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminLogKind } from "@prisma/client";
import { requireAdminPage } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatClub, hoursAgo } from "@/lib/time";
import { person } from "@/lib/people";
import { cn } from "@/lib/utils";
import { AdminHeader } from "@/components/club/admin-header";
import { AdminLogRow, LOG_KINDS } from "@/components/club/admin-log-list";

const PAGE_SIZE = 40;

export default async function AdminLogPage({ searchParams }: { searchParams: Promise<{ kind?: string; page?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const kind = (Object.keys(LOG_KINDS) as AdminLogKind[]).find((k) => k.toLowerCase() === sp.kind) ?? null;
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const where = kind ? { kind } : {};

  const [total, entries] = await Promise.all([
    prisma.adminLog.count({ where }),
    prisma.adminLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: person } },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (k: AdminLogKind | null, p: number) => {
    const q = new URLSearchParams();
    if (k) q.set("kind", k.toLowerCase());
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return `/club/log${s ? `?${s}` : ""}`;
  };

  const today = formatClub(hoursAgo(0), "yyyy-MM-dd");
  const yesterday = formatClub(hoursAgo(24), "yyyy-MM-dd");
  const groups: { label: string; items: typeof entries }[] = [];
  for (const e of entries) {
    const key = formatClub(e.createdAt, "yyyy-MM-dd");
    const label = key === today ? "Hari ini" : key === yesterday ? "Kemarin" : formatClub(e.createdAt, "EEEE, d MMM yyyy", { locale: localeId });
    const last = groups.at(-1);
    if (last?.label === label) last.items.push(e);
    else groups.push({ label, items: [e] });
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <AdminHeader title="Log aktivitas" desc="Siapa mengubah apa: member, iuran, agenda, skor dan pengumuman." />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[null, ...(Object.keys(LOG_KINDS) as AdminLogKind[])].map((k) => (
          <Link
            key={k ?? "all"}
            href={href(k, 1)}
            scroll={false}
            aria-current={k === kind ? "page" : undefined}
            className={cn(
              "flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-bold transition",
              k === kind ? "bg-navy text-white shadow-[0_6px_14px_rgba(14,44,60,0.25)]" : "bg-white/80 text-navy/60 hover:text-navy",
            )}
          >
            {k ? LOG_KINDS[k].label : "Semua"}
          </Link>
        ))}
      </div>

      {entries.length === 0 && <p className="rounded-[24px] bg-white/90 p-5 text-center text-sm text-slate-500">Belum ada aktivitas.</p>}

      {groups.map((g) => (
        <section key={g.label} className="flex flex-col gap-1.5">
          <h2 className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{g.label}</h2>
          <div className="flex flex-col rounded-[26px] border border-white bg-white/90 p-1.5 shadow-[0_10px_28px_rgba(14,44,60,0.06)]">
            {g.items.map((e) => (
              <AdminLogRow key={e.id} entry={e} />
            ))}
          </div>
        </section>
      ))}

      {pages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Link
            href={href(kind, page - 1)}
            aria-disabled={page <= 1}
            className={cn("flex h-10 items-center gap-1 rounded-full bg-white/90 px-4 text-sm font-bold text-navy shadow-sm", page <= 1 && "pointer-events-none opacity-40")}
          >
            <ChevronLeft className="size-4" /> Baru
          </Link>
          <span className="text-sm font-semibold text-slate-500">
            {Math.min(page, pages)} / {pages}
          </span>
          <Link
            href={href(kind, page + 1)}
            aria-disabled={page >= pages}
            className={cn("flex h-10 items-center gap-1 rounded-full bg-white/90 px-4 text-sm font-bold text-navy shadow-sm", page >= pages && "pointer-events-none opacity-40")}
          >
            Lama <ChevronRight className="size-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
