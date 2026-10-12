"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { runAction } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import { demoActionResult } from "@/lib/demo/guard";
import { logAdmin } from "@/lib/admin-log";

const announcementSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(100, "Judul maksimal 100 karakter"),
  body: z.string().trim().min(1, "Isi pengumuman wajib diisi").max(2000, "Isi maksimal 2000 karakter"),
});

export async function createAnnouncementAction(title: string, body: string) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();
    const data = announcementSchema.parse({ title, body });

    const members = await prisma.user.findMany({
      where: { role: { in: ["MEMBER", "ADMIN"] } },
      select: { id: true },
    });
    await prisma.$transaction([
      prisma.announcement.create({
        data: { title: data.title, body: data.body, createdById: session.user.id },
      }),
      prisma.notification.createMany({
        data: members.map((m) => ({
          userId: m.id,
          type: "ANNOUNCEMENT" as const,
          title: data.title,
          body: data.body.slice(0, 200),
          href: "/notifications",
        })),
      }),
      logAdmin(prisma, session.user.id, "CLUB", `Mengirim pengumuman "${data.title}" ke ${members.length} member`),
    ]);

    revalidatePath("/");
    revalidatePath("/club");
    return { sent: members.length };
  });
}
