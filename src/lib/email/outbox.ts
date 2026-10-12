import { after } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import type { EmailContent } from "@/lib/email/templates";

// Email worker. Callers add messages to the EmailOutbox table (in the same
// transaction as the change they report), then call kickOutbox() so they go
// out right after the response. /api/cron/email runs every 5 minutes and
// retries whatever failed (Resend down, rate limit) with backoff.
//
//   RESEND_API_KEY  without it (local dev) mails are logged and marked SKIPPED
//   EMAIL_FROM      e.g. "PB Wisdom <noreply@trixync.id>", on a verified domain
//   EMAIL_REPLY_TO  optional, e.g. the club's Gmail

const MAX_ATTEMPTS = 5;
const BACKOFF_MIN = [1, 5, 30, 120, 360];
// Resend allows a few requests per second; stay well under it.
const SEND_GAP_MS = 400;

type Db = Pick<typeof prisma, "emailOutbox">;
export type OutgoingEmail = EmailContent & { to: string; kind: string };

/** Skip addresses that cannot receive mail (anonymised deleted accounts). */
const deliverable = (to: string) => !!to && !to.endsWith("@deleted.invalid");

export function queueEmails(db: Db, messages: OutgoingEmail[]) {
  const data = messages.filter((m) => deliverable(m.to)).map(({ to, kind, subject, html, text }) => ({ to, kind, subject, html, text }));
  return db.emailOutbox.createMany({ data });
}

/** Send what is queued once the response is out. Call after the transaction committed. */
export function kickOutbox() {
  after(() => processOutbox(25).catch((err) => console.error("[email] outbox run failed", err)));
}

let resend: Resend | null | undefined;
function client() {
  if (resend === undefined) resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  return resend;
}

/** Send up to `limit` due messages. Safe to run concurrently: each row is claimed first. */
export async function processOutbox(limit = 50) {
  const now = new Date();
  const due = await prisma.emailOutbox.findMany({
    where: { status: "PENDING", sendAfter: { lte: now }, OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true },
  });

  let sent = 0;
  let failed = 0;
  for (const { id } of due) {
    // Claim: only one worker gets the row for the next two minutes.
    const claimed = await prisma.emailOutbox.updateMany({
      where: { id, status: "PENDING", OR: [{ lockedUntil: null }, { lockedUntil: { lt: new Date() } }] },
      data: { lockedUntil: new Date(Date.now() + 2 * 60_000) },
    });
    if (claimed.count === 0) continue;
    const mail = await prisma.emailOutbox.findUniqueOrThrow({ where: { id } });

    const resend = client();
    if (!resend) {
      console.log(`[email] (no RESEND_API_KEY, not sent) to=${mail.to} subject="${mail.subject}"`);
      await prisma.emailOutbox.update({ where: { id }, data: { status: "SKIPPED", lockedUntil: null } });
      continue;
    }

    const { data, error } = await resend.emails
      .send({
        from: process.env.EMAIL_FROM || "PB Wisdom <onboarding@resend.dev>",
        to: mail.to,
        replyTo: process.env.EMAIL_REPLY_TO || undefined,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      })
      .catch((err: unknown) => ({ data: null, error: { message: err instanceof Error ? err.message : String(err) } }));

    if (data && !error) {
      sent += 1;
      await prisma.emailOutbox.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), providerId: data.id, lockedUntil: null, attempts: { increment: 1 } } });
    } else {
      failed += 1;
      const attempts = mail.attempts + 1;
      await prisma.emailOutbox.update({
        where: { id },
        data: {
          attempts,
          lastError: (error?.message ?? "unknown error").slice(0, 500),
          lockedUntil: null,
          ...(attempts >= MAX_ATTEMPTS
            ? { status: "FAILED" }
            : { sendAfter: new Date(Date.now() + BACKOFF_MIN[attempts - 1] * 60_000) }),
        },
      });
      console.error(`[email] send failed (attempt ${attempts}) to=${mail.to}: ${error?.message}`);
    }
    await new Promise((r) => setTimeout(r, SEND_GAP_MS));
  }
  return { sent, failed, picked: due.length };
}
