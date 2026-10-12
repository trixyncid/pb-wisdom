"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { ActionError, runAction } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import { demoActionResult } from "@/lib/demo/guard";
import { logAdmin, memberName } from "@/lib/admin-log";

/** Make a member admin, or step an admin back to member. Never the last admin. */
export async function setAdminRoleAction(userId: string, admin: boolean) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();
    if (userId === session.user.id) throw new ActionError("Minta admin lain untuk mengubah peranmu");

    await prisma.$transaction(async (tx) => {
      const changed = await tx.user.updateMany({
        where: { id: userId, role: admin ? "MEMBER" : "ADMIN" },
        data: { role: admin ? "ADMIN" : "MEMBER" },
      });
      if (changed.count === 0) throw new ActionError(admin ? "Hanya member aktif yang bisa jadi admin" : "Akun ini bukan admin");
      if (!admin && (await tx.user.count({ where: { role: "ADMIN" } })) < 1) {
        throw new ActionError("Klub harus punya minimal satu admin");
      }
      const name = await memberName(userId, tx);
      await logAdmin(tx, session.user.id, "MEMBER", admin ? `Menjadikan ${name} admin` : `Mencabut peran admin ${name}`, `/members/${userId}`);
      await tx.notification.create({
        data: {
          userId,
          type: "SYSTEM",
          title: admin ? "Kamu sekarang admin PB Wisdom" : "Peran admin dicabut",
          body: admin ? "Menu Club Admin sudah bisa kamu buka dari ikon perisai di atas." : "Akunmu kembali menjadi member biasa.",
          href: admin ? "/club" : "/",
        },
      });
    });

    revalidatePath("/club/members");
    revalidatePath("/directory");
    return {};
  });
}

/** Record a fee paid in cash (or confirmed outside the app) without a proof. */
export async function markDuePaidAction(dueId: string) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();

    const due = await prisma.feeDue.findUnique({ where: { id: dueId }, select: { userId: true, periodId: true, period: { select: { label: true } } } });
    if (!due) throw new ActionError("Tagihan tidak ditemukan");
    await prisma.$transaction(async (tx) => {
      const changed = await tx.feeDue.updateMany({
        where: { id: dueId, status: { not: "VERIFIED" } },
        data: { status: "VERIFIED", verifiedById: session.user.id, verifiedAt: new Date(), rejectReason: null },
      });
      if (changed.count === 0) throw new ActionError("Tagihan ini sudah lunas");
      await logAdmin(tx, session.user.id, "IURAN", `Mencatat iuran ${due.period.label} ${await memberName(due.userId, tx)} lunas tunai`, `/club/iuran/${due.periodId}`);
      await tx.notification.create({
        data: {
          userId: due.userId,
          type: "IURAN",
          title: "Iuran dicatat lunas",
          body: `Iuran ${due.period.label} sudah dicatat lunas oleh admin. Terima kasih!`,
          href: "/profile/iuran",
        },
      });
    });

    revalidatePath(`/club/iuran/${due.periodId}`);
    revalidatePath("/club/iuran");
    revalidatePath("/profile/iuran");
    return {};
  });
}

/** Delete a period opened by mistake. Refused once anyone has paid. */
export async function deleteFeePeriodAction(periodId: string) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();

    const paid = await prisma.feeDue.count({ where: { periodId, status: { in: ["VERIFIED", "SUBMITTED"] } } });
    if (paid > 0) throw new ActionError("Sudah ada yang bayar / kirim bukti; periode tidak bisa dihapus");
    const period = await prisma.feePeriod.findUnique({ where: { id: periodId }, select: { label: true } });
    if (!period) throw new ActionError("Periode tidak ditemukan");
    await prisma.$transaction([
      prisma.feePeriod.delete({ where: { id: periodId }, select: { id: true } }),
      logAdmin(prisma, session.user.id, "IURAN", `Menghapus periode iuran ${period.label}`),
    ]);

    revalidatePath("/club/iuran");
    revalidatePath("/profile/iuran");
    revalidatePath("/");
    return {};
  });
}

export async function deleteAnnouncementAction(id: string) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();
    const ann = await prisma.announcement.findUnique({ where: { id }, select: { title: true } });
    if (!ann) return {};
    await prisma.$transaction([
      prisma.announcement.delete({ where: { id }, select: { id: true } }),
      logAdmin(prisma, session.user.id, "CLUB", `Menghapus pengumuman "${ann.title}"`),
    ]);
    revalidatePath("/club");
    return {};
  });
}
