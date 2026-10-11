"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireMember } from "@/lib/authz";
import { ActionError, runAction } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import { parseClubDateEndOfDay } from "@/lib/time";
import { demoActionResult } from "@/lib/demo/guard";

export async function createFeePeriodAction(input: {
  label: string;
  amount: number;
  dueDate: string;
  paymentInstructions: string;
}) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    await requireAdmin();

    const period = await prisma.feePeriod.create({
      data: {
        label: input.label,
        amount: input.amount,
        dueDate: parseClubDateEndOfDay(input.dueDate),
        paymentInstructions: input.paymentInstructions,
      },
    });

    const activeMembers = await prisma.user.findMany({
      where: {
        role: { in: ["MEMBER", "ADMIN"] },
        profile: { status: "ACTIVE" },
      },
      select: { id: true },
    });

    await prisma.feeDue.createMany({
      data: activeMembers.map((m) => ({
        periodId: period.id,
        userId: m.id,
        status: "UNPAID",
      })),
    });

    await prisma.notification.createMany({
      data: activeMembers.map((m) => ({
        userId: m.id,
        type: "IURAN" as const,
        title: `Iuran ${input.label} dibuka`,
        body: `Silakan bayar Rp${input.amount.toLocaleString("id-ID")} sebelum jatuh tempo.`,
        href: "/profile/iuran",
      })),
    });

    revalidatePath("/club/iuran");
    revalidatePath("/profile/iuran");
    revalidatePath("/");
    return { id: period.id };
  });
}

export async function submitFeeProofAction(dueId: string, proofUrl: string) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireMember();

    const due = await prisma.feeDue.findUnique({ where: { id: dueId } });
    if (!due || due.userId !== session.user.id) throw new ActionError("Tagihan tidak ditemukan");

    await prisma.feeDue.update({
      where: { id: dueId },
      data: {
        proofUrl,
        status: "SUBMITTED",
        submittedAt: new Date(),
        rejectReason: null,
      },
    });

    revalidatePath("/profile/iuran");
    revalidatePath("/club/iuran");
    return {};
  });
}

export async function verifyFeeAction(
  dueId: string,
  approve: boolean,
  rejectReason?: string,
) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();

    const due = await prisma.feeDue.update({
      where: { id: dueId },
      data: approve
        ? {
            status: "VERIFIED",
            verifiedById: session.user.id,
            verifiedAt: new Date(),
            rejectReason: null,
          }
        : {
            status: "REJECTED",
            rejectReason: rejectReason || "Bukti ditolak",
            verifiedById: session.user.id,
            verifiedAt: new Date(),
          },
    });

    await prisma.notification.create({
      data: {
        userId: due.userId,
        type: "IURAN",
        title: approve ? "Iuran diverifikasi" : "Bukti iuran ditolak",
        body: approve
          ? "Pembayaranmu sudah dicatat. Terima kasih!"
          : `Alasan: ${rejectReason || "Bukti ditolak"}. Silakan upload ulang.`,
        href: "/profile/iuran",
      },
    });

    revalidatePath("/club/iuran");
    revalidatePath("/profile/iuran");
    revalidatePath("/");
    return {};
  });
}
