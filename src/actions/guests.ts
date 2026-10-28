"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { ActionError, runAction } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import { demoActionResult } from "@/lib/demo/guard";
import { logAdmin } from "@/lib/admin-log";
import { existingGuest, GUEST_NAME_MAX, guestByName } from "@/lib/guests";

const targetSchema = z.union([
  z.object({ type: z.literal("event"), eventId: z.string().min(1) }),
  z.object({ type: z.literal("training"), occurrenceId: z.string().min(1) }),
]);
export type AgendaTarget = z.input<typeof targetSchema>;

const guestSchema = z.union([
  z.object({ guestId: z.string().min(1) }),
  z.object({ guestName: z.string().trim().min(2, "Nama tamu minimal 2 huruf").max(GUEST_NAME_MAX, "Nama tamu terlalu panjang") }),
]);

function revalidateAgenda(target: z.infer<typeof targetSchema>) {
  revalidatePath("/jadwal");
  revalidatePath("/");
  if (target.type === "event") {
    revalidatePath(`/events/${target.eventId}`);
    revalidatePath("/events");
  }
}

/**
 * Admin: put a guest (non-member) on an event or a training date. A guest
 * on an event takes a seat like anyone else; the admin decides, so a full
 * event does not stop it.
 */
export async function addAgendaGuestAction(targetInput: AgendaTarget, guestInput: z.input<typeof guestSchema>) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();
    const target = targetSchema.parse(targetInput);
    const guest = guestSchema.parse(guestInput);

    try {
      await prisma.$transaction(async (tx) => {
        const guestId = "guestId" in guest ? await existingGuest(tx, guest.guestId) : await guestByName(tx, guest.guestName, session.user.id);
        const { name } = await tx.guest.findUniqueOrThrow({ where: { id: guestId }, select: { name: true } });
        if (target.type === "event") {
          const event = await tx.event.findUnique({ where: { id: target.eventId }, select: { title: true } });
          if (!event) throw new ActionError("Event tidak ditemukan");
          await tx.eventRsvp.create({ data: { eventId: target.eventId, guestId, status: "GOING" }, select: { id: true } });
          await logAdmin(tx, session.user.id, "AGENDA", `Menambahkan tamu ${name} ke "${event.title}"`, `/events/${target.eventId}`);
        } else {
          const occurrence = await tx.trainingOccurrence.findUnique({ where: { id: target.occurrenceId }, select: { session: { select: { title: true } } } });
          if (!occurrence) throw new ActionError("Jadwal latihan tidak ditemukan");
          await tx.sessionAttendance.create({ data: { occurrenceId: target.occurrenceId, guestId, status: "GOING" }, select: { id: true } });
          await logAdmin(tx, session.user.id, "AGENDA", `Menambahkan tamu ${name} ke latihan "${occurrence.session.title}"`, "/jadwal");
        }
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ActionError("Tamu ini sudah ada di daftar");
      }
      throw err;
    }

    revalidateAgenda(target);
    return {};
  });
}

/** Admin: take a guest off an event or training date. */
export async function removeAgendaGuestAction(targetInput: AgendaTarget, rowId: string) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();
    const target = targetSchema.parse(targetInput);

    await prisma.$transaction(async (tx) => {
      if (target.type === "event") {
        // Same lock as RSVP, so a freed seat is handed out once.
        const locked = await tx.$queryRaw<{ capacity: number | null; title: string }[]>`
          SELECT "capacity", "title" FROM "Event" WHERE "id" = ${target.eventId} FOR UPDATE
        `;
        const event = locked[0];
        if (!event) throw new ActionError("Event tidak ditemukan");
        const row = await tx.eventRsvp.findFirst({
          where: { id: rowId, eventId: target.eventId, guestId: { not: null } },
          select: { status: true, guest: { select: { name: true } } },
        });
        if (!row) throw new ActionError("Tamu tidak ditemukan");
        await tx.eventRsvp.delete({ where: { id: rowId } });

        if (row.status === "GOING" && event.capacity != null) {
          const going = await tx.eventRsvp.count({ where: { eventId: target.eventId, status: "GOING" } });
          const next =
            going < event.capacity
              ? await tx.eventRsvp.findFirst({ where: { eventId: target.eventId, status: "WAITLIST" }, orderBy: { updatedAt: "asc" }, select: { id: true, userId: true } })
              : null;
          if (next) {
            await tx.eventRsvp.update({ where: { id: next.id }, data: { status: "GOING" } });
            if (next.userId) {
              await tx.notification.create({
                data: {
                  userId: next.userId,
                  type: "EVENT",
                  title: `Kamu dapat tempat di ${event.title}`,
                  body: "Ada slot kosong, RSVP-mu sekarang GOING.",
                  href: `/events/${target.eventId}`,
                },
              });
            }
          }
        }
        await logAdmin(tx, session.user.id, "AGENDA", `Menghapus tamu ${row.guest?.name ?? ""} dari "${event.title}"`, `/events/${target.eventId}`);
      } else {
        const row = await tx.sessionAttendance.findFirst({
          where: { id: rowId, occurrenceId: target.occurrenceId, guestId: { not: null } },
          select: { guest: { select: { name: true } }, occurrence: { select: { session: { select: { title: true } } } } },
        });
        if (!row) throw new ActionError("Tamu tidak ditemukan");
        await tx.sessionAttendance.delete({ where: { id: rowId } });
        await logAdmin(tx, session.user.id, "AGENDA", `Menghapus tamu ${row.guest?.name ?? ""} dari latihan "${row.occurrence.session.title}"`, "/jadwal");
      }
    });

    revalidateAgenda(target);
    return {};
  });
}
