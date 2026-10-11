import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/demo/mode";
import { nextDateForWeekday } from "@/lib/time";

// Background jobs. These live outside "use server" files on purpose: anything
// exported from an action file becomes a public endpoint, and these have no
// caller to authenticate. They run from the cron route or from server code.

/** Creates the next occurrence of every active weekly session (one query). */
export async function ensureUpcomingOccurrences() {
  if (isDemoMode()) return;
  const sessions = await prisma.trainingSession.findMany({
    where: { active: true },
    select: { id: true, weekday: true },
  });
  if (sessions.length === 0) return;
  await prisma.trainingOccurrence.createMany({
    data: sessions.map((s) => ({ sessionId: s.id, date: nextDateForWeekday(s.weekday) })),
    skipDuplicates: true,
  });
}

export async function sendOverdueFeeReminders() {
  const now = new Date();
  const periods = await prisma.feePeriod.findMany({
    where: { dueDate: { lt: now } },
    include: {
      dues: {
        where: { status: { in: ["UNPAID", "REJECTED"] } },
      },
    },
  });

  const data = periods.flatMap((period) =>
    period.dues.map((due) => ({
      userId: due.userId,
      type: "IURAN" as const,
      title: `Iuran ${period.label} terlambat`,
      body: "Segera bayar dan upload bukti transfer.",
      href: "/profile/iuran",
    })),
  );
  if (data.length) await prisma.notification.createMany({ data });

  return { ok: true, count: data.length };
}
