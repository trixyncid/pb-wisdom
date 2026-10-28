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
import { formatClub } from "@/lib/time";
import { id as localeId } from "date-fns/locale";
import { logAdmin, memberName } from "@/lib/admin-log";
import { AGENDA_KINDS } from "@/lib/agenda";
import { deleteStoredImages, storeImage } from "@/lib/storage";

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
    const session = await requireAdmin();
    const data = eventSchema.parse(input);

    const startsAt = parseClubDateTime(data.startsAt);
    const endsAt = data.endsAt ? parseClubDateTime(data.endsAt) : null;
    if (endsAt && endsAt <= startsAt) throw new ActionError("Waktu selesai harus setelah mulai");

    const event = await prisma.event.create({
      data: {
        title: data.title,
        type: data.type,
        startsAt,
        endsAt,
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
    await logAdmin(prisma, session.user.id, "AGENDA", `Menambahkan ${AGENDA_KINDS[data.type].label.toLowerCase()} "${data.title}"`, `/events/${event.id}`);

    revalidatePath("/events");
    revalidatePath("/jadwal");
    revalidatePath("/club/jadwal");
    revalidatePath("/");
    return { id: event.id };
  });
}

/**
 * Admin: change an event. Members who RSVP'd hear about a new time or place,
 * and a bigger quota moves people off the waitlist in the order they joined.
 */
export async function updateEventAction(eventId: string, input: z.input<typeof eventSchema>) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();
    const data = eventSchema.parse(input);
    const startsAt = parseClubDateTime(data.startsAt);
    const endsAt = data.endsAt ? parseClubDateTime(data.endsAt) : null;
    if (endsAt && endsAt <= startsAt) throw new ActionError("Waktu selesai harus setelah mulai");

    await prisma.$transaction(async (tx) => {
      // Same lock as RSVP, so seats are not handed out twice meanwhile.
      const locked = await tx.$queryRaw<{ startsAt: Date; location: string }[]>`
        SELECT "startsAt", "location" FROM "Event" WHERE "id" = ${eventId} FOR UPDATE
      `;
      const before = locked[0];
      if (!before) throw new ActionError("Event tidak ditemukan");

      await tx.event.update({
        where: { id: eventId },
        data: {
          title: data.title,
          type: data.type,
          startsAt,
          endsAt,
          location: data.location,
          capacity: data.capacity ?? null,
          extraFee: data.extraFee ?? null,
          notes: data.notes ?? null,
        },
        select: { id: true },
      });

      // The form works in whole minutes.
      const moved = Math.floor(before.startsAt.getTime() / 60_000) !== Math.floor(startsAt.getTime() / 60_000);
      const relocated = before.location !== data.location;
      if (moved || relocated) {
        const attendees = await tx.eventRsvp.findMany({ where: { eventId, status: { in: ["GOING", "WAITLIST"] }, userId: { not: null } }, select: { userId: true } });
        const what = [
          moved && formatClub(startsAt, "EEEE d MMM, HH:mm", { locale: localeId }),
          relocated && data.location,
        ].filter(Boolean).join(" · ");
        await tx.notification.createMany({
          data: attendees.flatMap((a) => (a.userId ? [a.userId] : [])).map((userId) => ({
            userId,
            type: "EVENT" as const,
            title: `${data.title} berubah`,
            body: `Jadwal baru: ${what}`,
            href: `/events/${eventId}`,
          })),
        });
      }

      const going = await tx.eventRsvp.count({ where: { eventId, status: "GOING" } });
      const free = data.capacity == null ? Infinity : data.capacity - going;
      if (free > 0) {
        const promoted = await tx.eventRsvp.findMany({
          where: { eventId, status: "WAITLIST" },
          orderBy: { updatedAt: "asc" },
          take: Number.isFinite(free) ? free : undefined,
          select: { id: true, userId: true },
        });
        if (promoted.length) {
          await tx.eventRsvp.updateMany({ where: { id: { in: promoted.map((p) => p.id) } }, data: { status: "GOING" } });
          await tx.notification.createMany({
            data: promoted.flatMap((p) => (p.userId ? [p.userId] : [])).map((userId) => ({
              userId,
              type: "EVENT" as const,
              title: `Kamu dapat tempat di ${data.title}`,
              body: "Kuota ditambah, RSVP-mu sekarang GOING.",
              href: `/events/${eventId}`,
            })),
          });
        }
      }
      await logAdmin(tx, session.user.id, "AGENDA", `Mengubah event "${data.title}"`, `/events/${eventId}`);
    });

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath("/jadwal");
    revalidatePath("/club/jadwal");
    revalidatePath("/");
    return { id: eventId };
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
          if (next.userId) await tx.notification.create({
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
    revalidatePath("/jadwal");
    return { status: result.status };
  });
}

