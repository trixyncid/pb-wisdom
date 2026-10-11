"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireMember } from "@/lib/authz";
import { ActionError, runAction } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import { parseClubDateTime } from "@/lib/time";
import { EventType as EventTypeEnum, type RsvpStatus } from "@prisma/client";
import { z } from "zod";
import { demoActionResult } from "@/lib/demo/guard";
import { isDemoMode } from "@/lib/demo/mode";

const eventSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(120),
  type: z.nativeEnum(EventTypeEnum),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  location: z.string().trim().min(1, "Lokasi wajib diisi").max(160),
  capacity: z.number({ error: "Kapasitas harus angka" }).int("Kapasitas harus angka bulat").min(1, "Kapasitas minimal 1").max(1000).optional(),
  extraFee: z.number({ error: "Biaya harus angka" }).int().min(0, "Biaya tidak boleh negatif").optional(),
  notes: z.string().max(2000).optional(),
});

export async function createEventAction(input: z.input<typeof eventSchema>) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    await requireAdmin();
    const data = eventSchema.parse(input);

    const event = await prisma.event.create({
      data: {
        title: data.title,
        type: data.type,
        startsAt: parseClubDateTime(data.startsAt),
        endsAt: data.endsAt ? parseClubDateTime(data.endsAt) : null,
        location: data.location,
        capacity: data.capacity,
        extraFee: data.extraFee,
        notes: data.notes,
      },
    });

    const members = await prisma.user.findMany({
      where: { role: { in: ["MEMBER", "ADMIN"] } },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: members.map((m) => ({
        userId: m.id,
        type: "EVENT" as const,
        title: `Event baru: ${data.title}`,
        body: `Cek detail & RSVP di tab Events.`,
        href: `/events/${event.id}`,
      })),
    });

    revalidatePath("/events");
    revalidatePath("/");
    return { id: event.id };
  });
}

export async function setEventRsvpAction(eventId: string, status: RsvpStatus) {
  return runAction(async () => {
    if (isDemoMode()) {
      return { status };
    }
    const session = await requireMember();
    const userId = session.user.id;

    const result = await prisma.$transaction(async (tx) => {
      // Lock the event row so concurrent RSVPs are counted one at a time and
      // the last seat cannot be given out twice.
      const locked = await tx.$queryRaw<{ capacity: number | null; title: string }[]>`
        SELECT "capacity", "title" FROM "Event" WHERE "id" = ${eventId} FOR UPDATE
      `;
      const event = locked[0];
      if (!event) throw new ActionError("Event tidak ditemukan");

      const existing = await tx.eventRsvp.findUnique({
        where: { eventId_userId: { eventId, userId } },
        select: { status: true },
      });

      let finalStatus: RsvpStatus = status;
      if (status === "GOING" && existing?.status !== "GOING" && event.capacity != null) {
        const others = await tx.eventRsvp.count({
          where: { eventId, status: "GOING", userId: { not: userId } },
        });
        if (others >= event.capacity) finalStatus = "WAITLIST";
      }

      await tx.eventRsvp.upsert({
        where: { eventId_userId: { eventId, userId } },
        create: { eventId, userId, status: finalStatus },
        update: { status: finalStatus },
      });

      // A seat opened up: move the longest-waiting member off the waitlist.
      if (existing?.status === "GOING" && finalStatus !== "GOING" && event.capacity != null) {
        const next = await tx.eventRsvp.findFirst({
          where: { eventId, status: "WAITLIST" },
          orderBy: { updatedAt: "asc" },
          select: { id: true, userId: true },
        });
        if (next) {
          await tx.eventRsvp.update({ where: { id: next.id }, data: { status: "GOING" } });
          await tx.notification.create({
            data: {
              userId: next.userId,
              type: "EVENT",
              title: `Kamu dapat tempat di ${event.title}`,
              body: "Ada slot kosong, RSVP-mu sekarang GOING.",
              href: `/events/${eventId}`,
            },
          });
        }
      }
      return { status: finalStatus };
    });

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    return { status: result.status };
  });
}

export async function addEventPhotoAction(
  eventId: string,
  imageUrl: string,
  caption?: string,
) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireMember();

    await prisma.eventPhoto.create({
      data: {
        eventId,
        uploaderId: session.user.id,
        imageUrl,
        caption,
      },
    });

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/");
    return {};
  });
}

export async function deleteEventPhotoAction(photoId: string) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireMember();

    const photo = await prisma.eventPhoto.findUnique({ where: { id: photoId } });
    if (!photo) throw new ActionError("Foto tidak ditemukan");
    if (photo.uploaderId !== session.user.id && session.user.role !== "ADMIN") {
      throw new ActionError("Kamu tidak punya akses untuk ini");
    }

    await prisma.eventPhoto.delete({ where: { id: photoId } });
    revalidatePath(`/events/${photo.eventId}`);
    revalidatePath("/");
    return {};
  });
}
