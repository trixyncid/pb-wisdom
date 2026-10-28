import Link from "next/link";
import { after } from "next/server";
import { id as localeId } from "date-fns/locale";
import { ArrowUpRight, CalendarX2, MapPin, Share2 } from "lucide-react";
import type { AttendanceStatus, RsvpStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { participant, toPerson, type Participant } from "@/lib/people";
import { ensureUpcomingOccurrences } from "@/lib/jobs";
import { AGENDA_KINDS, KIND_FILTERS, filterToKind, type AgendaKind, type KindFilter } from "@/lib/agenda";
import { clubDayLabel, formatClub, hoursAgo, occurrenceStart, startOfClubTodayKey } from "@/lib/time";
import { cn, formatRp } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AttendanceButtons } from "@/components/jadwal/attendance-buttons";
import { EventActions } from "@/components/events/event-actions";
import { JadwalRsvpGate } from "@/components/jadwal/rsvp-gate";
import { AgendaGuests, type AgendaGuestRow } from "@/components/jadwal/agenda-guests";

type Goer = { id: string; name: string; avatar: string };

type AgendaItem = {
  key: string;
  kind: AgendaKind;
  start: Date;
  endLabel: string | null;
  title: string;
  place: string;
  notes: string | null;
  goers: Goer[];
  guests: AgendaGuestRow[];
  capacity: number | null;
  extraFee: number | null;
  href: string | null;
  shareText: string;
  rsvp:
    | { type: "training"; occurrenceId: string; mine: AttendanceStatus | null }
    | { type: "event"; eventId: string; mine: RsvpStatus | null };
};

const attendee = { id: true, userId: true, status: true, ...participant } as const;

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

