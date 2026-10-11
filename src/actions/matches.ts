"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/authz";
import { ActionError, runAction } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import { demoActionResult } from "@/lib/demo/guard";

const playerId = z.string().min(1, "Pilih semua pemain");

const matchSchema = z.object({
  type: z.enum(["SINGLES", "DOUBLES"]),
  // One to three games, e.g. "21-19, 18-21, 21-15".
  score: z
    .string()
    .trim()
    .regex(/^\d{1,2}-\d{1,2}(\s*,\s*\d{1,2}-\d{1,2}){0,2}$/, "Format skor: 21-19, 21-17"),
  team1Ids: z.array(playerId).min(1).max(2),
  team2Ids: z.array(playerId).min(1).max(2),
  winnerTeam: z.union([z.literal(1), z.literal(2)]),
  eventId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

/** Games won by each team; throws if a game is a tie or the winner lost more games. */
function checkScore(score: string, winnerTeam: 1 | 2) {
  let team1 = 0;
  let team2 = 0;
  for (const game of score.split(",")) {
    const [a, b] = game.trim().split("-").map(Number);
    if (a === b) throw new ActionError("Satu game tidak bisa seri");
    if (a > b) team1 += 1;
    else team2 += 1;
  }
  const winnerGames = winnerTeam === 1 ? team1 : team2;
  const loserGames = winnerTeam === 1 ? team2 : team1;
  if (winnerGames <= loserGames) {
    throw new ActionError("Pemenang tidak sesuai dengan skor");
  }
}

export async function logMatchAction(input: z.input<typeof matchSchema>) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireMember();
    const data = matchSchema.parse(input);
    const isAdmin = session.user.role === "ADMIN";

    const size = data.type === "SINGLES" ? 1 : 2;
    if (data.team1Ids.length !== size || data.team2Ids.length !== size) {
      throw new ActionError(
        data.type === "SINGLES" ? "Single harus 1 lawan 1" : "Double harus 2 lawan 2",
      );
    }
    const allIds = [...data.team1Ids, ...data.team2Ids];
    if (new Set(allIds).size !== allIds.length) {
      throw new ActionError("Pemain tidak boleh dobel");
    }
    if (!isAdmin && !allIds.includes(session.user.id)) {
      throw new ActionError("Kamu hanya bisa mencatat match yang kamu mainkan");
    }
    checkScore(data.score, data.winnerTeam);

    const approvedPlayers = await prisma.user.count({
      where: { id: { in: allIds }, role: { in: ["MEMBER", "ADMIN"] } },
    });
    if (approvedPlayers !== allIds.length) {
      throw new ActionError("Semua pemain harus member yang sudah disetujui");
    }

    // Admin entries are trusted and confirmed at once; otherwise every other
    // player has to confirm before the match counts.
    const match = await prisma.$transaction(async (tx) => {
      const created = await tx.match.create({
        data: {
          type: data.type,
          score: data.score,
          eventId: data.eventId || null,
          notes: data.notes,
          loggedById: session.user.id,
          status: isAdmin ? "CONFIRMED" : "PENDING",
          players: {
            create: allIds.map((userId) => {
              const team = data.team1Ids.includes(userId) ? 1 : 2;
              return {
                userId,
                team,
                won: data.winnerTeam === team,
                confirmed: isAdmin || userId === session.user.id,
              };
            }),
          },
        },
        select: { id: true },
      });

      const toConfirm = isAdmin ? [] : allIds.filter((id) => id !== session.user.id);
      if (toConfirm.length) {
        await tx.notification.createMany({
          data: toConfirm.map((userId) => ({
            userId,
            type: "MATCH" as const,
            title: "Konfirmasi hasil match",
            body: `Skor: ${data.score}. Buka tab Play untuk konfirmasi.`,
            href: "/play",
          })),
        });
      }
      return created;
    });

    revalidatePath("/play");
    revalidatePath("/");
    return { id: match.id };
  });
}

export async function confirmMatchAction(matchId: string, accept: boolean) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireMember();

    await prisma.$transaction(async (tx) => {
      // Lock the match so a dispute and the last confirmation cannot race.
      const locked = await tx.$queryRaw<{ status: string }[]>`
        SELECT "status"::text AS "status" FROM "Match" WHERE "id" = ${matchId} FOR UPDATE
      `;
      if (!locked[0]) throw new ActionError("Match tidak ditemukan");
      // Only pending matches can change. Without this, any player could turn a
      // confirmed loss into a dispute and drop it from the leaderboard.
      if (locked[0].status !== "PENDING") {
        throw new ActionError("Match ini sudah tidak menunggu konfirmasi");
      }

      const player = await tx.matchPlayer.findUnique({
        where: { matchId_userId: { matchId, userId: session.user.id } },
        select: { id: true },
      });
      if (!player) throw new ActionError("Kamu bukan pemain di match ini");

      if (!accept) {
        await tx.matchPlayer.update({ where: { id: player.id }, data: { confirmed: false } });
        await tx.match.update({ where: { id: matchId }, data: { status: "DISPUTED" } });
        return;
      }

      await tx.matchPlayer.update({ where: { id: player.id }, data: { confirmed: true } });
      const unconfirmed = await tx.matchPlayer.count({
        where: { matchId, confirmed: false },
      });
      if (unconfirmed === 0) {
        await tx.match.update({ where: { id: matchId }, data: { status: "CONFIRMED" } });
      }
    });

    revalidatePath("/play");
    revalidatePath("/");
    return {};
  });
}
