"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireMember } from "@/lib/authz";
import { prisma } from "@/lib/db";
import type { AttendanceStatus } from "@prisma/client";
import { demoActionResult } from "@/lib/demo/guard";
import { nextDateForWeekday } from "@/lib/jobs";

export async function upsertTrainingSessionAction(input: {
  id?: string;
  title: string;
  weekday: number;
  startTime: string;
  endTime?: string;
  venue: string;
  notes?: string;
}) {
  const demo = demoActionResult({ id: "demo" });
  if (demo) return demo;
  await requireAdmin();

  const session = input.id
    ? await prisma.trainingSession.update({
        where: { id: input.id },
        data: {
          title: input.title,
          weekday: input.weekday,
          startTime: input.startTime,
          endTime: input.endTime,
          venue: input.venue,
          notes: input.notes,
        },
      })
    : await prisma.trainingSession.create({
        data: {
          title: input.title,
          weekday: input.weekday,
          startTime: input.startTime,
          endTime: input.endTime,
          venue: input.venue,
          notes: input.notes,
        },
      });

  const date = nextDateForWeekday(input.weekday);
  await prisma.trainingOccurrence.upsert({
    where: {
      sessionId_date: { sessionId: session.id, date },
    },
    create: { sessionId: session.id, date },
    update: {},
  });

  revalidatePath("/jadwal");
  revalidatePath("/club/jadwal");
  revalidatePath("/");
  return { ok: true, id: session.id };
}

export async function setAttendanceAction(
  occurrenceId: string,
  status: AttendanceStatus,
) {
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
  return { ok: true };
}