// One agenda for everything the club does: weekly training plus sparring,
// tournaments, gatherings and other events, grouped by day.
export default async function JadwalPage({
  searchParams,
}: {
  searchParams: Promise<{ tipe?: string }>;
}) {
  const session = await auth();
  // Normally done by the daily cron; this only backfills, after the response.
  after(ensureUpcomingOccurrences);

  const { tipe } = await searchParams;
  const filter: KindFilter = (KIND_FILTERS as readonly string[]).includes(tipe ?? "") ? (tipe as KindFilter) : "semua";
  const kind = filterToKind(filter);
  const userId = session?.user?.id;
  const loggedIn = Boolean(userId);
  const isAdmin = session?.user?.role === "ADMIN";
  // Events stay on the agenda until a few hours after they start.
  const eventsFrom = hoursAgo(3);

  const [occurrences, events, knownGuests] = await Promise.all([
    kind && kind !== "LATIHAN"
      ? []
      : prisma.trainingOccurrence.findMany({
          where: { date: { gte: startOfClubTodayKey() }, session: { active: true } },
          orderBy: { date: "asc" },
          take: 20,
          include: {
            session: true,
            attendances: { select: attendee },
          },
        }),
    kind === "LATIHAN"
      ? []
      : prisma.event.findMany({
          where: { startsAt: { gte: eventsFrom }, ...(kind ? { type: kind } : {}) },
          orderBy: { startsAt: "asc" },
          take: 20,
          include: { rsvps: { select: attendee } },
        }),
    isAdmin ? prisma.guest.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 300 }) : [],
  ]);

  const toGoer = (p: Participant): Goer => {
    const { key, name, avatar } = toPerson(p);
    return { id: key, name, avatar };
  };
  const toGuests = (rows: ({ id: string } & Participant)[]): AgendaGuestRow[] =>
    rows.flatMap((r) => (r.guest ? [{ rowId: r.id, guestId: r.guest.id, name: r.guest.name }] : []));

  const baseUrl = appUrl();
  const items: AgendaItem[] = [
    ...occurrences.map((o): AgendaItem => ({
      key: `o-${o.id}`,
      kind: "LATIHAN",
      start: occurrenceStart(o.date, o.session.startTime),
      endLabel: o.session.endTime,
      title: o.session.title,
      place: o.session.venue,
      notes: o.session.notes,
      goers: o.attendances.filter((a) => a.status === "GOING" || a.status === "ATTENDED").map(toGoer),
      guests: toGuests(o.attendances),
      capacity: null,
      extraFee: null,
      href: null,
      shareText: `Yuk latihan: ${o.session.title} — ${baseUrl}/jadwal`,
      rsvp: { type: "training", occurrenceId: o.id, mine: o.attendances.find((a) => a.userId === userId)?.status ?? null },
    })),
    ...events.map((e): AgendaItem => ({
      key: `e-${e.id}`,
      kind: e.type,
      start: e.startsAt,
      endLabel: e.endsAt ? formatClub(e.endsAt, "HH:mm") : null,
      title: e.title,
      place: e.location,
      notes: e.notes,
      goers: e.rsvps.filter((r) => r.status === "GOING").map(toGoer),
      guests: toGuests(e.rsvps),
      capacity: e.capacity,
      extraFee: e.extraFee,
      href: `/events/${e.id}`,
      shareText: `Join ${AGENDA_KINDS[e.type].label.toLowerCase()} PB Wisdom: ${e.title} — ${baseUrl}/events/${e.id}`,
      rsvp: { type: "event", eventId: e.id, mine: e.rsvps.find((r) => r.userId === userId)?.status ?? null },
    })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  const days = new Map<string, AgendaItem[]>();
  for (const item of items) {
    const label = clubDayLabel(item.start, localeId);
    days.set(label, [...(days.get(label) ?? []), item]);
  }

  let n = 0; // running index for the staggered entrance
  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="rise" style={rise(n++)}>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent-ink">Agenda klub</p>
        <h1 className="font-display mt-1 text-[2.1rem] font-extrabold leading-[1.05] text-navy">Jadwal</h1>
        <p className="mt-1 text-sm text-slate-500">Latihan rutin, sparring, turnamen & kegiatan klub.</p>
      </div>

      <nav aria-label="Filter jadwal" className="rise -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" style={rise(n++)}>
        {KIND_FILTERS.map((f) => {
          const k = filterToKind(f);
          const active = f === filter;
          const Icon = k ? AGENDA_KINDS[k].icon : null;
          return (
            <Link
              key={f}
              href={f === "semua" ? "/jadwal" : `/jadwal?tipe=${f}`}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition",
                active ? "bg-navy text-white shadow-[0_8px_18px_rgba(14,44,60,0.22)]" : "bg-white/90 text-navy/70 shadow-sm hover:bg-white",
              )}
            >
              {Icon && <Icon className="size-4" />}
              {k ? AGENDA_KINDS[k].label : "Semua"}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 && (
        <div className="rise flex flex-col items-center gap-2 rounded-[28px] border border-white bg-white/80 px-6 py-10 text-center" style={rise(n++)}>
          <span className="flex size-14 items-center justify-center rounded-full bg-sand text-navy/60">
            <CalendarX2 className="size-6" />
          </span>
          <p className="font-bold text-navy">Belum ada agenda</p>
          <p className="text-sm text-slate-500">
            {filter === "semua" ? "Admin bisa menambah latihan atau event dari Club Admin." : "Coba filter lain."}
          </p>
        </div>
      )}

      {[...days.entries()].map(([day, dayItems]) => (
        <section key={day} className="flex flex-col gap-3">
          <h2 className="rise flex items-center gap-2 px-1 font-display text-lg font-bold text-navy" style={rise(n++)}>
            {day}
            <span className="h-px flex-1 bg-navy/10" />
          </h2>
          {dayItems.map((item) => {
            const meta = AGENDA_KINDS[item.kind];
            const Icon = meta.icon;
            const shown = item.goers.slice(0, 5);
            return (
              <article
                key={item.key}
                className="rise flex flex-col gap-4 rounded-[28px] border border-white bg-white/90 p-4 shadow-[0_12px_32px_rgba(14,44,60,0.07)]"
                style={rise(n++)}
              >
                <div className="flex gap-3">
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-2xl bg-cream py-2">
                    <span className="font-display text-lg font-extrabold leading-none text-navy">{formatClub(item.start, "HH:mm")}</span>
                    {item.endLabel && <span className="mt-1 text-[11px] font-medium text-navy/45">{item.endLabel}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold", meta.chip)}>
                      <Icon className="size-3.5" /> {meta.label}
                    </span>
                    {item.href ? (
                      <Link href={item.href} className="group mt-1 flex items-center gap-1 text-[17px] font-bold leading-snug text-navy">
                        <span className="truncate">{item.title}</span>
                        <ArrowUpRight className="size-4 shrink-0 text-navy/40 transition group-hover:text-accent-ink" />
                      </Link>
                    ) : (
                      <h3 className="mt-1 truncate text-[17px] font-bold leading-snug text-navy">{item.title}</h3>
                    )}
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{item.place}</span>
                    </p>
                    {(item.notes || item.extraFee) && (
                      <p className="mt-1 text-xs text-slate-400">
                        {item.extraFee ? `Biaya ${formatRp(item.extraFee)}` : ""}
                        {item.extraFee && item.notes ? " · " : ""}
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(item.shareText)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Bagikan ${item.title} ke WhatsApp`}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cream text-navy transition hover:bg-sand"
                  >
                    <Share2 className="size-4" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  {shown.length > 0 ? (
                    <div className="flex -space-x-2">
                      {shown.map((g) => (
                        <Avatar key={g.id} className="size-8 ring-2 ring-white" title={g.name}>
                          <AvatarImage src={g.avatar} alt="" />
                          <AvatarFallback className="text-[10px] text-navy">{g.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  ) : null}
                  <p className="min-w-0 flex-1 text-sm font-semibold text-navy/70">
                    {item.goers.length > 0 ? `${item.goers.length} ikut` : "Belum ada yang ikut"}
                    {item.guests.length > 0 ? <span className="font-normal text-slate-400"> · {item.guests.length} tamu</span> : null}
                    {item.capacity ? <span className="font-normal text-slate-400"> · kuota {item.capacity}</span> : null}
                  </p>
                  {isAdmin && (
                    <AgendaGuests
                      target={item.rsvp.type === "training" ? { type: "training", occurrenceId: item.rsvp.occurrenceId } : { type: "event", eventId: item.rsvp.eventId }}
                      title={item.title}
                      guests={item.guests}
                      known={knownGuests}
                      className="shrink-0"
                    />
                  )}
                </div>

                {loggedIn ? (
                  item.rsvp.type === "training" ? (
                    <AttendanceButtons occurrenceId={item.rsvp.occurrenceId} current={item.rsvp.mine} />
                  ) : (
                    <EventActions eventId={item.rsvp.eventId} current={item.rsvp.mine} />
                  )
                ) : (
                  <JadwalRsvpGate />
                )}
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}
