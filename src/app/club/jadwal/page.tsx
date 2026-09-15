import { prisma } from "@/lib/db";
import { weekdayLabel } from "@/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { TrainingSessionForm } from "@/components/club/training-session-form";

export default async function ClubJadwalPage() {
  const sessions = await prisma.trainingSession.findMany({
    orderBy: { weekday: "asc" },
  });

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#0b2a4a]">Kelola Jadwal</h1>
        <p className="text-sm text-slate-400">Recurring weekly training</p>
      </div>

      <Card className="mb-4">
        <CardTitle className="mb-3">Tambah sesi</CardTitle>
        <TrainingSessionForm />
      </Card>

      <div className="space-y-2">
        {sessions.map((s) => (
          <Card key={s.id}>
            <p className="font-semibold text-[#0b2a4a]">{s.title}</p>
            <p className="text-sm text-[#2eb6ea]">
              {weekdayLabel(s.weekday)} · {s.startTime}
              {s.endTime ? `–${s.endTime}` : ""}
            </p>
            <p className="text-xs text-slate-400">{s.venue}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
