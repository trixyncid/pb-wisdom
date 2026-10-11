import { MatchStatus, MatchType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { avatarUrl } from "@/lib/avatar";
import { isDemoMode } from "@/lib/demo/mode";

export type LeaderboardRow = {
  userId: string;
  name: string;
  nickname: string;
  imageUrl: string | null;
  wins: number;
  losses: number;
  played: number;
  winrate: number;
  form: ("W" | "L")[];
};

type MatchFilter = "ALL" | "SINGLES" | "DOUBLES";

const toWinrate = (wins: number, played: number) =>
  played === 0 ? 0 : Math.round((wins / played) * 1000) / 10;

/**
 * Ranked by winrate (to one decimal), then wins, then most recent match.
 * Aggregated in Postgres so the cost stays flat as match history grows.
 */
export async function getLeaderboard(
  filter: MatchFilter = "ALL",
  limit = 50,
): Promise<LeaderboardRow[]> {
  if (isDemoMode()) return getLeaderboardInMemory(filter, limit);

  const typeFilter =
    filter === "ALL" ? Prisma.empty : Prisma.sql`AND m."type" = ${filter}::"MatchType"`;

  const rows = await prisma.$queryRaw<
    { userId: string; wins: number; losses: number; form: boolean[] }[]
  >`
    WITH results AS (
      SELECT mp."userId", mp."won", m."playedAt",
             ROW_NUMBER() OVER (PARTITION BY mp."userId" ORDER BY m."playedAt" DESC) AS rn
      FROM "MatchPlayer" mp
      JOIN "Match" m ON m."id" = mp."matchId"
      WHERE m."status" = 'CONFIRMED' AND mp."won" IS NOT NULL ${typeFilter}
    )
    SELECT "userId",
           (COUNT(*) FILTER (WHERE "won"))::int     AS wins,
           (COUNT(*) FILTER (WHERE NOT "won"))::int AS losses,
           COALESCE(array_agg("won" ORDER BY rn) FILTER (WHERE rn <= 5), '{}') AS form
    FROM results
    GROUP BY "userId"
    ORDER BY ROUND(COUNT(*) FILTER (WHERE "won") * 1000.0 / COUNT(*)) DESC,
             wins DESC,
             MAX("playedAt") DESC,
             "userId"
    LIMIT ${limit}
  `;
  if (rows.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: {
      id: true,
      name: true,
      profile: { select: { nickname: true, updatedAt: true } },
    },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return rows.map((r) => {
    const u = byId.get(r.userId);
    const played = r.wins + r.losses;
    return {
      userId: r.userId,
      name: u?.name ?? u?.profile?.nickname ?? "Player",
      nickname: u?.profile?.nickname ?? "Player",
      imageUrl: avatarUrl(r.userId, u?.profile?.updatedAt),
      wins: r.wins,
      losses: r.losses,
      played,
      winrate: toWinrate(r.wins, played),
      form: r.form.map((won) => (won ? "W" : "L")),
    };
  });
}

/** Demo mode only: the in-memory Prisma mock cannot run SQL. */
async function getLeaderboardInMemory(
  filter: MatchFilter,
  limit: number,
): Promise<LeaderboardRow[]> {
  const matches = await prisma.match.findMany({
    where: {
      status: MatchStatus.CONFIRMED,
      ...(filter === "ALL" ? {} : { type: filter as MatchType }),
    },
    orderBy: { playedAt: "desc" },
    include: { players: { include: { user: { include: { profile: true } } } } },
  });

  const stats = new Map<string, Omit<LeaderboardRow, "played" | "winrate">>();
  for (const match of matches) {
    for (const player of match.players) {
      const existing = stats.get(player.userId) ?? {
        userId: player.userId,
        name: player.user.name ?? player.user.profile?.nickname ?? "Player",
        nickname: player.user.profile?.nickname ?? "Player",
        imageUrl: avatarUrl(player.userId),
        wins: 0,
        losses: 0,
        form: [],
      };
      if (player.won === true) {
        existing.wins += 1;
        if (existing.form.length < 5) existing.form.push("W");
      } else if (player.won === false) {
        existing.losses += 1;
        if (existing.form.length < 5) existing.form.push("L");
      }
      stats.set(player.userId, existing);
    }
  }

  return Array.from(stats.values())
    .map((s) => {
      const played = s.wins + s.losses;
      return { ...s, played, winrate: toWinrate(s.wins, played) };
    })
    .filter((s) => s.played > 0)
    .sort((a, b) => b.winrate - a.winrate || b.wins - a.wins)
    .slice(0, limit);
}

export async function getMemberWinrate(userId: string) {
  const players = await prisma.matchPlayer.findMany({
    where: { userId, match: { status: MatchStatus.CONFIRMED } },
    include: { match: { select: { type: true } } },
  });

  const byType = {
    ALL: { wins: 0, losses: 0 },
    SINGLES: { wins: 0, losses: 0 },
    DOUBLES: { wins: 0, losses: 0 },
  };

  for (const p of players) {
    const bucket = byType[p.match.type];
    if (p.won === true) {
      byType.ALL.wins += 1;
      bucket.wins += 1;
    } else if (p.won === false) {
      byType.ALL.losses += 1;
      bucket.losses += 1;
    }
  }

  const toRate = (w: number, l: number) => ({
    wins: w,
    losses: l,
    played: w + l,
    winrate: toWinrate(w, w + l),
  });

  return {
    ALL: toRate(byType.ALL.wins, byType.ALL.losses),
    SINGLES: toRate(byType.SINGLES.wins, byType.SINGLES.losses),
    DOUBLES: toRate(byType.DOUBLES.wins, byType.DOUBLES.losses),
  };
}
