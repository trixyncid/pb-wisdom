"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { MatchType } from "@prisma/client";
import { demoActionResult } from "@/lib/demo/guard";

export async function logMatchAction(input: {
  type: MatchType;
  score: string;
  team1Ids: string[];
  team2Ids: string[];
  winnerTeam: 1 | 2;
  eventId?: string;
  notes?: string;
}) {
  const __demo = demoActionResult();
  if (__demo) return __demo;
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const allIds = [...input.team1Ids, ...input.team2Ids];
  if (new Set(allIds).size !== allIds.length) {
    throw new Error("Duplicate players");
  }
  if (input.type === "SINGLES" && (input.team1Ids.length !== 1 || input.team2Ids.length !== 1)) {
    throw new Error("Singles needs 1v1");
  }
  if (input.type === "DOUBLES" && (input.team1Ids.length !== 2 || input.team2Ids.length !== 2)) {
    throw new Error("Doubles needs 2v2");
  }

  const match = await prisma.match.create({
    data: {
      type: input.type,
      score: input.score,
      eventId: input.eventId || null,
      notes: input.notes,
      loggedById: session.user.id,
      status: "PENDING",
      players: {
        create: [
          ...input.team1Ids.map((userId) => ({
            userId,
            team: 1,
            won: input.winnerTeam === 1,
            confirmed: userId === session.user.id,
          })),
          ...input.team2Ids.map((userId) => ({
            userId,
            team: 2,
            won: input.winnerTeam === 2,
            confirmed: userId === session.user.id,
          })),
        ],
      },
    },
    include: { players: true },
  });

  const others = allIds.filter((id) => id !== session.user.id);
  if (others.length) {
    await prisma.notification.createMany({
      data: others.map((userId) => ({
        userId,
        type: "MATCH" as const,
        title: "Konfirmasi hasil match",
        body: `Skor: ${input.score}. Buka tab Play untuk konfirmasi.`,
        href: "/play",
      })),
    });
  }

  // Auto-confirm if admin logged or all players already confirmed (logger only)
  const confirmedCount = match.players.filter((p) => p.confirmed).length;
  if (session.user.role === "ADMIN" || confirmedCount === match.players.length) {
    await prisma.match.update({
      where: { id: match.id },
      data: { status: "CONFIRMED" },
    });
    await prisma.matchPlayer.updateMany({
      where: { matchId: match.id },
      data: { confirmed: true },
    });
  }

  revalidatePath("/play");
  revalidatePath("/");
  return { ok: true, id: match.id };
}

export async function confirmMatchAction(matchId: string, accept: boolean) {
  const __demo = demoActionResult();
  if (__demo) return __demo;
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const player = await prisma.matchPlayer.findUnique({
    where: {
      matchId_userId: { matchId, userId: session.user.id },
    },
  });
  if (!player) throw new Error("Not a player in this match");

  if (!accept) {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "DISPUTED" },
    });
    revalidatePath("/play");
    return { ok: true };
  }

  await prisma.matchPlayer.update({
    where: { id: player.id },
    data: { confirmed: true },
  });

  const players = await prisma.matchPlayer.findMany({ where: { matchId } });
  if (players.every((p) => p.confirmed)) {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "CONFIRMED" },
    });
  }

  revalidatePath("/play");
  revalidatePath("/");
  return { ok: true };
}
