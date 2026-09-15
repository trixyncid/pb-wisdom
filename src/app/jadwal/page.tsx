import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { MapPin, Share2, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekdayLabel } from "@/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceButtons } from "@/components/jadwal/attendance-buttons";
import { ensureUpcomingOccurrencesAction } from "@/actions/jadwal";
import { JadwalRsvpGate } from "@/components/jadwal/rsvp-gate";

export default async function JadwalPage() {
  const session = await auth();
  await ensureUpcomingOccurrencesAction();

  const occurrences = await prisma.trainingOccurrence.findMany({
    where: {
      date: {
        gte: new Date(new Date().setDate(new Date().getDate() - 1)),
      },
    },
    orderBy: { date: "asc" },
    take: 8,
    include: {
      session: true,
      attendances: {
        include: { user: { include: { profile: true } } },
      },
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const loggedIn = Boolean(session?.user);

  return (
    <AppShell>
      <div className="mb-5">
        <Badge className="mb-2 bg-[#e8f3fb] text-[#2eb6ea] normal-case tracking-normal">
          Public schedule
        </Badge>
        <h1 className="text-2xl font-black text-[#0b2a4a]">Jadwal Latihan</h1>
        <p className="text-sm text-slate-500">
          Sesi mingguan PB Wisdom Medan — RSVP butuh login member
        </p>
      </div>

      <div className="space-y-3">
        {occurrences.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500">
              Belum ada jadwal. Admin bisa menambah dari Club Admin.
            </p>
          </Card>
        )}
        {occurrences.map((occ) => {
          const mine = loggedIn
            ? occ.attendances.find((a) => a.userId === session!.user.id)
            : null;
          const going = occ.attendances.filter((a) =>
            ["GOING", "ATTENDED"].includes(a.status),
          );
          const shareUrl = `${appUrl}/jadwal?occurrence=${occ.id}`;
          return (
            <Card key={occ.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-[#0b2a4a]">
                    {occ.session.title}
                  </p>
                  <p className="text-sm font-semibold text-[#2eb6ea]">
                    {weekdayLabel(occ.session.weekday)} ·{" "}
                    {format(occ.date, "EEEE, d MMM yyyy", { locale: localeId })}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                    <MapPin className="h-3.5 w-3.5" />
                    {occ.session.startTime}
                    {occ.session.endTime ? ` – ${occ.session.endTime}` : ""} ·{" "}
                    {occ.session.venue}
                  </p>
                  {occ.session.notes && (
                    <p className="mt-1 text-xs text-slate-400">
                      {occ.session.notes}
                    </p>
                  )}
                </div>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Yuk latihan: ${occ.session.title} — ${shareUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-[#e8f3fb] p-2.5 text-[#0b2a4a]"
                >
                  <Share2 className="h-4 w-4" />
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <Users className="h-3.5 w-3.5" />
                {going.length} going
              </div>
              <div className="flex flex-wrap gap-1">
                {going.slice(0, 8).map((a) => (
                  <Badge
                    key={a.id}
                    className="normal-case tracking-normal bg-[#f3f8fc]"
                  >
                    {a.user.profile?.nickname ?? a.user.name}
                  </Badge>
                ))}
                {going.length > 8 && (
                  <Badge className="normal-case">+{going.length - 8}</Badge>
                )}
              </div>
              {loggedIn ? (
                <AttendanceButtons
                  occurrenceId={occ.id}
                  current={mine?.status ?? null}
                />
              ) : (
                <JadwalRsvpGate />
              )}
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
