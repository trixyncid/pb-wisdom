"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { runAction } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import { demoActionResult } from "@/lib/demo/guard";

export async function createAnnouncementAction(title: string, body: string) {
  return runAction(async () => {
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
    return {};
  });
}
