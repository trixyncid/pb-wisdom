"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { demoActionResult } from "@/lib/demo/guard";

export async function createAnnouncementAction(title: string, body: string) {
  const __demo = demoActionResult();
  if (__demo) return __demo;
  const session = await requireAdmin();

  await prisma.announcement.create({
    data: {
      title,
      body,
      createdById: session.user.id,
    },
  });

  const members = await prisma.user.findMany({
    where: { role: { in: ["MEMBER", "ADMIN"] } },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: members.map((m) => ({
      userId: m.id,
      type: "ANNOUNCEMENT" as const,
      title,
      body: body.slice(0, 120),
      href: "/",
    })),
  });

  revalidatePath("/");
  revalidatePath("/club");
  return { ok: true };
}

export async function markNotificationsReadAction() {
  const __demo = demoActionResult();
  if (__demo) return __demo;
  const session = await requireUser();

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/notifications");
  return { ok: true };
}
