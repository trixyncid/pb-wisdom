"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireMember } from "@/lib/authz";
import { ActionError, runAction } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import { demoActionResult } from "@/lib/demo/guard";
import { formatGames, matchResult, MAX_BEST_OF, type GameScore } from "@/lib/badminton";
import { REPORT_WINDOW_DAYS } from "@/lib/match-report";
import { logAdmin } from "@/lib/admin-log";
import { participant, participantName } from "@/lib/people";
import { existingGuest, guestByName } from "@/lib/guests";

// A member, a guest picked from earlier matches, or a new guest by name.
const playerSlot = z.union([
  z.object({ userId: z.string().min(1, "Pilih semua pemain") }),
  z.object({ guestId: z.string().min(1, "Pilih semua pemain") }),
  z.object({ guestName: z.string().trim().min(2, "Nama tamu minimal 2 huruf").max(60, "Nama tamu terlalu panjang") }),
]);
export type PlayerSlot = z.input<typeof playerSlot>;

const matchSchema = z.object({
  type: z.enum(["SINGLES", "DOUBLES"]),
  team1: z.array(playerSlot).min(1).max(2),
  team2: z.array(playerSlot).min(1).max(2),
  ranked: z.boolean().default(true),
  // Best of N games (N odd), each to 30.
  bestOf: z.number().int().default(1),
  // Per game, team 1 first: [[30, 27], [28, 30], [30, 25]].
  games: z.array(z.tuple([z.number().int(), z.number().int()])).min(1).max(MAX_BEST_OF),
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
    if (data.team1.length !== size || data.team2.length !== size) {
      throw new ActionError(data.type === "SINGLES" ? "Single harus 1 lawan 1" : "Ganda harus 2 lawan 2");
    }
    const slots = [...data.team1.map((p) => ({ ...p, team: 1 })), ...data.team2.map((p) => ({ ...p, team: 2 }))];
    const keys = slots.map((p) => ("userId" in p ? `u:${p.userId}` : "guestId" in p ? `g:${p.guestId}` : `n:${p.guestName.toLowerCase()}`));
    if (new Set(keys).size !== keys.length) throw new ActionError("Pemain tidak boleh dobel");
    const memberIds = slots.flatMap((p) => ("userId" in p ? [p.userId] : []));
    if (memberIds.length === 0) throw new ActionError("Minimal satu pemain harus member");

    const games = data.games as GameScore[];
    const result = matchResult(games, data.bestOf);
    if ("error" in result) throw new ActionError(result.error);

    const approvedPlayers = await prisma.user.count({
      where: { id: { in: memberIds }, role: { in: ["MEMBER", "ADMIN"] } },
    });
    if (approvedPlayers !== memberIds.length) {
      throw new ActionError("Pemain member harus yang sudah disetujui");
    }

    const match = await prisma.$transaction(async (tx) => {
      const players = [];
      for (const slot of slots) {
        const base = { team: slot.team, won: result.winner === slot.team, confirmed: isAdmin };
        if ("userId" in slot) players.push({ ...base, userId: slot.userId });
        else players.push({ ...base, guestId: "guestId" in slot ? await existingGuest(tx, slot.guestId) : await guestByName(tx, slot.guestName, session.user.id) });
      }
      // Two new names can resolve to the same saved guest.
      const guestIds = players.flatMap((p) => ("guestId" in p ? [p.guestId] : []));
      if (new Set(guestIds).size !== guestIds.length) throw new ActionError("Pemain tidak boleh dobel");

      const created = await tx.match.create({
        data: {
          type: data.type,
          score: formatGames(games),
          ranked: data.ranked,
          eventId: data.eventId || null,
          notes: data.notes,
          loggedById: session.user.id,
          status: isAdmin ? "CONFIRMED" : "PENDING",
          players: { create: players },
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
              body: `${data.type === "SINGLES" ? "Single" : "Ganda"} · ${formatGames(games)}${data.ranked ? "" : " · tidak masuk leaderboard"}`,
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

/**
 * A player reports a wrong score on a verified match. It leaves the
 * leaderboard until an admin keeps or deletes it. Once per match, within
 * REPORT_WINDOW_DAYS, so a result cannot be disputed forever.
 */
export async function reportMatchAction(matchId: string, reason: string) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireMember();
    const text = z.string().trim().min(5, "Tulis singkat apa yang salah").max(300, "Maksimal 300 karakter").parse(reason);

    await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ status: string; score: string; playedAt: Date; disputeReason: string | null }[]>`
        SELECT "status"::text AS "status", "score", "playedAt", "disputeReason" FROM "Match" WHERE "id" = ${matchId} FOR UPDATE
      `;
      const match = locked[0];
      if (!match) throw new ActionError("Match tidak ditemukan");
      const player = await tx.matchPlayer.findUnique({
        where: { matchId_userId: { matchId, userId: session.user.id } },
        select: { id: true },
      });
      if (!player) throw new ActionError("Hanya pemain di match ini yang bisa melapor");
      if (match.status !== "CONFIRMED") throw new ActionError("Match ini sedang ditinjau admin");
      if (match.disputeReason) throw new ActionError("Match ini sudah pernah dilaporkan dan dicek admin");
      if (match.playedAt.getTime() < Date.now() - REPORT_WINDOW_DAYS * 86_400_000) {
        throw new ActionError(`Laporan hanya bisa dalam ${REPORT_WINDOW_DAYS} hari setelah match`);
      }

      await tx.match.update({
        where: { id: matchId },
        data: { status: "DISPUTED", disputeReason: text, disputedById: session.user.id, disputedAt: new Date() },
      });
      const admins = await tx.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      if (admins.length) {
        await tx.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: "MATCH" as const,
            title: "Skor match dilaporkan salah",
            body: `${match.score} · "${text}"`,
            href: "/play",
          })),
        });
      }
    });

    revalidateMatches();
    return {};
  });
}