// Photos are shrunk in the browser (<=1600px WebP/JPEG); the cap keeps the
// request under the 1 MB Server Action body limit.
const photoSchema = z.object({
  image: z
    .string()
    .max(900_000, "Foto terlalu besar")
    .regex(/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/, "Format foto tidak valid"),
  caption: z.string().trim().max(140, "Caption terlalu panjang").optional(),
});

export async function addEventPhotoAction(eventId: string, image: string, caption?: string) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireMember();
    const data = photoSchema.parse({ image, caption: caption || undefined });
    // Check first, so nothing is uploaded for an event that is gone.
    if (!(await prisma.event.count({ where: { id: eventId } }))) throw new ActionError("Event tidak ditemukan");
    const imageUrl = await storeImage("gallery", data.image);

    await prisma.eventPhoto.create({
      data: {
        eventId,
        uploaderId: session.user.id,
        imageUrl,
        caption: data.caption,
      },
      select: { id: true },
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

    const photo = await prisma.eventPhoto.findUnique({
      where: { id: photoId },
      select: { eventId: true, uploaderId: true, imageUrl: true },
    });
    if (!photo) throw new ActionError("Foto tidak ditemukan");
    if (photo.uploaderId !== session.user.id && session.user.role !== "ADMIN") {
      throw new ActionError("Kamu tidak punya akses untuk ini");
    }

    await prisma.eventPhoto.delete({ where: { id: photoId }, select: { id: true } });
    deleteStoredImages([photo.imageUrl]);
    if (photo.uploaderId !== session.user.id) {
      await logAdmin(prisma, session.user.id, "AGENDA", `Menghapus foto album dari ${await memberName(photo.uploaderId)}`, `/events/${photo.eventId}`);
    }
    revalidatePath(`/events/${photo.eventId}`);
    revalidatePath("/");
    return {};
  });
}

/** Remove an event (and its RSVPs and photos). Admin only. */
export async function deleteEventAction(eventId: string) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true, photos: { select: { imageUrl: true } } },
    });
    if (!event) throw new ActionError("Event tidak ditemukan");
    await prisma.$transaction([
      prisma.event.delete({ where: { id: eventId }, select: { id: true } }),
      logAdmin(prisma, session.user.id, "AGENDA", `Menghapus event "${event.title}"`),
    ]);
    deleteStoredImages(event.photos.map((p) => p.imageUrl));
    revalidatePath("/jadwal");
    revalidatePath("/events");
    revalidatePath("/club/jadwal");
    revalidatePath("/");
    return {};
  });
}

/** Admin: mark a participant's event fee as paid (or undo). */
export async function setEventFeePaidAction(rsvpId: string, paid: boolean) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();

    const rsvp = await prisma.eventRsvp.findUnique({
      where: { id: rsvpId },
      select: { userId: true, guest: { select: { name: true } }, paidAt: true, event: { select: { id: true, title: true, extraFee: true } } },
    });
    if (!rsvp) throw new ActionError("Peserta tidak ditemukan");
    if (!rsvp.event.extraFee) throw new ActionError("Event ini tidak berbayar");
    if (Boolean(rsvp.paidAt) === paid) return {};
    const who = rsvp.userId ? await memberName(rsvp.userId) : `${rsvp.guest?.name ?? "tamu"} (tamu)`;

    await prisma.$transaction([
      prisma.eventRsvp.update({ where: { id: rsvpId }, data: { paidAt: paid ? new Date() : null } }),
      logAdmin(
        prisma,
        session.user.id,
        "AGENDA",
        `${paid ? "Mencatat" : "Membatalkan"} pembayaran ${who} untuk "${rsvp.event.title}"`,
        `/events/${rsvp.event.id}`,
      ),
      ...(paid && rsvp.userId
        ? [
            prisma.notification.create({
              data: {
                userId: rsvp.userId,
                type: "EVENT",
                title: "Pembayaran event diterima",
                body: `Biaya ${rsvp.event.title} sudah dicatat lunas.`,
                href: `/events/${rsvp.event.id}`,
              },
            }),
          ]
        : []),
    ]);

    revalidatePath(`/events/${rsvp.event.id}`);
    return {};
  });
}
