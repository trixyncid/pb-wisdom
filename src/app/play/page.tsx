import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLeaderboard, getMemberWinrate } from "@/lib/stats";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogMatchForm } from "@/components/play/log-match-form";
import { ConfirmMatchButtons } from "@/components/play/confirm-match-buttons";

export default async function PlayPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [leaderboard, myStats, members, pending, recent] = await Promise.all([
    getLeaderboard("ALL", 30),
    getMemberWinrate(session.user.id),
    prisma.user.findMany({
      where: {
        role: { in: ["MEMBER", "ADMIN"] },
        profile: { status: "ACTIVE" },
      },
      include: { profile: true },
      orderBy: { profile: { nickname: "asc" } },
    }),
    prisma.matchPlayer.findMany({
      where: {
        userId: session.user.id,
        confirmed: false,
        match: { status: "PENDING" },
      },
      include: {
        match: {
          include: {
            players: { include: { user: { include: { profile: true } } } },
          },
        },
      },
    }),
    prisma.match.findMany({
      take: 10,
      orderBy: { playedAt: "desc" },
      include: {
        players: { include: { user: { include: { profile: true } } } },
      },
    }),
  ]);

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#0b2a4a]">Play</h1>
        <p className="text-sm text-slate-400">Catat match & pantau winrate</p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {(
          [
            ["All", myStats.ALL],
            ["Singles", myStats.SINGLES],
            ["Doubles", myStats.DOUBLES],
          ] as const
        ).map(([label, s]) => (
          <Card key={label} className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className="score-glow mt-1 text-2xl font-black text-[#2eb6ea]">
              {s.winrate}%
            </p>
            <p className="text-[11px] text-slate-400">
              {s.wins}W · {s.losses}L
            </p>
          </Card>
        ))}
      </div>

      {pending.length > 0 && (
        <Card className="mb-4 space-y-3 border-amber-200">
          <CardTitle>Konfirmasi match</CardTitle>
          {pending.map((p) => (
            <div key={p.id} className="rounded-xl bg-[#f3f8fc] p-3">
              <p className="text-sm font-medium text-[#0b2a4a]">{p.match.score}</p>
              <p className="mb-2 text-xs text-slate-400">
                {p.match.players
                  .map((x) => x.user.profile?.nickname ?? x.user.name)
                  .join(" · ")}
              </p>
              <ConfirmMatchButtons matchId={p.matchId} />
            </div>
          ))}
        </Card>
      )}

      <Card className="mb-4">
        <CardTitle className="mb-3">Log match baru</CardTitle>
        <LogMatchForm
          members={members.map((m) => ({
            id: m.id,
            label: m.profile?.nickname ?? m.name ?? m.email,
          }))}
          currentUserId={session.user.id}
        />
      </Card>

      <section className="mb-5">
        <h2 className="mb-2 text-lg font-bold text-[#0b2a4a]">Leaderboard</h2>
        <Card className="space-y-1 p-2">
          {leaderboard.map((row, i) => (
            <div
              key={row.userId}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                row.userId === session.user.id ? "bg-cyan-400/15" : ""
              }`}
            >
              <span className="w-6 text-center text-sm font-bold text-[#2eb6ea]">
                {i + 1}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={row.imageUrl ?? undefined} />
                <AvatarFallback>{row.nickname.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0b2a4a]">{row.nickname}</p>
                <p className="text-[11px] text-slate-400">
                  {row.played} matches
                </p>
              </div>
              <p className="font-bold text-[#2eb6ea]">{row.winrate}%</p>
            </div>
          ))}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-[#0b2a4a]">Recent matches</h2>
        <div className="space-y-2">
          {recent.map((m) => (
            <Card key={m.id} className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#0b2a4a]">{m.score}</p>
                <p className="text-xs text-slate-400">
                  {m.players
                    .map((p) => p.user.profile?.nickname ?? p.user.name)
                    .join(" vs ")}
                </p>
              </div>
              <Badge
                className={
                  m.status === "CONFIRMED"
                    ? "bg-emerald-100 text-emerald-700"
                    : m.status === "DISPUTED"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-400/15 text-amber-700"
                }
              >
                {m.status}
              </Badge>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
