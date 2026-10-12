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
      });
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
              imageUrl: data.imageUrl,
            },
            update: {
              nickname: data.nickname,
              phone: data.phone,
              ...(data.skill ? { skill: data.skill } : {}),
              ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
            },
          },
        },
      },
      select: { id: true },
    });

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
        where: { id: userId, role: { not: "ADMIN" } },
        // Rejecting also ends any session the account still has.
        data: approve ? { role: "MEMBER" } : { role: "REJECTED", sessionVersion: { increment: 1 } },
      });
      if (changed.count === 0) {
        throw new ActionError("Akun ini tidak bisa diubah");
      }
      if (approve) {
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

    revalidatePath("/club");
    revalidatePath("/club/members");
    return {};
  });
}

export async function deactivateMemberAction(userId: string, active: boolean) {
  return runAction(async () => {
    const __demo = demoActionResult();
    if (__demo) return __demo;
    await requireAdmin();

    await prisma.memberProfile.update({
      where: { userId },
      data: { status: active ? "ACTIVE" : "INACTIVE" },
    });

    revalidatePath("/club/members");
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
    ]);
    revalidatePath("/club");
    return { code: invite.code };
  });
}
