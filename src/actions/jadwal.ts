"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireMember } from "@/lib/authz";
import { ActionError, runAction } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import type { AttendanceStatus } from "@prisma/client";
import { demoActionResult } from "@/lib/demo/guard";
import { upcomingDatesForWeekday } from "@/lib/time";
import { OCCURRENCE_WEEKS_AHEAD } from "@/lib/jobs";
import { z } from "zod";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const sessionSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Judul wajib diisi").max(80),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(HHMM, "Jam mulai tidak valid"),
  endTime: z.string().regex(HHMM, "Jam selesai tidak valid").optional(),
  venue: z.string().trim().min(1, "Lokasi wajib diisi").max(160),
  notes: z.string().max(500).optional(),
});

export async function upsertTrainingSessionAction(input: z.input<typeof sessionSchema>) {
  return runAction(async () => {
    const demo = demoActionResult({ id: "demo" });
    if (demo) return demo;
    await requireAdmin();
    const { id, ...data } = sessionSchema.parse(input);
    if (data.endTime && data.endTime <= data.startTime) {
      throw new ActionError("Jam selesai harus setelah jam mulai");
    }

    const session = id
      ? await prisma.trainingSession.update({ where: { id }, data, select: { id: true, weekday: true } })
      : await prisma.trainingSession.create({ data, select: { id: true, weekday: true } });

    // Put it on the agenda right away (the daily job keeps it filled).
    await prisma.trainingOccurrence.createMany({
      data: upcomingDatesForWeekday(session.weekday, OCCURRENCE_WEEKS_AHEAD).map((date) => ({
        sessionId: session.id,
        date,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/jadwal");
    revalidatePath("/club/jadwal");
    revalidatePath("/");
    return { id: session.id };
  });
}

/** Pause or resume a weekly session; paused ones disappear from the agenda. */
export async function setTrainingSessionActiveAction(id: string, active: boolean) {
  return runAction(async () => {
    const demo = demoActionResult();
    if (demo) return demo;
    await requireAdmin();
    await prisma.trainingSession.update({ where: { id }, data: { active }, select: { id: true } });
    revalidatePath("/jadwal");
    revalidatePath("/club/jadwal");
    revalidatePath("/");
    return {};
  });
}

export async function setAttendanceAction(
  occurrenceId: string,
  status: AttendanceStatus,
) {
  return runAction(async () => {
    const demo = demoActionResult();
    if (demo) return demo;
    const session = await requireMember();

    await prisma.sessionAttendance.upsert({
      where: {
        occurrenceId_userId: {
          occurrenceId,
          userId: session.user.id,
        },
      },
      create: {
        occurrenceId,
        userId: session.user.id,
        status,
      },
      update: { status },
    });

    revalidatePath("/jadwal");
    return {};
  });
}
