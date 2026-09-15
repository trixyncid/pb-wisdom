import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Images } from "lucide-react";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    include: {
      rsvps: { where: { status: "GOING" } },
      photos: { take: 1, orderBy: { createdAt: "desc" } },
      _count: { select: { photos: true } },
    },
  });

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#0b2a4a]">Events</h1>
        <p className="text-sm text-slate-400">
          Sparring, turnamen, gathering — plus album foto
        </p>
      </div>

      <div className="space-y-3">
        {events.map((event) => {
          const cover = event.photos[0]?.imageUrl;
          const upcoming = event.startsAt >= new Date();
          return (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="mb-3 overflow-hidden p-0">
                <div className="flex gap-0">
                  <div className="relative h-28 w-28 shrink-0 bg-slate-800">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-500">
                        <Images className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center gap-1 p-3">
                    <div className="flex items-center gap-2">
                      <Badge>{event.type}</Badge>
                      {!upcoming && (
                        <Badge className="bg-white/10 text-slate-300">Past</Badge>
                      )}
                    </div>
                    <p className="font-semibold text-[#0b2a4a]">{event.title}</p>
                    <p className="text-xs text-[#2eb6ea]">
                      {format(event.startsAt, "d MMM yyyy · HH:mm", {
                        locale: localeId,
                      })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {event.location} · {event.rsvps.length} going ·{" "}
                      {event._count.photos} foto
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
