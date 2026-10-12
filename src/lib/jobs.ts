import { prisma } from "@/lib/db";
import { queueEmails } from "@/lib/email/outbox";
import { emails } from "@/lib/email/templates";
import { formatRp } from "@/lib/utils";
import { isDemoMode } from "@/lib/demo/mode";
import { upcomingDatesForWeekday } from "@/lib/time";

// Background jobs. These live outside "use server" files on purpose: anything
// exported from an action file becomes a public endpoint, and these have no
// caller to authenticate. They run from the cron route or from server code.

/** Weeks of training kept ahead on the agenda. */
export const OCCURRENCE_WEEKS_AHEAD = 2;

/** Creates the next two weeks of occurrences for every active session (one query). */
export async function ensureUpcomingOccurrences() {
  if (isDemoMode()) return;
  const sessions = await prisma.trainingSession.findMany({
    where: { active: true },
    select: { id: true, weekday: true },
  });
  if (sessions.length === 0) return;
  await prisma.trainingOccurrence.createMany({
    data: sessions.flatMap((s) =>
      upcomingDatesForWeekday(s.weekday, OCCURRENCE_WEEKS_AHEAD).map((date) => ({ sessionId: s.id, date })),
    ),
    skipDuplicates: true,
  });
}

const REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export async function sendOverdueFeeReminders() {
  const now = new Date();
  const periods = await prisma.feePeriod.findMany({
    where: { dueDate: { lt: now } },
    include: {
      dues: {
        where: { status: { in: ["UNPAID", "REJECTED"] } },
        include: { user: { select: { email: true, name: true, profile: { select: { nickname: true } } } } },
      },
    },
  });

  const candidates = periods.flatMap((period) =>
    period.dues.map((due) => ({
      userId: due.userId,
      type: "IURAN" as const,
      title: `Iuran ${period.label} terlambat`,
      body: "Segera bayar dan upload bukti transfer.",
      href: "/profile/iuran",
      email: { to: due.user.email, ...emails.feeOverdue(due.user.profile?.nickname ?? due.user.name ?? "teman", period.label, formatRp(period.amount)) },
    })),
  );
  if (candidates.length === 0) return { ok: true, count: 0 };

  // At most one reminder per member and period each week, instead of daily.
  const recent = await prisma.notification.findMany({
    where: {
      type: "IURAN",
      userId: { in: [...new Set(candidates.map((c) => c.userId))] },
      title: { in: [...new Set(candidates.map((c) => c.title))] },
      createdAt: { gte: new Date(now.getTime() - REMINDER_INTERVAL_MS) },
    },
    select: { userId: true, title: true },
  });
  const sent = new Set(recent.map((r) => `${r.userId}|${r.title}`));
  const due = candidates.filter((c) => !sent.has(`${c.userId}|${c.title}`));
  if (due.length) {
    // Same weekly rhythm for the email: it goes out with the notification.
    await prisma.$transaction([
      prisma.notification.createMany({ data: due.map(({ userId, type, title, body, href }) => ({ userId, type, title, body, href })) }),
      queueEmails(prisma, due.map((c) => ({ ...c.email, kind: "fee-overdue" }))),
    ]);
  }

  return { ok: true, count: due.length };
}
