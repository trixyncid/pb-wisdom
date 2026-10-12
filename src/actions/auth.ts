"use server";

import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/authz";
import { ActionError, runAction } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import { demoActionResult } from "@/lib/demo/guard";
import { isDemoMode } from "@/lib/demo/mode";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/phone";
import { logAdmin, memberName } from "@/lib/admin-log";
import { deleteStoredImages, storeImage } from "@/lib/storage";
import { kickOutbox, queueEmails } from "@/lib/email/outbox";
import { emails } from "@/lib/email/templates";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80, "Nama terlalu panjang"),
  email: z.string().email("Email tidak valid").max(254),
  password: z.string().min(8, "Password minimal 8 karakter").max(200, "Password terlalu panjang"),
  inviteCode: z.string().max(40).optional(),
});

export async function registerAction(input: z.infer<typeof registerSchema>) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    if (!rateLimit(`register:ip:${clientIp(await headers())}`, 5, 60 * 60 * 1000)) {
      throw new ActionError("Terlalu banyak percobaan, coba lagi nanti");
    }
    const data = registerSchema.parse(input);
    const email = data.email.toLowerCase();
    const code = data.inviteCode?.trim().toUpperCase() || null;
    const passwordHash = await hash(data.password, 10);

    try {
      await prisma.$transaction(async (tx) => {
        let autoApprove = false;
        if (code) {
          // Check and consume a use in one conditional update, so parallel
          // registrations cannot push remainingUses below zero.
          const used = await tx.invite.updateMany({
            where: {
              code,
              remainingUses: { gt: 0 },
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            data: { remainingUses: { decrement: 1 } },
          });
          if (used.count === 0) {
            throw new ActionError("Kode undangan tidak valid atau sudah habis");
          }
          const invite = await tx.invite.findUnique({
            where: { code },
            select: { autoApprove: true },
          });
          autoApprove = invite?.autoApprove ?? false;
        }

        await tx.user.create({
          data: {
            email,
            name: data.name,
            passwordHash,
            role: autoApprove ? "MEMBER" : "PENDING",
            profile: {
              create: {
                nickname: data.name.split(" ")[0],
                imageUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
              },
            },
          },
          select: { id: true },
        });

        // Someone to approve: tell the admins in the app and by email.
        if (!autoApprove) {
          const admins = await tx.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true, email: true, name: true, profile: { select: { nickname: true } } },
          });
          await tx.notification.createMany({
            data: admins.map((a) => ({
              userId: a.id,
              type: "SYSTEM" as const,
              title: `Pendaftar baru: ${data.name}`,
              body: "Menunggu persetujuan di Club admin → Members.",
              href: "/club/members?tab=menunggu",
            })),
          });
          await queueEmails(
            tx,
            admins.map((a) => ({ to: a.email, kind: "new-signup", ...emails.newSignup(a.profile?.nickname ?? a.name ?? "Admin", { name: data.name, email }) })),
          );
        }
      });
      kickOutbox();
    } catch (err) {
      // The unique index decides, even when two sign-ups race; the transaction
      // also gives back the invite use.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ActionError("Email sudah terdaftar");
      }
      throw err;
    }

    return {};
  });
}

// Avatars are cropped and resized in the browser (256px WebP, ~15-30 KB).
// The cap leaves room for older browsers that fall back to JPEG.
const profileSchema = z.object({
  nickname: z.string().trim().min(1, "Nickname wajib diisi").max(40, "Nickname terlalu panjang"),
  // Omitted: keep the stored number. Empty: clear it.
  phone: z
    .string()
    .max(24)
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "" ? null : normalizePhone(v) || undefined)),
  skill: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  imageUrl: z
    .string()
    .max(200_000, "Foto terlalu besar")
    .regex(/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/, "Format foto tidak valid")
    .optional(),
});

