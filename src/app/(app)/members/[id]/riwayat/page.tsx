import Link from "next/link";
import { notFound } from "next/navigation";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { MatchType, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatClub } from "@/lib/time";
import { canReport } from "@/lib/match-report";
import { nameOf, person, toPlayers } from "@/lib/people";
import { cn } from "@/lib/utils";
import { MatchCard } from "@/components/play/match-card";
import { ReportMatchButton } from "@/components/play/report-match-button";

const PAGE_SIZE = 15;
const MODES = [
  { key: "semua", label: "Semua", type: null },
  { key: "single", label: "Single", type: "SINGLES" },
  { key: "ganda", label: "Ganda", type: "DOUBLES" },
] as const satisfies readonly { key: string; label: string; type: MatchType | null }[];

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function MatchHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "MEMBER" && session.user.role !== "ADMIN")) return null;
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const me = session.user.id;
  const isMe = id === me;
  const mode = MODES.find((m) => m.key === sp.mode) ?? MODES[0];
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);

  const user = await prisma.user.findFirst({ where: { id, role: { in: ["MEMBER", "ADMIN"] } }, select: person });
  if (!user) notFound();

  // Your own reported matches stay visible here while the admin checks them.
  const where: Prisma.MatchWhereInput = {
    status: isMe ? { in: ["CONFIRMED", "DISPUTED"] } : "CONFIRMED",
    players: { some: { userId: id } },
    ...(mode.type ? { type: mode.type } : {}),
  };
  const result = (won: boolean) => prisma.match.count({ where: { ...where, status: "CONFIRMED", players: { some: { userId: id, won } } } });
  const [total, wins, losses, matches] = await Promise.all([
    prisma.match.count({ where }),
    result(true),
    result(false),
    prisma.match.findMany({
      where,
      orderBy: { playedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { players: { include: { user: { select: person } } } },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (m: string, p: number) => {
    const q = new URLSearchParams();
    if (m !== "semua") q.set("mode", m);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return `/members/${id}/riwayat${s ? `?${s}` : ""}`;
  };

  const groups: { label: string; items: typeof matches }[] = [];
  for (const m of matches) {
    const label = formatClub(m.playedAt, "MMMM yyyy", { locale: localeId });
    const last = groups.at(-1);
    if (last?.label === label) last.items.push(m);
    else groups.push({ label, items: [m] });
  }
  let i = 2;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="rise" style={rise(0)}>
        <Link href={isMe ? "/play" : `/members/${id}`} className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-navy/60 hover:text-navy">
          <ArrowLeft className="size-4" /> {isMe ? "Play" : nameOf(user)}
        </Link>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent-ink">{isMe ? "Riwayat saya" : nameOf(user)}</p>
        <h1 className="font-display mt-1 text-[2.1rem] font-extrabold leading-[1.05] text-navy">Riwayat match</h1>
        <p className="mt-1 text-sm text-slate-500">
          {total} match · {wins} menang · {losses} kalah
        </p>
      </div>

      <nav aria-label="Jenis match" className="rise flex gap-1 rounded-full bg-white/80 p-1 shadow-sm" style={rise(1)}>
        {MODES.map((m) => (
          <Link
            key={m.key}
            href={href(m.key, 1)}
            scroll={false}
            aria-current={m.key === mode.key ? "page" : undefined}
            className={cn(
              "flex h-10 flex-1 items-center justify-center rounded-full text-sm font-bold transition",
              m.key === mode.key ? "bg-navy text-white shadow-[0_6px_14px_rgba(14,44,60,0.25)]" : "text-navy/60 hover:text-navy",
            )}
          >
            {m.label}
          </Link>
        ))}
      </nav>

      {matches.length === 0 && <p className="px-1 text-sm text-slate-500">Belum ada match {mode.key === "semua" ? "" : mode.label.toLowerCase()} terverifikasi.</p>}

      {groups.map((g) => (
        <section key={g.label} className="flex flex-col gap-3">
          <h2 className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{g.label}</h2>
          {g.items.map((m) => (
            <div key={m.id} className="rise" style={rise(i++)}>
              <MatchCard
                type={m.type}
                score={m.score}
                playedAt={m.playedAt}
                players={toPlayers(m.players)}
                dispute={m.status === "DISPUTED" && m.disputeReason ? { by: m.disputedById === me ? "kamu" : "pemain", reason: m.disputeReason } : undefined}
                footer={canReport(m, me) ? <ReportMatchButton matchId={m.id} /> : undefined}
              />
            </div>
          ))}
        </section>
      ))}

      {pages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Link
            href={href(mode.key, page - 1)}
            aria-disabled={page <= 1}
            className={cn("flex h-10 items-center gap-1 rounded-full bg-white/90 px-4 text-sm font-bold text-navy shadow-sm", page <= 1 && "pointer-events-none opacity-40")}
          >
            <ChevronLeft className="size-4" /> Baru
          </Link>
          <span className="text-sm font-semibold text-slate-500">
            {Math.min(page, pages)} / {pages}
          </span>
          <Link
            href={href(mode.key, page + 1)}
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
