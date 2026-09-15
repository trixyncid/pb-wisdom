"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { demoActionResult } from "@/lib/demo/guard";
import { isDemoMode } from "@/lib/demo/mode";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  inviteCode: z.string().optional(),
});

export async function registerAction(input: z.infer<typeof registerSchema>) {
  const __demo = demoActionResult();
  if (__demo) return __demo;
  const data = registerSchema.parse(input);
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false as const, error: "Email already registered" };
  }

  let autoApprove = false;
  if (data.inviteCode) {
    const invite = await prisma.invite.findUnique({
      where: { code: data.inviteCode.toUpperCase() },
    });
    if (!invite || invite.remainingUses <= 0) {
      return { ok: false as const, error: "Invalid invite code" };
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return { ok: false as const, error: "Invite expired" };
    }
    autoApprove = invite.autoApprove;
    await prisma.invite.update({
      where: { id: invite.id },
      data: { remainingUses: { decrement: 1 } },
    });
  }

  const passwordHash = await hash(data.password, 10);
  await prisma.user.create({
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
  });

  return { ok: true as const };
}

export async function updateProfileAction(input: {
  nickname: string;
  phone?: string;
  imageUrl?: string;
  locale?: string;
}) {
  const __demo = demoActionResult();
  if (__demo) return __demo;
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.memberProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      nickname: input.nickname,
      phone: input.phone,
      imageUrl: input.imageUrl,
    },
    update: {
      nickname: input.nickname,
      phone: input.phone,
      ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
    },
  });

  if (input.locale) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        locale: input.locale,
        name: input.nickname,
        ...(input.imageUrl ? { image: input.imageUrl } : {}),
      },
    });
  } else {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: input.nickname,
        ...(input.imageUrl ? { image: input.imageUrl } : {}),
      },
    });
  }

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/notifications");
  return { ok: true };
}

export async function approveMemberAction(userId: string, approve: boolean) {
  const __demo = demoActionResult();
  if (__demo) return __demo;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");

  await prisma.user.update({
    where: { id: userId },
    data: { role: approve ? "MEMBER" : "REJECTED" },
  });

  if (approve) {
    await prisma.notification.create({
      data: {
        userId,
        type: "SYSTEM",
        title: "Welcome to PB Wisdom!",
        body: "Akunmu sudah disetujui. Selamat bergabung.",
        href: "/",
      },
    });
  }

  revalidatePath("/club");
  revalidatePath("/club/members");
  return { ok: true };
}

export async function deactivateMemberAction(userId: string, active: boolean) {
  const __demo = demoActionResult();
  if (__demo) return __demo;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");

  await prisma.memberProfile.update({
    where: { userId },
    data: { status: active ? "ACTIVE" : "INACTIVE" },
  });

  revalidatePath("/club/members");
  return { ok: true };
}

export async function regenerateInviteAction() {
  if (isDemoMode()) {
    return { ok: true as const, code: "WISDOM2026" };
  }
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");

  const code = `WISDOM${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const invite = await prisma.invite.create({
    data: {
      code,
      type: "CLUB",
      remainingUses: 50,
      createdById: session.user.id,
    },
  });
  revalidatePath("/club");
  return { ok: true, code: invite.code };
}
