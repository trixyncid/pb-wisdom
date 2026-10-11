import { requireAdminPage } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { weekdayLabel } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/card";
import { TrainingSessionForm } from "@/components/club/training-session-form";

export default async function ClubJadwalPage() {
  await requireAdminPage();
  const sessions = await prisma.trainingSession.findMany({
    orderBy: { weekday: "asc" },
  });

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-navy">Kelola Jadwal</h1>
        <p className="text-sm text-slate-400">Recurring weekly training</p>
      </div>

      <Card className="mb-4">
        <CardTitle className="mb-3">Tambah sesi</CardTitle>
        <TrainingSessionForm />
      </Card>

      <div className="space-y-2">
        {sessions.map((s) => (
          <Card key={s.id}>
            <p className="font-semibold text-navy">{s.title}</p>
            <p className="text-sm text-accent-ink">
              {weekdayLabel(s.weekday)} · {s.startTime}
              {s.endTime ? `–${s.endTime}` : ""}
            </p>
            <p className="text-xs text-slate-400">{s.venue}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
