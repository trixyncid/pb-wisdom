import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { CreateEventForm } from "@/components/club/create-event-form";

export default async function ClubEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { photos: true, rsvps: true } } },
  });

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#0b2a4a]">Kelola Events</h1>
      </div>
      <Card className="mb-4">
        <CardTitle className="mb-3">Buat event</CardTitle>
        <CreateEventForm />
      </Card>
      <div className="space-y-2">
        {events.map((e) => (
          <Link key={e.id} href={`/events/${e.id}`}>
            <Card className="mb-2">
              <p className="font-semibold text-[#0b2a4a]">{e.title}</p>
              <p className="text-xs text-slate-400">
                {format(e.startsAt, "d MMM yyyy HH:mm")} · {e._count.rsvps} RSVP ·{" "}
                {e._count.photos} foto
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
