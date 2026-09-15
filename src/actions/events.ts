"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { EventType, RsvpStatus } from "@prisma/client";
import { demoActionResult } from "@/lib/demo/guard";
import { isDemoMode } from "@/lib/demo/mode";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

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
  const __demo = demoActionResult();
  if (__demo) return __demo;
  await requireAdmin();

  const event = await prisma.event.create({
    data: {
      title: input.title,
      type: input.type,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
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
  return { ok: true, id: event.id };
}

export async function setEventRsvpAction(eventId: string, status: RsvpStatus) {
  if (isDemoMode()) {
    return { ok: true as const, status };
  }
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { rsvps: { where: { status: "GOING" } } },
  });
  if (!event) throw new Error("Not found");

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
  return { ok: true, status: finalStatus };
}

export async function addEventPhotoAction(
  eventId: string,
  imageUrl: string,
  caption?: string,
) {
  const __demo = demoActionResult();
  if (__demo) return __demo;
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

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
  return { ok: true };
}

export async function deleteEventPhotoAction(photoId: string) {
  const __demo = demoActionResult();
  if (__demo) return __demo;
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const photo = await prisma.eventPhoto.findUnique({ where: { id: photoId } });
  if (!photo) throw new Error("Not found");
  if (photo.uploaderId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  await prisma.eventPhoto.delete({ where: { id: photoId } });
  revalidatePath(`/events/${photo.eventId}`);
  revalidatePath("/");
  return { ok: true };
}
