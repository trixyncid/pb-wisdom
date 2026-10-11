import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLeaderboard } from "@/lib/stats";
import { ensureUpcomingOccurrences } from "@/lib/jobs";
import { startOfClubTodayKey } from "@/lib/time";
import { MemberHome } from "@/components/home/member-home";
import { GuestHome } from "@/components/home/guest-home";

export default async function HomePage() {
  const session = await auth();
  // Normally done by the daily cron; this only backfills, after the response.
  after(ensureUpcomingOccurrences);

  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";
  const isMember =
    session?.user?.role === "MEMBER" || session?.user?.role === "ADMIN";

  // Each view fetches only what it renders: members never see recent
  // matches/photos, guests never see fees or pending counts.
  const [occurrence, leaderboard, member, guest] = await Promise.all([
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
    isMember && userId ? loadMemberData(userId, isAdmin) : null,
    isMember ? null : loadGuestData(),
  ]);
  const { announcement, feeDue, pendingMatchCount, pendingMembers, pendingFees } =
    member ?? EMPTY_MEMBER;
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
        isAdmin={isAdmin}
        announcementTitle={announcement?.title ?? null}
        fee={feeDue ? { label: feeDue.period.label, status: feeDue.status } : null}
        occurrence={nextTraining}
        goingCount={goingCount}
        iAmGoing={iAmGoing}
        pendingMatchCount={pendingMatchCount}
        pendingMembers={pendingMembers}
        pendingFees={pendingFees}
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
      photos={photos.map((p) => ({ id: p.id, imageUrl: p.imageUrl, alt: p.caption ?? p.event.title }))}
    />
  );
}

async function loadMemberData(userId: string, isAdmin: boolean) {
  const [announcement, feeDue, pendingMatchCount, pendingMembers, pendingFees] =
    await Promise.all([
      prisma.announcement.findFirst({
        orderBy: { createdAt: "desc" },
        select: { title: true },
      }),
      prisma.feeDue.findFirst({
        where: { userId },
        orderBy: { period: { dueDate: "desc" } },
        include: { period: { select: { label: true } } },
      }),
      prisma.matchPlayer.count({
        where: { userId, confirmed: false, match: { status: "PENDING" } },
      }),
      isAdmin ? prisma.user.count({ where: { role: "PENDING" } }) : 0,
      isAdmin ? prisma.feeDue.count({ where: { status: "SUBMITTED" } }) : 0,
    ]);
  return { announcement, feeDue, pendingMatchCount, pendingMembers, pendingFees };
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

const EMPTY_MEMBER: Awaited<ReturnType<typeof loadMemberData>> = {
  announcement: null,
  feeDue: null,
  pendingMatchCount: 0,
  pendingMembers: 0,
  pendingFees: 0,
};

const EMPTY_GUEST: Awaited<ReturnType<typeof loadGuestData>> = {
  recentMatches: [],
  photos: [],
  memberCount: 0,
};