export async function updateProfileAction(input: z.input<typeof profileSchema>) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireUser();
    const data = profileSchema.parse(input);
    const imageUrl = data.imageUrl ? await storeImage("avatar", data.imageUrl) : undefined;
    const previous = imageUrl
      ? await prisma.memberProfile.findUnique({ where: { userId: session.user.id }, select: { imageUrl: true } })
      : null;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.nickname,
        profile: {
          upsert: {
            create: {
              nickname: data.nickname,
              phone: data.phone,
              skill: data.skill,
              imageUrl,
            },
            update: {
              nickname: data.nickname,
              phone: data.phone,
              ...(data.skill ? { skill: data.skill } : {}),
              ...(imageUrl ? { imageUrl } : {}),
            },
          },
        },
      },
      select: { id: true },
    });

    deleteStoredImages([previous?.imageUrl]);
    revalidatePath("/profile");
    revalidatePath("/directory");
    revalidatePath(`/members/${session.user.id}`);
    revalidatePath("/");
    return {};
  });
}

export async function approveMemberAction(userId: string, approve: boolean) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();
    if (userId === session.user.id) {
      throw new ActionError("Kamu tidak bisa mengubah status akunmu sendiri");
    }

    await prisma.$transaction(async (tx) => {
      // Approve/reject is for members only; it must never demote an admin.
      const changed = await tx.user.updateMany({
        // Deleted accounts are anonymised as REJECTED and must stay that way.
        where: { id: userId, role: { not: "ADMIN" }, NOT: { email: { endsWith: "@deleted.invalid" } } },
        // Rejecting also ends any session the account still has.
        data: approve ? { role: "MEMBER" } : { role: "REJECTED", sessionVersion: { increment: 1 } },
      });
      if (changed.count === 0) {
        throw new ActionError("Akun ini tidak bisa diubah");
      }
      const name = await memberName(userId, tx);
      await logAdmin(tx, session.user.id, "MEMBER", approve ? `Menyetujui ${name}` : `Menolak pendaftaran ${name}`, approve ? `/members/${userId}` : undefined);
      if (approve) {
        const member = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, name: true, profile: { select: { nickname: true } } } });
        await queueEmails(tx, [{ to: member.email, kind: "approved", ...emails.approved(member.profile?.nickname ?? member.name ?? "teman") }]);
        await tx.notification.create({
          data: {
            userId,
            type: "SYSTEM",
            title: "Welcome to PB Wisdom!",
            body: "Akunmu sudah disetujui. Selamat bergabung.",
            href: "/",
          },
        });
      }
    });

    kickOutbox();
    revalidatePath("/club");
    revalidatePath("/club/members");
    return {};
  });
}

export async function deactivateMemberAction(userId: string, active: boolean) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    const session = await requireAdmin();
    if (userId === session.user.id) throw new ActionError("Kamu tidak bisa menonaktifkan akunmu sendiri");

    // Members who never filled in their profile have no row yet.
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, role: true } });
    if (!user || (user.role !== "MEMBER" && user.role !== "ADMIN")) throw new ActionError("Member tidak ditemukan");
    const status = active ? "ACTIVE" : "INACTIVE";
    await prisma.$transaction([
      prisma.memberProfile.upsert({
        where: { userId },
        create: { userId, nickname: user.name ?? "Player", status },
        update: { status },
        select: { id: true },
      }),
      logAdmin(prisma, session.user.id, "MEMBER", `${active ? "Mengaktifkan" : "Menonaktifkan"} ${await memberName(userId)}`, `/members/${userId}`),
    ]);

    revalidatePath("/club/members");
    revalidatePath("/directory");
    return {};
  });
}

export async function regenerateInviteAction() {
  return runAction(async () => {
    if (isDemoMode()) {
      return { code: "WISDOM2026" };
    }
    const session = await requireAdmin();

    const code = `WISDOM${randomBytes(4).toString("hex").toUpperCase()}`;
    // Regenerating revokes the previous club codes, otherwise they stay valid.
    const [, invite] = await prisma.$transaction([
      prisma.invite.updateMany({
        where: { type: "CLUB", remainingUses: { gt: 0 } },
        data: { remainingUses: 0 },
      }),
      prisma.invite.create({
        data: {
          code,
          type: "CLUB",
          remainingUses: 50,
          createdById: session.user.id,
        },
      }),
      logAdmin(prisma, session.user.id, "CLUB", `Membuat kode undangan baru ${code}`),
    ]);
    revalidatePath("/club");
    return { code: invite.code };
  });
}
