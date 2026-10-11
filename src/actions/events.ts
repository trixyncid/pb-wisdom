"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireMember } from "@/lib/authz";
import { ActionError, runAction } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import { parseClubDateTime } from "@/lib/time";
import type { EventType, RsvpStatus } from "@prisma/client";
import { demoActionResult } from "@/lib/demo/guard";
import { isDemoMode } from "@/lib/demo/mode";

export async function createEventAction(input: {
  title: string;
  type: EventType;
  startsAt: string;
  endsAt?: string;
  location: string;
  capacity?: number;
  extraFee?: number;
  notes?: string;
}) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    await requireAdmin();

    const event = await prisma.event.create({
      data: {
        title: input.title,
        type: input.type,
        startsAt: parseClubDateTime(input.startsAt),
        endsAt: input.endsAt ? parseClubDateTime(input.endsAt) : null,
        location: input.location,
        capacity: input.capacity,
        extraFee: input.extraFee,
        notes: input.notes,
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
        title: `Event baru: ${input.title}`,
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

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { rsvps: { where: { status: "GOING" } } },
    });
    if (!event) throw new ActionError("Event tidak ditemukan");

    let finalStatus = status;
    if (
      status === "GOING" &&
      event.capacity &&
      event.rsvps.length >= event.capacity
    ) {
      finalStatus = "WAITLIST";
    }

    await prisma.eventRsvp.upsert({
      where: {
        eventId_userId: { eventId, userId: session.user.id },
      },
      create: {
        eventId,
        userId: session.user.id,
        status: finalStatus,
      },
      update: { status: finalStatus },
    });

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    return { status: finalStatus };
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
