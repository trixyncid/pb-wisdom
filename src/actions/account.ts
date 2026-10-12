"use server";

import { createHash, randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { updateSession } from "@/lib/auth";
import { requireAdmin, requireUser } from "@/lib/authz";
import { ActionError, runAction } from "@/lib/action-result";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/db";
import { demoActionResult } from "@/lib/demo/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { startOfClubTodayKey } from "@/lib/time";
import { logAdmin } from "@/lib/admin-log";
import { deleteStoredImages } from "@/lib/storage";
import { processOutbox, queueEmails } from "@/lib/email/outbox";
import { emails } from "@/lib/email/templates";

const RESET_PREFIX = "password-reset:";
const RESET_TTL_MS = 24 * 60 * 60 * 1000;
const newPassword = z.string().min(8, "Password minimal 8 karakter").max(200, "Password terlalu panjang");

// Reset links carry a random token; only its SHA-256 is stored, so a database
// leak does not hand out working links.
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Change your own password. Other devices are signed out; this one stays. */
export async function changePasswordAction(input: { current: string; next: string }) {
  return runAction(async () => {
    const demo = demoActionResult();
    if (demo) return demo;
    const session = await requireUser();
    const data = z.object({ current: z.string().max(200), next: newPassword }).parse(input);
    if (!rateLimit(`pw-change:${session.user.id}`, 5, 15 * 60 * 1000)) {
      throw new ActionError("Terlalu banyak percobaan, coba lagi nanti");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    // Accounts created with Google have no password yet: they can set one.
    if (user?.passwordHash && !(await compare(data.current, user.passwordHash))) {
      throw new ActionError("Password saat ini salah");
    }
    if (data.current && data.current === data.next) throw new ActionError("Password baru harus berbeda");

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: await hash(data.next, 10), sessionVersion: { increment: 1 } },
      select: { id: true },
    });
    // Keep this device signed in with the new session version.
    await updateSession({ refreshSessionVersion: true } as never);
    return {};
  });
}

/** Sign out on every device (including this one) by bumping the session version. */
export async function logoutEverywhereAction() {
  return runAction(async () => {
    const demo = demoActionResult();
    if (demo) return demo;
    const session = await requireUser();
    await prisma.user.update({
      where: { id: session.user.id },
      data: { sessionVersion: { increment: 1 } },
      select: { id: true },
    });
    return {};
  });
}

/** Admin: one-time reset link for a member who forgot their password (24 h). */
export async function createPasswordResetLinkAction(userId: string) {
  return runAction(async () => {
    const demo = demoActionResult({ url: `${appUrl()}/reset-password?token=demo`, phone: null as string | null, name: "Demo" });
    if (demo) return demo;
    const session = await requireAdmin();
    if (userId === session.user.id) throw new ActionError("Untuk akunmu sendiri, pakai Ganti password di Profil");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, profile: { select: { nickname: true, phone: true } } },
    });
    if (!user) throw new ActionError("Member tidak ditemukan");

    const token = randomBytes(32).toString("base64url");
    const identifier = `${RESET_PREFIX}${user.id}`;
    await prisma.$transaction([
      // Only the newest link works.
      prisma.verificationToken.deleteMany({ where: { identifier } }),
      prisma.verificationToken.create({
        data: { identifier, token: tokenHash(token), expires: new Date(Date.now() + RESET_TTL_MS) },
      }),
      logAdmin(prisma, session.user.id, "MEMBER", `Membuat link reset password untuk ${user.profile?.nickname ?? user.name ?? "member"}`, `/members/${user.id}`),
    ]);
    return {
      url: `${appUrl()}/reset-password?token=${token}`,
      phone: user.profile?.phone ?? null,
      name: user.profile?.nickname ?? user.name ?? "member",
    };
  });
}

/**
 * "Lupa password" by email: sends a one-time reset link (24 h) to the
 * address if it belongs to an account. The answer is the same either way and
 * the work happens after the response, so it does not reveal who is a member.
 */
