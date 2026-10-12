import Link from "next/link";
import { ChevronRight, Flame, History } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { avatarUrl } from "@/lib/avatar";
import { getLeaderboard, getMemberWinrate } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScoreLauncher } from "@/components/play/score-launcher";
import { MatchCard } from "@/components/play/match-card";
import { nameOf, person, toPlayers } from "@/lib/people";
import { ReviewMatchButtons } from "@/components/play/review-match-buttons";
import { ReportMatchButton } from "@/components/play/report-match-button";
import { canReport } from "@/lib/match-report";

const MODES = [
  { key: "semua", label: "Semua", filter: "ALL" },
  { key: "single", label: "Single", filter: "SINGLES" },
  { key: "ganda", label: "Ganda", filter: "DOUBLES" },
] as const;

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function PlayPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const session = await auth();
  if (!session?.user) return null;
  const me = session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const { mode: modeParam } = await searchParams;
  const mode = MODES.find((m) => m.key === modeParam) ?? MODES[0];

  const [leaderboard, overall, myStats, members, pending, recent] = await Promise.all([
    getLeaderboard(mode.filter, 30),
    mode.filter === "ALL" ? null : getLeaderboard("ALL", 50),
    getMemberWinrate(me),
    prisma.user.findMany({
      where: { role: { in: ["MEMBER", "ADMIN"] }, NOT: { profile: { status: "INACTIVE" } } },
      select: person,
      orderBy: { profile: { nickname: "asc" } },
    }),
    prisma.match.findMany({
      where: { status: { in: ["PENDING", "DISPUTED"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { players: { include: { user: { select: person } } }, loggedBy: { select: person } },
    }),
    prisma.match.findMany({
      where: { status: "CONFIRMED" },
      orderBy: { playedAt: "desc" },
      take: 10,
      include: { players: { include: { user: { select: person } } } },
    }),
  ]);

  const ranking = overall ?? leaderboard;
  const myRank = ranking.findIndex((r) => r.userId === me);
  const myRow = ranking[myRank];
  const all = myStats.ALL;
  const ring = 2 * Math.PI * 52;
  // The reporter is always one of the match's players.
  const disputeOf = (m: (typeof pending)[number]) => {
    if (m.status !== "DISPUTED" || !m.disputeReason) return undefined;
    const by = m.players.find((p) => p.userId === m.disputedById);
    return { by: m.disputedById === me ? "kamu" : by ? nameOf(by.user) : "pemain", reason: m.disputeReason };
  };

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="rise" style={rise(0)}>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent-ink">Ayo main</p>
        <h1 className="font-display mt-1 text-[2.1rem] font-extrabold leading-[1.05] text-navy">Play</h1>
      </div>

      {/* my stats */}
      <section className="rise relative overflow-hidden rounded-[32px] bg-navy p-5 text-white shadow-[0_24px_52px_rgba(14,44,60,0.32)]" style={rise(1)}>
        <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative flex items-center gap-5">
          <div className="relative size-[124px] shrink-0">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#winrate)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={ring}
                strokeDashoffset={ring * (1 - all.winrate / 100)}
                className="ring-fill"
                style={{ "--ring": ring } as React.CSSProperties}
              />
              <defs>
                <linearGradient id="winrate" x1="0" x2="1">
                  <stop offset="0" stopColor="#f6b46a" />
                  <stop offset="1" stopColor="#ee9f48" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-extrabold">{all.winrate}%</span>
              <span className="text-[11px] font-semibold text-white/60">winrate</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-extrabold">
              {all.wins}W <span className="text-white/40">·</span> {all.losses}L
            </p>
            <p className="text-sm text-white/60">{all.played} match terverifikasi</p>
            {myRow && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                <Flame className="size-4 text-accent" /> Peringkat #{myRank + 1}
              </p>
            )}
            {myRow && myRow.form.length > 0 && (
              <div className="mt-2 flex gap-1" aria-label={`Form terakhir: ${myRow.form.join(" ")}`}>
                {myRow.form.map((r, i) => (
                  <span key={i} className={cn("flex size-6 items-center justify-center rounded-md text-[11px] font-extrabold", r === "W" ? "bg-accent text-navy" : "bg-white/10 text-white/60")}>
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-2">
          {([["Single", myStats.SINGLES], ["Ganda", myStats.DOUBLES]] as const).map(([label, s]) => (
            <div key={label} className="rounded-2xl bg-white/[0.07] px-3 py-2.5">
              <p className="text-xs font-semibold text-white/60">{label}</p>
              <p className="font-display text-lg font-extrabold">
                {s.winrate}% <span className="text-sm font-semibold text-white/50">{s.wins}W·{s.losses}L</span>
              </p>
            </div>
          ))}
        </div>
        <Link
          href={`/members/${me}/riwayat`}
          className="relative mt-3 flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/10 text-sm font-bold transition hover:bg-white/15"
        >
          <History className="size-4" /> Riwayat match saya <ChevronRight className="size-4" />
        </Link>
      </section>

      <ScoreLauncher
        members={members.map((m) => ({ id: m.id, name: nameOf(m), avatar: avatarUrl(m.id, m.profile?.updatedAt) }))}
        currentUserId={me}
        isAdmin={isAdmin}
      />

      {pending.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="rise flex items-center justify-between px-1 font-display text-xl font-bold text-navy" style={rise(3)}>
            Menunggu verifikasi
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-sm text-navy">{pending.length}</span>
          </h2>
          {pending.map((m, i) => (
            <div key={m.id} className="rise" style={rise(4 + i)}>
              <MatchCard
                type={m.type}
                score={m.score}
                playedAt={m.playedAt}
                players={toPlayers(m.players)}
                pendingBy={m.loggedById === me ? "kamu" : nameOf(m.loggedBy)}
                dispute={disputeOf(m)}
                footer={isAdmin ? <ReviewMatchButtons matchId={m.id} disputed={m.status === "DISPUTED"} /> : undefined}
              />
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-xl font-bold text-navy">Leaderboard</h2>
        </div>
        <nav aria-label="Jenis leaderboard" className="flex gap-1 rounded-full bg-white/80 p-1 shadow-sm">
          {MODES.map((m) => (
            <Link
              key={m.key}
              href={m.key === "semua" ? "/play" : `/play?mode=${m.key}`}
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
        {leaderboard.length === 0 ? (
          <p className="px-1 text-sm text-slate-500">Belum ada match {mode.key === "semua" ? "" : mode.label.toLowerCase()} terverifikasi.</p>
        ) : (
          <ol className="flex flex-col gap-1.5 rounded-[26px] border border-white bg-white/90 p-2 shadow-[0_10px_28px_rgba(14,44,60,0.06)]">
            {leaderboard.map((row, i) => (
              <li key={row.userId}>
                <Link href={`/members/${row.userId}`} className={cn("flex items-center gap-3 rounded-[20px] p-2 pr-3 transition hover:bg-cream", row.userId === me && "bg-accent-soft ring-1 ring-accent")}>
                <span
                  className={cn(
                    "font-display flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
                    i === 0 ? "bg-accent text-navy" : i < 3 ? "bg-navy text-white" : "text-navy/35",
                  )}
                >
                  {i + 1}
                </span>
                <Avatar className="size-10">
                  <AvatarImage src={row.imageUrl ?? undefined} alt="" />
                  <AvatarFallback className="text-navy">{row.nickname.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy">
                    {row.nickname}
                    {row.userId === me && <span className="ml-1.5 text-xs font-bold text-accent-ink">kamu</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.wins}W · {row.losses}L · {row.played} match
                  </p>
                </div>
                <span className="font-display text-lg font-extrabold text-navy">{row.winrate}%</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="px-1 font-display text-xl font-bold text-navy">Match terbaru</h2>
          {recent.map((m) => (
            <MatchCard
              key={m.id}
              type={m.type}
              score={m.score}
              playedAt={m.playedAt}
              players={toPlayers(m.players)}
              footer={canReport(m, me) ? <ReportMatchButton matchId={m.id} /> : undefined}
            />
          ))}
        </section>
      )}
    </div>
  );
}
