// First accounts for a fresh production database: one admin and one member.
// Safe to run again: existing accounts are left alone; anyone who has not set
// a password yet gets a fresh link.
//
//   docker compose -f docker-compose.prod.yml --env-file .env run --rm --no-deps app node prisma/seed-prod.mjs
//
// No passwords are created here. Each account gets a one-time "set password"
// link (the same flow as the admin reset link, valid 24 hours), printed once.
// Override the emails with SEED_ADMIN_EMAIL / SEED_MEMBER_EMAIL.
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const appUrl = (process.env.AUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
const TTL_MS = 24 * 60 * 60 * 1000;

const accounts = [
  { email: process.env.SEED_ADMIN_EMAIL || "admin@gmail.com", nickname: "Admin", role: "ADMIN" },
  { email: process.env.SEED_MEMBER_EMAIL || "randybrilliant68@gmail.com", nickname: "Randy", role: "MEMBER" },
];

async function setPasswordLink(userId) {
  const token = randomBytes(32).toString("base64url");
  const identifier = `password-reset:${userId}`;
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: { identifier, token: createHash("sha256").update(token).digest("hex"), expires: new Date(Date.now() + TTL_MS) },
    }),
  ]);
  return `${appUrl}/reset-password?token=${token}`;
}

async function main() {
  for (const a of accounts) {
    const email = a.email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, passwordHash: true } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: a.nickname, role: a.role, profile: { create: { nickname: a.nickname } } },
        select: { id: true, role: true, passwordHash: true },
      });
      console.log(`created  ${a.role.padEnd(6)} ${email}`);
    } else {
      console.log(`exists   ${user.role.padEnd(6)} ${email}`);
    }
    if (user.passwordHash) {
      console.log("         password already set");
    } else {
      console.log(`         set password (24 h): ${await setPasswordLink(user.id)}`);
    }
  }

  const invite = await prisma.invite.findFirst({ where: { type: "CLUB", remainingUses: { gt: 0 } }, select: { code: true } });
  if (invite) {
    console.log(`invite   ${invite.code}`);
  } else {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
    const code = `WISDOM${randomBytes(4).toString("hex").toUpperCase()}`;
    await prisma.invite.create({ data: { code, type: "CLUB", remainingUses: 50, createdById: admin.id } });
    console.log(`invite   ${code}  (${appUrl}/register?code=${code})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
