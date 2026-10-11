import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLeaderboard } from "@/lib/stats";
import { ensureUpcomingOccurrences } from "@/lib/jobs";
import { startOfClubTodayKey } from "@/lib/time";
import { MemberHome } from "@/components/home/member-home";
import { GuestHome } from "@/components/home/guest-home";
import { eventPhotoUrl } from "@/lib/event-photo";

export default async function HomePage() {
  const session = await auth();
  // Normally done by the daily cron; this only backfills, after the response.
  after(ensureUpcomingOccurrences);

  const userId = session?.user?.id;
  const isMember =
    session?.user?.role === "MEMBER" || session?.user?.role === "ADMIN";

  // Each view fetches only what it renders; guests also get recent matches
  // and photos.
  const [occurrence, leaderboard, guest] = await Promise.all([
    prisma.trainingOccurrence.findFirst({
      where: { date: { gte: startOfClubTodayKey() } },
      orderBy: { date: "asc" },
      include: {
        session: true,
        attendances: {
          where: { status: { in: ["GOING", "ATTENDED"] } },
          select: { userId: true },
        },
      },
    }),
    getLeaderboard("ALL", 10),
    isMember ? null : loadGuestData(),
  ]);
  const { recentMatches, photos, memberCount } = guest ?? EMPTY_GUEST;

  const iAmGoing = Boolean(
    userId && occurrence?.attendances.some((a) => a.userId === userId),
  );
  const nextTraining = occurrence
    ? {
        title: occurrence.session.title,
        date: occurrence.date,
        weekday: occurrence.session.weekday,
        startTime: occurrence.session.startTime,
        venue: occurrence.session.venue,
      }
    : null;
  const goingCount = occurrence?.attendances.length ?? 0;

  if (isMember) {
    return (
      <MemberHome
        firstName={(session?.user?.name ?? "Member").split(" ")[0]}
        occurrence={nextTraining}
        goingCount={goingCount}
        iAmGoing={iAmGoing}
        rows={leaderboard}
        userId={userId}
      />
    );
  }

  const name = (p: (typeof recentMatches)[number]["players"][number]) =>
    p.user.profile?.nickname ?? p.user.name ?? "Player";
  return (
    <GuestHome
      occurrence={nextTraining}
      goingCount={goingCount}
      rows={leaderboard}
      memberCount={memberCount}
      matches={recentMatches.map((m) => ({
        id: m.id,
        type: m.type,
        playedAt: m.playedAt,
        score: m.score,
        team1: m.players.filter((p) => p.team === 1).map(name).join(" & "),
        team2: m.players.filter((p) => p.team === 2).map(name).join(" & "),
        team1Won: m.players.some((p) => p.team === 1 && p.won),
      }))}
      photos={photos.map((p) => ({ id: p.id, imageUrl: eventPhotoUrl(p.id), alt: p.caption ?? p.event.title }))}
    />
  );
}

async function loadGuestData() {
  const [recentMatches, photos, memberCount] = await Promise.all([
    prisma.match.findMany({
      where: { status: "CONFIRMED" },
      take: 5,
      orderBy: { playedAt: "desc" },
      include: {
        players: {
          include: {
            user: { select: { name: true, profile: { select: { nickname: true } } } },
          },
        },
      },
    }),
    prisma.eventPhoto.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { event: { select: { title: true } } },
    }),
    prisma.user.count({ where: { role: { in: ["MEMBER", "ADMIN"] } } }),
  ]);
  return { recentMatches, photos, memberCount };
}

const EMPTY_GUEST: Awaited<ReturnType<typeof loadGuestData>> = {
  recentMatches: [],
  photos: [],
  memberCount: 0,
};
