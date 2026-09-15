import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CalendarDays,
  ChevronRight,
  Flame,
  MapPin,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLeaderboard } from "@/lib/stats";
import { formatRp, weekdayLabel } from "@/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ensureUpcomingOccurrencesAction } from "@/actions/jadwal";
import { HomeGuestCta } from "@/components/home/home-guest-cta";
import { QuickActions } from "@/components/home/quick-actions";
import { FloatingShuttle } from "@/components/home/floating-shuttle";

export default async function HomePage() {
  const session = await auth();
  await ensureUpcomingOccurrencesAction();

  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";
  const isMember =
    session?.user?.role === "MEMBER" || session?.user?.role === "ADMIN";

  const [
    profile,
    announcement,
    feeDue,
    occurrence,
    leaderboard,
    recentMatches,
    photos,
    pendingMatches,
    pendingMembers,
    pendingFees,
    memberCount,
  ] = await Promise.all([
    userId
      ? prisma.memberProfile.findUnique({ where: { userId } })
      : Promise.resolve(null),
    prisma.announcement.findFirst({ orderBy: { createdAt: "desc" } }),
    userId
      ? prisma.feeDue.findFirst({
          where: { userId },
          orderBy: { period: { dueDate: "desc" } },
          include: { period: true },
        })
      : Promise.resolve(null),
    prisma.trainingOccurrence.findFirst({
      where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      orderBy: { date: "asc" },
      include: {
        session: true,
        attendances: true,
      },
    }),
    getLeaderboard("ALL", 10),
    prisma.match.findMany({
      where: { status: "CONFIRMED" },
      take: 5,
      orderBy: { playedAt: "desc" },
      include: {
        players: { include: { user: { include: { profile: true } } } },
      },
    }),
    prisma.eventPhoto.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { event: true },
    }),
    userId
      ? prisma.matchPlayer.findMany({
          where: {
            userId,
            confirmed: false,
            match: { status: "PENDING" },
          },
          include: {
            match: {
              include: {
                players: {
                  include: { user: { include: { profile: true } } },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
    isAdmin
      ? prisma.user.count({ where: { role: "PENDING" } })
      : Promise.resolve(0),
    isAdmin
      ? prisma.feeDue.count({ where: { status: "SUBMITTED" } })
      : Promise.resolve(0),
    prisma.user.count({ where: { role: { in: ["MEMBER", "ADMIN"] } } }),
  ]);

  const myRank = userId
    ? leaderboard.findIndex((r) => r.userId === userId) + 1 || null
    : null;
  const nick = profile?.nickname ?? session?.user?.name ?? "Shuttle Star";
  const podium = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <AppShell>
      <header className="mb-4 flex items-center justify-between gap-3 pr-14">
        <div className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/shuttle-3d.png" alt="" className="h-10 w-10 float-y" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#2eb6ea]">
              PB Wisdom · Medan
            </p>
            <h1 className="truncate text-xl font-black text-[#0b2a4a]">
              {isMember ? `Hi, ${nick}!` : "Smash your way fun"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isMember && <HomeGuestCta />}
        </div>
      </header>

      <p className="mb-4 text-sm text-slate-500">
        {isMember
          ? "Ready for a match today?"
          : "Jadwal latihan publik · login untuk RSVP, iuran & winrate"}
      </p>

      {/* Hero */}
      <section className="relative mb-4 overflow-hidden rounded-[32px] border border-white bg-gradient-to-br from-[#dff3fc] via-white to-[#e8f3fb] p-5 shadow-[0_16px_40px_rgba(11,42,74,0.08)]">
        <div className="court-stripes absolute inset-0 opacity-60" />
        <FloatingShuttle />
        <div className="relative z-10 grid gap-4 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
          <div>
            <Badge className="mb-3 bg-[#0b2a4a] text-white normal-case tracking-normal">
              Club companion
            </Badge>
            <h2 className="text-3xl font-black leading-tight text-[#0b2a4a]">
              SMASH YOUR
              <br />
              WAY FUN
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Latihan mingguan, event sparring, leaderboard, dan iuran — semua
              di satu app PB Wisdom.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="normal-case tracking-normal bg-white text-[#0b2a4a]">
                <Users className="mr-1 h-3 w-3" /> {memberCount} members
              </Badge>
              <Badge className="normal-case tracking-normal bg-white text-[#0b2a4a]">
                <Flame className="mr-1 h-3 w-3" /> {leaderboard.length} ranked
              </Badge>
            </div>
          </div>
          <div className="relative mx-auto h-44 w-full max-w-[220px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/hero-racket-shuttle.png"
              alt="Badminton racket and shuttle"
              className="float-y absolute inset-0 h-full w-full object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      <QuickActions loggedIn={Boolean(isMember)} />

      {/* Promo / next session */}
      <Card className="mb-4 overflow-hidden bg-gradient-to-r from-[#0b2a4a] to-[#133a63] p-0 text-white">
        <div className="grid gap-0 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-2 p-5">
            <Badge className="bg-[#2eb6ea] text-white normal-case tracking-normal">
              Next training
            </Badge>
            {occurrence ? (
              <>
                <p className="text-xl font-black">{occurrence.session.title}</p>
                <p className="flex items-center gap-1 text-sm text-sky-100">
                  <CalendarDays className="h-4 w-4" />
                  {weekdayLabel(occurrence.session.weekday)} ·{" "}
                  {format(occurrence.date, "d MMM", { locale: localeId })} ·{" "}
                  {occurrence.session.startTime}
                </p>
                <p className="flex items-center gap-1 text-xs text-sky-200/80">
                  <MapPin className="h-3.5 w-3.5" />
                  {occurrence.session.venue}
                </p>
                <p className="text-xs text-sky-200/70">
                  {occurrence.attendances.length} sudah RSVP
                </p>
                <Link
                  href="/jadwal"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#5ec8f2]"
                >
                  Lihat jadwal <ChevronRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <p className="text-sm text-sky-100">Belum ada jadwal minggu ini</p>
            )}
          </div>
          <div className="relative hidden min-h-[140px] sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/promo-banner.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            />
          </div>
        </div>
      </Card>

      {announcement && (
        <Card className="mb-4 border-[#2eb6ea]/30 bg-[#e8f3fb]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#2eb6ea]">
            Pengumuman
          </p>
          <p className="mt-1 font-bold text-[#0b2a4a]">{announcement.title}</p>
          <p className="mt-1 text-sm text-slate-600">{announcement.body}</p>
        </Card>
      )}

      {isAdmin && (pendingMembers > 0 || pendingFees > 0) && (
        <Link href="/club">
          <Card className="mb-4 border-amber-300 bg-amber-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-amber-900">Perlu ditinjau</p>
                <p className="text-sm text-amber-800/80">
                  {pendingMembers} member · {pendingFees} bukti iuran
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-amber-700" />
            </div>
          </Card>
        </Link>
      )}

      {isMember && feeDue && (
        <Link href="/profile/iuran">
          <Card className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Iuran
              </p>
              <p className="font-bold text-[#0b2a4a]">{feeDue.period.label}</p>
              <p className="text-sm text-slate-500">
                {formatRp(feeDue.period.amount)}
              </p>
            </div>
            <Badge
              className={
                feeDue.status === "VERIFIED"
                  ? "bg-emerald-100 text-emerald-700"
                  : feeDue.status === "SUBMITTED"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
              }
            >
              {feeDue.status}
            </Badge>
          </Card>
        </Link>
      )}

      {pendingMatches.length > 0 && (
        <Card className="mb-4 border-rose-200 bg-rose-50">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-bold text-rose-900">Konfirmasi match</p>
            <Link href="/play" className="text-xs font-bold text-[#2eb6ea]">
              Buka Play
            </Link>
          </div>
          {pendingMatches.map((p) => (
            <p key={p.id} className="text-sm text-rose-800">
              Skor {p.match.score}
            </p>
          ))}
        </Card>
      )}

      {/* Leaderboard rich */}
      <section className="mb-5">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-[#0b2a4a]">
              <Trophy className="h-5 w-5 text-[#2eb6ea]" /> Leaderboard
            </h2>
            <p className="text-xs text-slate-500">
              Winrate dari match yang sudah dikonfirmasi
              {myRank ? ` · peringkatmu #${myRank}` : ""}
            </p>
          </div>
          <Link href={isMember ? "/play" : "/?login=1&next=/play"} className="text-xs font-bold text-[#2eb6ea]">
            Full stats
          </Link>
        </div>

        {podium.length > 0 && (
          <div className="mb-3 grid grid-cols-3 items-end gap-2">
            {[podium[1], podium[0], podium[2]].map((row, visualIdx) => {
              if (!row) return <div key={visualIdx} />;
              const rank = visualIdx === 0 ? 2 : visualIdx === 1 ? 1 : 3;
              const tall = rank === 1;
              return (
                <Card
                  key={row.userId}
                  className={`text-center ${tall ? "pb-5 pt-4" : "pb-4 pt-3"} ${
                    rank === 1
                      ? "border-[#2eb6ea] bg-gradient-to-b from-[#dff3fc] to-white"
                      : ""
                  }`}
                >
                  <p className="mb-1 text-xs font-black text-[#2eb6ea]">#{rank}</p>
                  <Avatar className={`mx-auto ${tall ? "h-14 w-14" : "h-11 w-11"}`}>
                    <AvatarImage src={row.imageUrl ?? undefined} />
                    <AvatarFallback>{row.nickname.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <p className="mt-2 truncate text-sm font-bold text-[#0b2a4a]">
                    {row.nickname}
                  </p>
                  <p className="score-glow text-lg font-black text-[#2eb6ea]">
                    {row.winrate}%
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {row.wins}W · {row.losses}L · {row.played} games
                  </p>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="space-y-1 p-2">
          {rest.map((row, i) => (
            <div
              key={row.userId}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
                row.userId === userId ? "bg-[#e8f3fb] ring-1 ring-[#2eb6ea]/40" : ""
              }`}
            >
              <span className="w-6 text-center text-sm font-black text-[#2eb6ea]">
                {i + 4}
              </span>
              <Avatar className="h-9 w-9">
                <AvatarImage src={row.imageUrl ?? undefined} />
                <AvatarFallback>{row.nickname.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#0b2a4a]">
                  {row.nickname}
                </p>
                <p className="text-[11px] text-slate-500">
                  {row.wins}W · {row.losses}L · form {row.played}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-[#0b2a4a]">{row.winrate}%</p>
                <p className="text-[10px] text-slate-400">winrate</p>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <p className="p-3 text-sm text-slate-500">Belum ada match confirmed</p>
          )}
        </Card>
      </section>

      {/* Recent matches */}
      <section className="mb-5">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-[#0b2a4a]">
            <Swords className="h-5 w-5 text-[#2eb6ea]" /> Recent matches
          </h2>
        </div>
        <div className="space-y-2">
          {recentMatches.map((m) => {
            const team1 = m.players.filter((p) => p.team === 1);
            const team2 = m.players.filter((p) => p.team === 2);
            const t1Won = team1.some((p) => p.won);
            return (
              <Card key={m.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className="normal-case tracking-normal">{m.type}</Badge>
                    <span className="text-[11px] text-slate-400">
                      {format(m.playedAt, "d MMM", { locale: localeId })}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-bold text-[#0b2a4a]">
                    <span className={t1Won ? "text-[#2eb6ea]" : ""}>
                      {team1.map((p) => p.user.profile?.nickname ?? p.user.name).join(" & ")}
                    </span>
                    <span className="mx-1 font-medium text-slate-400">vs</span>
                    <span className={!t1Won ? "text-[#2eb6ea]" : ""}>
                      {team2.map((p) => p.user.profile?.nickname ?? p.user.name).join(" & ")}
                    </span>
                  </p>
                </div>
                <p className="shrink-0 text-right text-sm font-black text-[#0b2a4a]">
                  {m.score}
                </p>
              </Card>
            );
          })}
          {recentMatches.length === 0 && (
            <Card>
              <p className="text-sm text-slate-500">Belum ada match</p>
            </Card>
          )}
        </div>
      </section>

      {photos.length > 0 && (
        <section className="mb-2">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-black text-[#0b2a4a]">Gallery</h2>
            <Link
              href={isMember ? "/events" : "/?login=1&next=/events"}
              className="text-xs font-bold text-[#2eb6ea]"
            >
              Album event
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((p) => (
              <div
                key={p.id}
                className="relative h-28 w-36 shrink-0 overflow-hidden rounded-[22px] border border-white shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={p.caption ?? p.event.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
