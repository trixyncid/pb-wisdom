"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { demoActionResult } from "@/lib/demo/guard";

export async function createAnnouncementAction(title: string, body: string) {
  const __demo = demoActionResult();
  if (__demo) return __demo;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");

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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/notifications");
  return { ok: true };
}

export async function sendOverdueFeeRemindersAction() {
  const __demo = demoActionResult();
  if (__demo) return __demo;
  const secret = process.env.CRON_SECRET;
  // Called from cron route with secret check

  const now = new Date();
  const periods = await prisma.feePeriod.findMany({
    where: { dueDate: { lt: now } },
    include: {
      dues: {
        where: { status: { in: ["UNPAID", "REJECTED"] } },
      },
    },
  });

  let count = 0;
  for (const period of periods) {
    for (const due of period.dues) {
      await prisma.notification.create({
        data: {
          userId: due.userId,
          type: "IURAN",
          title: `Iuran ${period.label} terlambat`,
          body: "Segera bayar dan upload bukti transfer.",
          href: "/profile/iuran",
        },
      });
      count += 1;
    }
  }

  return { ok: true, count, secretConfigured: Boolean(secret) };
}
