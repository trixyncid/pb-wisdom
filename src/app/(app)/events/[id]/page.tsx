import { id as localeId } from "date-fns/locale";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { formatRp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EventActions } from "@/components/events/event-actions";
import { EventGallery } from "@/components/events/event-gallery";
import { formatClub } from "@/lib/time";
import { AGENDA_KINDS } from "@/lib/agenda";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      rsvps: {
        include: { user: { include: { profile: true } } },
        orderBy: { createdAt: "asc" },
      },
      photos: {
        include: { uploader: { include: { profile: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!event) notFound();

  const mine = event.rsvps.find((r) => r.userId === session.user.id);
  const baseUrl = appUrl();

  return (
    <>
      <div className="mb-4 space-y-2">
        <Badge className={AGENDA_KINDS[event.type].chip}>{AGENDA_KINDS[event.type].label}</Badge>
        <h1 className="text-2xl font-bold text-navy">{event.title}</h1>
        <p className="text-sm text-accent-ink">
          {formatClub(event.startsAt, "EEEE, d MMM yyyy · HH:mm", {
            locale: localeId,
          })}
        </p>
        <p className="text-sm text-slate-300">{event.location}</p>
        {event.capacity && (
          <p className="text-xs text-slate-400">
            Kapasitas {event.capacity} ·{" "}
            {event.rsvps.filter((r) => r.status === "GOING").length} going
          </p>
        )}
        {event.extraFee ? (
          <p className="text-xs text-amber-700">
            Biaya tambahan {formatRp(event.extraFee)}
          </p>
        ) : null}
        {event.notes && <p className="text-sm text-slate-400">{event.notes}</p>}
      </div>

      <Card className="mb-4">
        <EventActions
          eventId={event.id}
          current={mine?.status ?? null}
          shareUrl={`${baseUrl}/events/${event.id}`}
        />
      </Card>

      <section className="mb-5">
        <h2 className="mb-2 text-sm font-semibold text-navy">Peserta</h2>
        <div className="flex flex-wrap gap-1.5">
          {event.rsvps
            .filter((r) => r.status === "GOING" || r.status === "WAITLIST")
            .map((r) => (
              <Badge
                key={r.id}
                className={`normal-case tracking-normal ${
                  r.status === "WAITLIST" ? "bg-amber-400/15 text-amber-700" : ""
                }`}
              >
                {r.user.profile?.nickname ?? r.user.name}
                {r.status === "WAITLIST" ? " (wait)" : ""}
              </Badge>
            ))}
        </div>
      </section>

      <EventGallery
        eventId={event.id}
        photos={event.photos.map((p) => ({
          id: p.id,
          imageUrl: p.imageUrl,
          caption: p.caption,
          uploaderId: p.uploaderId,
          uploaderName: p.uploader.profile?.nickname ?? p.uploader.name ?? "Player",
        }))}
        currentUserId={session.user.id}
        isAdmin={session.user.role === "ADMIN"}
      />
    </>
  );
}
