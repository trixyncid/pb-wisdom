"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireMember } from "@/lib/authz";
import { ActionError, runAction } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import { parseClubDateEndOfDay } from "@/lib/time";
import { demoActionResult } from "@/lib/demo/guard";
import { logAdmin, memberName } from "@/lib/admin-log";
import { deleteStoredImages, storeImage } from "@/lib/storage";

const feePeriodSchema = z.object({
  label: z.string().trim().min(1, "Label wajib diisi").max(60),
  amount: z
    .number({ error: "Nominal harus angka" })
    .int("Nominal harus angka bulat")
    .positive("Nominal harus lebih dari 0")
    .max(100_000_000),
  dueDate: z.string(),
  paymentInstructions: z.string().trim().min(1, "Instruksi pembayaran wajib diisi").max(2000),
});

export async function createFeePeriodAction(input: z.input<typeof feePeriodSchema>) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();
    const data = feePeriodSchema.parse(input);
    const dueDate = parseClubDateEndOfDay(data.dueDate);

    const period = await prisma.$transaction(async (tx) => {
      const created = await tx.feePeriod.create({
        data: {
          label: data.label,
          amount: data.amount,
          dueDate,
          paymentInstructions: data.paymentInstructions,
        },
        select: { id: true },
      });

      // Everyone approved except deactivated members. Users without a profile
      // row count as active (they used to be skipped silently).
      const members = await tx.user.findMany({
        where: {
          role: { in: ["MEMBER", "ADMIN"] },
          NOT: { profile: { status: "INACTIVE" } },
        },
        select: { id: true },
      });

      await tx.feeDue.createMany({
        data: members.map((m) => ({ periodId: created.id, userId: m.id, status: "UNPAID" as const })),
      });
      await tx.notification.createMany({
        data: members.map((m) => ({
          userId: m.id,
          type: "IURAN" as const,
          title: `Iuran ${data.label} dibuka`,
          body: `Silakan bayar Rp${data.amount.toLocaleString("id-ID")} sebelum jatuh tempo.`,
          href: "/profile/iuran",
        })),
      });
      await logAdmin(tx, session.user.id, "IURAN", `Membuka iuran ${data.label} (Rp${data.amount.toLocaleString("id-ID")}) untuk ${members.length} member`, `/club/iuran/${created.id}`);
      return created;
    });

    revalidatePath("/club/iuran");
    revalidatePath("/profile/iuran");
    revalidatePath("/");
    return { id: period.id };
  });
}

/**
 * Admin: fix a period's name, due date or payment details. The amount can
 * only change while nobody has paid or sent a proof. Unpaid members are told
 * when the amount or due date changes.
 */
export async function updateFeePeriodAction(periodId: string, input: z.input<typeof feePeriodSchema>) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();
    const data = feePeriodSchema.parse(input);
    const dueDate = parseClubDateEndOfDay(data.dueDate);

    await prisma.$transaction(async (tx) => {
      const before = await tx.feePeriod.findUnique({ where: { id: periodId }, select: { amount: true, dueDate: true } });
      if (!before) throw new ActionError("Periode tidak ditemukan");
      if (data.amount !== before.amount) {
        const started = await tx.feeDue.count({ where: { periodId, status: { in: ["VERIFIED", "SUBMITTED"] } } });
        if (started > 0) throw new ActionError("Nominal tidak bisa diubah: sudah ada yang bayar atau kirim bukti");
      }
      await tx.feePeriod.update({
        where: { id: periodId },
        data: { label: data.label, amount: data.amount, dueDate, paymentInstructions: data.paymentInstructions },
        select: { id: true },
      });

      if (data.amount !== before.amount || dueDate.getTime() !== before.dueDate.getTime()) {
        const unpaid = await tx.feeDue.findMany({ where: { periodId, status: { in: ["UNPAID", "REJECTED"] } }, select: { userId: true } });
        await tx.notification.createMany({
          data: unpaid.map((d) => ({
            userId: d.userId,
            type: "IURAN" as const,
            title: `Iuran ${data.label} diperbarui`,
            body: `Rp${data.amount.toLocaleString("id-ID")}, jatuh tempo ${data.dueDate.split("-").reverse().join("/")}.`,
            href: "/profile/iuran",
          })),
        });
      }
      await logAdmin(tx, session.user.id, "IURAN", `Mengubah periode iuran ${data.label}`, `/club/iuran/${periodId}`);
    });

    revalidatePath(`/club/iuran/${periodId}`);
    revalidatePath("/club/iuran");
    revalidatePath("/profile/iuran");
    return {};
  });
}