export async function requestPasswordResetEmailAction(rawEmail: string) {
  return runAction(async () => {
    const demo = demoActionResult();
    if (demo) return demo;
    const email = z.string().trim().toLowerCase().email("Email tidak valid").max(254).parse(rawEmail);
    const ip = clientIp(await headers());
    if (!rateLimit(`pw-forgot:ip:${ip}`, 5, 60 * 60 * 1000) || !rateLimit(`pw-forgot:email:${email}`, 3, 60 * 60 * 1000)) {
      throw new ActionError("Terlalu banyak permintaan, coba lagi nanti");
    }

    after(async () => {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, role: true, profile: { select: { nickname: true } } },
      });
      if (!user || user.role === "REJECTED") return;
      const token = randomBytes(32).toString("base64url");
      const identifier = `${RESET_PREFIX}${user.id}`;
      const mail = emails.passwordReset(user.profile?.nickname ?? user.name ?? "teman", `${appUrl()}/reset-password?token=${token}`);
      await prisma.$transaction([
        prisma.verificationToken.deleteMany({ where: { identifier } }),
        prisma.verificationToken.create({
          data: { identifier, token: tokenHash(token), expires: new Date(Date.now() + RESET_TTL_MS) },
        }),
        queueEmails(prisma, [{ to: email, kind: "password-reset", ...mail }]),
      ]);
      await processOutbox(5);
    });
    return {};
  });
}

/** Set a new password from a reset link; signs the account out everywhere. */
export async function resetPasswordAction(input: { token: string; password: string }) {
  return runAction(async () => {
    const demo = demoActionResult();
    if (demo) return demo;
    if (!rateLimit(`pw-reset:ip:${clientIp(await headers())}`, 10, 60 * 60 * 1000)) {
      throw new ActionError("Terlalu banyak percobaan, coba lagi nanti");
    }
    const data = z.object({ token: z.string().min(20).max(200), password: newPassword }).parse(input);

    const row = await prisma.verificationToken.findUnique({ where: { token: tokenHash(data.token) } });
    if (!row || !row.identifier.startsWith(RESET_PREFIX) || row.expires < new Date()) {
      throw new ActionError("Link reset tidak valid atau sudah kedaluwarsa. Minta link baru ke admin.");
    }
    const userId = row.identifier.slice(RESET_PREFIX.length);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await hash(data.password, 10), sessionVersion: { increment: 1 } },
        select: { id: true },
      }),
      prisma.verificationToken.deleteMany({ where: { identifier: row.identifier } }),
    ]);
    return {};
  });
}

/**
 * Delete your account. The row is anonymised instead of removed so other
 * members' match history and the treasurer's fee records stay consistent;
 * everything that identifies you (name, email, phone, photos, login) goes.
 */
export async function deleteAccountAction(input: { password: string; confirm: string }) {
  return runAction(async () => {
    const demo = demoActionResult();
    if (demo) return demo;
    const session = await requireUser();
    const data = z.object({ password: z.string().max(200), confirm: z.string() }).parse(input);
    if (data.confirm.trim().toUpperCase() !== "HAPUS") throw new ActionError('Ketik HAPUS untuk konfirmasi');
    const userId = session.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, passwordHash: true } });
    if (!user) throw new ActionError("Akun tidak ditemukan");
    if (user.passwordHash && !(await compare(data.password, user.passwordHash))) throw new ActionError("Password salah");
    if (user.role === "ADMIN" && (await prisma.user.count({ where: { role: "ADMIN" } })) <= 1) {
      throw new ActionError("Kamu admin terakhir. Jadikan member lain admin dulu.");
    }

    const label = "Mantan member";
    const now = new Date();
    const [images, proofs, photos] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { image: true, profile: { select: { imageUrl: true } } } }),
      prisma.feeDue.findMany({ where: { userId, proofUrl: { not: null } }, select: { proofUrl: true } }),
      prisma.eventPhoto.findMany({ where: { uploaderId: userId }, select: { imageUrl: true } }),
    ]);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          name: label,
          email: `deleted-${userId}@deleted.invalid`,
          emailVerified: null,
          image: null,
          passwordHash: null,
          role: "REJECTED",
          sessionVersion: { increment: 1 },
        },
        select: { id: true },
      }),
      prisma.memberProfile.updateMany({
        where: { userId },
        data: { nickname: label, phone: null, imageUrl: null, notes: null, status: "INACTIVE" },
      }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.verificationToken.deleteMany({ where: { identifier: `${RESET_PREFIX}${userId}` } }),
      prisma.feeDue.updateMany({ where: { userId }, data: { proofUrl: null } }),
      prisma.eventPhoto.deleteMany({ where: { uploaderId: userId } }),
      // Free the seats you held for what is still coming up.
      prisma.eventRsvp.deleteMany({ where: { userId, event: { startsAt: { gt: now } } } }),
      prisma.sessionAttendance.deleteMany({ where: { userId, occurrence: { date: { gte: startOfClubTodayKey() } } } }),
    ]);
    deleteStoredImages([images?.image, images?.profile?.imageUrl, ...proofs.map((d) => d.proofUrl), ...photos.map((p) => p.imageUrl)]);
    return {};
  });
}