/**
 * Admin verdict on a recorded match: count it, or reject (delete) it. For a
 * reported match, APPROVE keeps the score as it was.
 */
export async function reviewMatchAction(matchId: string, decision: "APPROVE" | "REJECT", ranked?: boolean) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();
    if (decision !== "APPROVE" && decision !== "REJECT") throw new ActionError("Keputusan tidak valid");

    await prisma.$transaction(async (tx) => {
      // Lock the row so two admins cannot decide the same match at once.
      const locked = await tx.$queryRaw<{ status: string; score: string; loggedById: string; disputedById: string | null }[]>`
        SELECT "status"::text AS "status", "score", "loggedById", "disputedById" FROM "Match" WHERE "id" = ${matchId} FOR UPDATE
      `;
      const match = locked[0];
      if (!match) throw new ActionError("Match tidak ditemukan");
      if (match.status === "CONFIRMED") throw new ActionError("Match ini sudah diverifikasi");

      const players = await tx.matchPlayer.findMany({
        where: { matchId },
        select: { userId: true, team: true, ...participant },
      });
      const notify = players.flatMap((p) => (p.userId ? [p.userId] : []));
      const disputed = match.status === "DISPUTED";
      const side = (t: number) => players.filter((p) => p.team === t).map(participantName).join(" & ");
      const label = `${side(1)} vs ${side(2)} (${match.score})`;
      await logAdmin(
        tx,
        session.user.id,
        "MATCH",
        disputed
          ? decision === "APPROVE"
            ? `Mempertahankan skor yang dilaporkan: ${label}`
            : `Menghapus match yang dilaporkan: ${label}`
          : decision === "APPROVE"
            ? `Mengesahkan ${label}`
            : `Menolak skor ${label}`,
        disputed && decision === "REJECT" ? undefined : "/play",
      );

      if (disputed) {
        if (decision === "APPROVE") {
          await tx.match.update({ where: { id: matchId }, data: { status: "CONFIRMED" } });
        } else {
          await tx.match.delete({ where: { id: matchId } });
        }
        await tx.notification.createMany({
          data: notify.map((userId) => ({
            userId,
            type: "MATCH" as const,
            title: decision === "APPROVE" ? "Laporan skor dicek: skor tetap" : "Match yang dilaporkan dihapus",
            body:
              decision === "APPROVE"
                ? `Admin menyatakan skor ${match.score} sudah benar.`
                : `Skor ${match.score} dihapus. Catat ulang dengan skor yang benar.`,
            href: "/play",
          })),
        });
      } else if (decision === "APPROVE") {
        await tx.matchPlayer.updateMany({ where: { matchId }, data: { confirmed: true } });
        // The admin may flip the recorder's leaderboard choice while approving.
        const counted = await tx.match.update({
          where: { id: matchId },
          data: { status: "CONFIRMED", ...(typeof ranked === "boolean" ? { ranked } : {}) },
          select: { ranked: true },
        });
        await tx.notification.createMany({
          data: notify.map((userId) => ({
            userId,
            type: "MATCH" as const,
            title: "Hasil match disahkan",
            body: counted.ranked ? `Skor ${match.score} masuk leaderboard.` : `Skor ${match.score} disimpan di riwayat (tidak masuk leaderboard).`,
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