// The browser shrinks the photo (max 1600px, WebP/JPEG) before upload. The
// cap keeps the request under the 1 MB Server Action body limit.
const proofImageSchema = z
  .string()
  .max(900_000, "Foto bukti terlalu besar")
  .regex(/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/, "Format foto bukti tidak valid");

export async function submitFeeProofAction(dueId: string, proofImage: string) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireMember();
    const image = proofImageSchema.parse(proofImage);
    const previous = await prisma.feeDue.findFirst({
      where: { id: dueId, userId: session.user.id, status: { in: ["UNPAID", "REJECTED", "SUBMITTED"] } },
      select: { proofUrl: true },
    });
    if (!previous) throw new ActionError("Tagihan tidak ditemukan atau sudah diverifikasi");
    const proofUrl = await storeImage("proof", image);

    // A verified payment is final; re-submitting must not reopen it.
    const updated = await prisma.feeDue.updateMany({
      where: {
        id: dueId,
        userId: session.user.id,
        status: { in: ["UNPAID", "REJECTED", "SUBMITTED"] },
      },
      data: {
        proofUrl,
        status: "SUBMITTED",
        submittedAt: new Date(),
        rejectReason: null,
      },
    });
    if (updated.count === 0) {
      // Verified in the meantime: the new upload is not needed.
      deleteStoredImages([proofUrl]);
      throw new ActionError("Tagihan tidak ditemukan atau sudah diverifikasi");
    }
    deleteStoredImages([previous.proofUrl]);

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
    const reason = rejectReason?.trim().slice(0, 300) || "Bukti ditolak";

    await prisma.$transaction(async (tx) => {
      // Only a submitted proof can be verified or rejected.
      const changed = await tx.feeDue.updateMany({
        where: { id: dueId, status: "SUBMITTED" },
        data: approve
          ? {
              status: "VERIFIED",
              verifiedById: session.user.id,
              verifiedAt: new Date(),
              rejectReason: null,
            }
          : {
              status: "REJECTED",
              rejectReason: reason,
              verifiedById: session.user.id,
              verifiedAt: new Date(),
            },
      });
      if (changed.count === 0) {
        throw new ActionError("Bukti ini sudah diproses atau belum dikirim");
      }
      const row = await tx.feeDue.findUniqueOrThrow({
        where: { id: dueId },
        select: { userId: true, periodId: true, period: { select: { label: true } } },
      });
      const name = await memberName(row.userId, tx);
      await logAdmin(
        tx,
        session.user.id,
        "IURAN",
        approve ? `Memverifikasi iuran ${row.period.label} ${name}` : `Menolak bukti iuran ${row.period.label} ${name}: ${reason}`,
        `/club/iuran/${row.periodId}`,
      );
      await tx.notification.create({
        data: {
          userId: row.userId,
          type: "IURAN",
          title: approve ? "Iuran diverifikasi" : "Bukti iuran ditolak",
          body: approve
            ? "Pembayaranmu sudah dicatat. Terima kasih!"
            : `Alasan: ${reason}. Silakan upload ulang.`,
          href: "/profile/iuran",
        },
      });
    });

    revalidatePath("/club/iuran");
    revalidatePath("/profile/iuran");
    revalidatePath("/");
    return {};
  });
}
