import Link from "next/link";
import { notFound } from "next/navigation";
import { id as localeId } from "date-fns/locale";
import { CalendarDays, Check, ChevronLeft, Clock, MapPin, Wallet } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { AGENDA_KINDS } from "@/lib/agenda";
import { eventPhotoUrl } from "@/lib/event-photo";
import { formatClub, hoursAgo } from "@/lib/time";
import { cn, formatRp } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EventActions } from "@/components/events/event-actions";
import { EventCover } from "@/components/events/event-cover";
import { EventGallery } from "@/components/events/event-gallery";
import { EventFeePanel } from "@/components/events/event-fee-panel";
import { EditEventButton } from "@/components/club/agenda-admin-controls";
import { AgendaGuests } from "@/components/jadwal/agenda-guests";
import { participant, participantName, toPerson } from "@/lib/people";

const person = { id: true, name: true, profile: { select: { nickname: true, updatedAt: true } } } as const;
const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      rsvps: { orderBy: { updatedAt: "asc" }, include: participant },
      photos: { orderBy: { createdAt: "desc" }, include: { uploader: { select: person } } },
    },
  });
  if (!event) notFound();

  const meta = AGENDA_KINDS[event.type];
  const Icon = meta.icon;
  const going = event.rsvps.filter((r) => r.status === "GOING");
  const waitlist = event.rsvps.filter((r) => r.status === "WAITLIST");
  const mine = event.rsvps.find((r) => r.userId === session.user.id);
  const name = (u: { name: string | null; profile: { nickname: string } | null }) => u.profile?.nickname ?? u.name ?? "Player";
  const fill = event.capacity ? Math.min(100, Math.round((going.length / event.capacity) * 100)) : null;
  const isPast = (event.endsAt ?? event.startsAt) < hoursAgo(3);
  const isAdmin = session.user.role === "ADMIN";
  const knownGuests = isAdmin ? await prisma.guest.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 300 }) : [];

  return (
    <div className="flex flex-col gap-5 pt-1">
      <Link href="/events" className="rise inline-flex w-fit items-center gap-1 rounded-full bg-white/80 py-1.5 pl-2 pr-3.5 text-sm font-semibold text-navy/70 shadow-sm hover:text-navy" style={rise(0)}>
        <ChevronLeft className="size-4" /> Events
      </Link>

      <header className="rise overflow-hidden rounded-[32px] border border-white bg-white/90 shadow-[0_18px_44px_rgba(14,44,60,0.1)]" style={rise(1)}>
        <div className="relative">
          <EventCover type={event.type} src={event.photos[0] ? eventPhotoUrl(event.photos[0].id) : null} className="h-48" large />
          <span className={cn("absolute left-4 top-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-sm", meta.chip)}>
            <Icon className="size-3.5" /> {meta.label}
          </span>
          {isPast && <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-navy/60">Selesai</span>}
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start gap-2">
            <h1 className="font-display min-w-0 flex-1 text-[1.75rem] font-extrabold leading-tight text-navy">{event.title}</h1>
            {isAdmin && (
              <EditEventButton
                id={event.id}
                initial={{
                  title: event.title,
                  type: event.type,
                  startsAt: formatClub(event.startsAt, "yyyy-MM-dd'T'HH:mm"),
                  endsAt: event.endsAt ? formatClub(event.endsAt, "yyyy-MM-dd'T'HH:mm") : "",
                  location: event.location,
                  capacity: event.capacity ? String(event.capacity) : "",
                  extraFee: event.extraFee ? String(event.extraFee) : "",
                  notes: event.notes ?? "",
                }}
              />
            )}
          </div>
          <ul className="flex flex-col gap-2.5 text-sm text-navy">
            <li className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream"><CalendarDays className="size-4" /></span>
              {formatClub(event.startsAt, "EEEE, d MMMM yyyy", { locale: localeId })}
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream"><Clock className="size-4" /></span>
              {formatClub(event.startsAt, "HH:mm")}
              {event.endsAt ? ` – ${formatClub(event.endsAt, "HH:mm")}` : ""} WIB
            </li>
            <li>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 hover:text-accent-ink"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream"><MapPin className="size-4" /></span>
                <span className="underline decoration-navy/20 underline-offset-4">{event.location}</span>
              </a>
            </li>
            {event.extraFee ? (
              <li className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink"><Wallet className="size-4" /></span>
                <span className="flex flex-1 flex-wrap items-center justify-between gap-2">
                  Biaya {formatRp(event.extraFee)}
                  {mine?.paidAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      <Check className="size-3.5" /> Kamu sudah lunas
                    </span>
                  ) : mine?.status === "GOING" ? (
                    <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-ink">Kamu belum bayar</span>
                  ) : null}
                </span>
              </li>
            ) : null}
          </ul>
          {event.notes && <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-navy/80">{event.notes}</p>}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-bold text-navy">{going.length} ikut</span>
              {event.capacity && <span className="text-slate-500">kuota {event.capacity}{waitlist.length ? ` · ${waitlist.length} waitlist` : ""}</span>}
            </div>
            {fill !== null && (
              <div className="h-2.5 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuenow={fill} aria-valuemin={0} aria-valuemax={100} aria-label="Kuota terisi">
                <div className={cn("h-full rounded-full transition-all", fill >= 100 ? "bg-navy" : "bg-accent")} style={{ width: `${fill}%` }} />
              </div>
            )}
          </div>

          {!isPast && (
            <EventActions eventId={event.id} current={mine?.status ?? null} shareUrl={`${appUrl()}/events/${event.id}`} />
          )}
        </div>
      </header>

      {isAdmin && event.extraFee ? (
        <div className="rise" style={rise(2)}>
          <EventFeePanel
            fee={event.extraFee}
            rows={event.rsvps
              .filter((r) => r.status === "GOING" || r.paidAt)
              .map((r) => ({
                rsvpId: r.id,
                name: r.guest ? `${r.guest.name} (tamu)` : participantName(r),
                avatar: toPerson(r).avatar,
                paid: Boolean(r.paidAt),
                going: r.status === "GOING",
              }))}
          />
        </div>
      ) : null}

      <section className="rise flex flex-col gap-3" style={rise(2)}>
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="font-display text-xl font-bold text-navy">Peserta</h2>
          {isAdmin && (
            <AgendaGuests
              target={{ type: "event", eventId: event.id }}
              title={event.title}
              guests={event.rsvps.flatMap((r) => (r.guest ? [{ rowId: r.id, guestId: r.guest.id, name: r.guest.name }] : []))}
              known={knownGuests}
            />
          )}
        </div>
        {going.length === 0 ? (
          <p className="px-1 text-sm text-slate-500">Belum ada yang ikut. Ajak teman dengan tombol share!</p>
        ) : (
          <div className="grid grid-cols-4 gap-3 rounded-[26px] border border-white bg-white/90 p-4 shadow-[0_10px_28px_rgba(14,44,60,0.06)] sm:grid-cols-6">
            {going.map((r) => (
              <div key={r.id} className="flex flex-col items-center gap-1 text-center">
                <Avatar className={cn("size-12", r.userId === session.user.id && "ring-2 ring-accent")}>
                  <AvatarImage src={toPerson(r).avatar} alt="" />
                  <AvatarFallback className="text-navy">{participantName(r).slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="w-full truncate text-xs font-semibold text-navy">{participantName(r)}</span>
                {r.guest && <span className="-mt-1 text-[10px] text-slate-400">tamu</span>}
              </div>
            ))}
          </div>
        )}
        {waitlist.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-1 text-sm">
            <span className="font-semibold text-accent-ink">Waitlist:</span>
            {waitlist.map((r, i) => (
              <span key={r.id} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-ink">
                {i + 1}. {participantName(r)}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="rise" style={rise(3)}>
        <EventGallery
          eventId={event.id}
          photos={event.photos.map((p) => ({
            id: p.id,
            src: eventPhotoUrl(p.id),
            caption: p.caption,
            uploaderId: p.uploaderId,
            uploaderName: name(p.uploader),
          }))}
          currentUserId={session.user.id}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
