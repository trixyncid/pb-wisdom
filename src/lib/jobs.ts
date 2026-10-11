import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/demo/mode";

// Background jobs. These live outside "use server" files on purpose: anything
// exported from an action file becomes a public endpoint, and these have no
// caller to authenticate. They run from the cron route or from server code.

export function nextDateForWeekday(weekday: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const diff = (weekday + 7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

export async function ensureUpcomingOccurrences() {
  if (isDemoMode()) return;
  const sessions = await prisma.trainingSession.findMany({
    where: { active: true },
  });
  for (const s of sessions) {
    const date = nextDateForWeekday(s.weekday);
    await prisma.trainingOccurrence.upsert({
      where: { sessionId_date: { sessionId: s.id, date } },
      create: { sessionId: s.id, date },
      update: {},
    });
  }
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
