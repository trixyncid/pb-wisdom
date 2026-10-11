"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireMember } from "@/lib/authz";
import { ActionError, runAction } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import { demoActionResult } from "@/lib/demo/guard";
import { formatGames, matchResult, type GameScore } from "@/lib/badminton";

const playerId = z.string().min(1, "Pilih semua pemain");

const matchSchema = z.object({
  type: z.enum(["SINGLES", "DOUBLES"]),
  team1Ids: z.array(playerId).min(1).max(2),
  team2Ids: z.array(playerId).min(1).max(2),
  // Per game, team 1 first: [[21, 19], [18, 21], [21, 15]].
  games: z.array(z.tuple([z.number().int(), z.number().int()])).min(1).max(3),
  eventId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

function revalidateMatches() {
  revalidatePath("/play");
  revalidatePath("/club");
  revalidatePath("/");
}

/**
 * Any approved member can record a match (players or someone keeping score
 * courtside). It counts once an admin verifies it; an admin's own entry
 * counts immediately. The winner follows from the game scores.
 */
export async function logMatchAction(input: z.input<typeof matchSchema>) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireMember();
    const data = matchSchema.parse(input);
    const isAdmin = session.user.role === "ADMIN";

    const size = data.type === "SINGLES" ? 1 : 2;
    if (data.team1Ids.length !== size || data.team2Ids.length !== size) {
      throw new ActionError(data.type === "SINGLES" ? "Single harus 1 lawan 1" : "Ganda harus 2 lawan 2");
    }
    const allIds = [...data.team1Ids, ...data.team2Ids];
    if (new Set(allIds).size !== allIds.length) throw new ActionError("Pemain tidak boleh dobel");

    const games = data.games as GameScore[];
    const result = matchResult(games);
    if ("error" in result) throw new ActionError(result.error);

    const approvedPlayers = await prisma.user.count({
      where: { id: { in: allIds }, role: { in: ["MEMBER", "ADMIN"] } },
    });
    if (approvedPlayers !== allIds.length) {
      throw new ActionError("Semua pemain harus member yang sudah disetujui");
    }

    const match = await prisma.$transaction(async (tx) => {
      const created = await tx.match.create({
        data: {
          type: data.type,
          score: formatGames(games),
          eventId: data.eventId || null,
          notes: data.notes,
          loggedById: session.user.id,
          status: isAdmin ? "CONFIRMED" : "PENDING",
          players: {
            create: allIds.map((userId) => {
              const team = data.team1Ids.includes(userId) ? 1 : 2;
              return { userId, team, won: result.winner === team, confirmed: isAdmin };
            }),
          },
        },
        select: { id: true },
      });

      if (!isAdmin) {
        const admins = await tx.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
        if (admins.length) {
          await tx.notification.createMany({
            data: admins.map((a) => ({
              userId: a.id,
              type: "MATCH" as const,
              title: "Skor baru menunggu verifikasi",
              body: `${data.type === "SINGLES" ? "Single" : "Ganda"} · ${formatGames(games)}`,
              href: "/play",
            })),
          });
        }
      }
      return created;
    });

    revalidateMatches();
    return { id: match.id, status: isAdmin ? ("CONFIRMED" as const) : ("PENDING" as const) };
  });
}

/** Admin verdict on a recorded match: count it, or reject (delete) it. */
export async function reviewMatchAction(matchId: string, decision: "APPROVE" | "REJECT") {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    await requireAdmin();
    if (decision !== "APPROVE" && decision !== "REJECT") throw new ActionError("Keputusan tidak valid");

    await prisma.$transaction(async (tx) => {
      // Lock the row so two admins cannot decide the same match at once.
      const locked = await tx.$queryRaw<{ status: string; score: string; loggedById: string }[]>`
        SELECT "status"::text AS "status", "score", "loggedById" FROM "Match" WHERE "id" = ${matchId} FOR UPDATE
      `;
      const match = locked[0];
      if (!match) throw new ActionError("Match tidak ditemukan");
      if (match.status === "CONFIRMED") throw new ActionError("Match ini sudah diverifikasi");

      const players = await tx.matchPlayer.findMany({ where: { matchId }, select: { userId: true } });

      if (decision === "APPROVE") {
        await tx.matchPlayer.updateMany({ where: { matchId }, data: { confirmed: true } });
        await tx.match.update({ where: { id: matchId }, data: { status: "CONFIRMED" } });
        await tx.notification.createMany({
          data: players.map((p) => ({
            userId: p.userId,
            type: "MATCH" as const,
            title: "Hasil match disahkan",
            body: `Skor ${match.score} masuk leaderboard.`,
            href: "/play",
          })),
        });
      } else {
        await tx.match.delete({ where: { id: matchId } });
        await tx.notification.create({
          data: {
            userId: match.loggedById,
            type: "MATCH",
            title: "Skor match ditolak admin",
            body: `Skor ${match.score} tidak disahkan. Cek lagi dan catat ulang bila perlu.`,
            href: "/play",
          },
        });
      }
    });

    revalidateMatches();
    return {};
  });
}
