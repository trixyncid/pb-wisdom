import { MatchStatus, MatchType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

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

export async function getLeaderboard(
  filter: MatchFilter = "ALL",
  limit = 50,
): Promise<LeaderboardRow[]> {
  const matches = await prisma.match.findMany({
    where: {
      status: MatchStatus.CONFIRMED,
      ...(filter === "ALL" ? {} : { type: filter as MatchType }),
    },
    orderBy: { playedAt: "desc" },
    include: {
      players: {
        include: {
          user: { include: { profile: true } },
        },
      },
    },
  });

  const stats = new Map<
    string,
    {
      userId: string;
      name: string;
      nickname: string;
      imageUrl: string | null;
      wins: number;
      losses: number;
      form: ("W" | "L")[];
    }
  >();

  for (const match of matches) {
    for (const player of match.players) {
      const key = player.userId;
      const existing = stats.get(key) ?? {
        userId: player.userId,
        name: player.user.name ?? player.user.profile?.nickname ?? "Player",
        nickname: player.user.profile?.nickname ?? "Player",
        imageUrl: player.user.profile?.imageUrl ?? player.user.image,
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
      stats.set(key, existing);
    }
  }

  return Array.from(stats.values())
    .map((s) => {
      const played = s.wins + s.losses;
      return {
        ...s,
        played,
        winrate: played === 0 ? 0 : Math.round((s.wins / played) * 1000) / 10,
      };
    })
    .filter((s) => s.played > 0)
    .sort((a, b) => b.winrate - a.winrate || b.wins - a.wins)
    .slice(0, limit);
}

export async function getMemberWinrate(userId: string) {
  const players = await prisma.matchPlayer.findMany({
    where: {
      userId,
      match: { status: MatchStatus.CONFIRMED },
    },
    include: { match: true },
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

  const toRate = (w: number, l: number) => {
    const played = w + l;
    return {
      wins: w,
      losses: l,
      played,
      winrate: played === 0 ? 0 : Math.round((w / played) * 1000) / 10,
    };
  };

  return {
    ALL: toRate(byType.ALL.wins, byType.ALL.losses),
    SINGLES: toRate(byType.SINGLES.wins, byType.SINGLES.losses),
    DOUBLES: toRate(byType.DOUBLES.wins, byType.DOUBLES.losses),
  };
}

export type NotificationCreate = Prisma.NotificationCreateManyInput;
