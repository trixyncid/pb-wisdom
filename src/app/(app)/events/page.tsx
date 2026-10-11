import Link from "next/link";
import { id as localeId } from "date-fns/locale";
import { CalendarDays, Images, MapPin, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AGENDA_KINDS } from "@/lib/agenda";
import { eventPhotoUrl } from "@/lib/event-photo";
import { formatClub, hoursAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { EventCover } from "@/components/events/event-cover";

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

// Upcoming events up top (with your RSVP), then past events as photo albums.
export default async function EventsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const cutoff = hoursAgo(3);

  const include = {
    photos: { take: 1, orderBy: { createdAt: "desc" as const }, select: { id: true } },
    rsvps: { where: { userId }, select: { status: true } },
    _count: { select: { photos: true, rsvps: { where: { status: "GOING" as const } } } },
  };
  const [upcoming, past] = await Promise.all([
    prisma.event.findMany({ where: { startsAt: { gte: cutoff } }, orderBy: { startsAt: "asc" }, include }),
    prisma.event.findMany({ where: { startsAt: { lt: cutoff } }, orderBy: { startsAt: "desc" }, take: 24, include }),
  ]);

  let n = 0;
  return (
    <div className="flex flex-col gap-7 pt-2">
      <div className="rise" style={rise(n++)}>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent-ink">Kegiatan klub</p>
        <h1 className="font-display mt-1 text-[2.1rem] font-extrabold leading-[1.05] text-navy">Events</h1>
        <p className="mt-1 text-sm text-slate-500">Sparring, turnamen, gathering, dan album fotonya.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="rise px-1 font-display text-xl font-bold text-navy" style={rise(n++)}>
          Akan datang
        </h2>
        {upcoming.length === 0 && (
          <p className="rise rounded-[24px] border border-white bg-white/80 px-4 py-6 text-center text-sm text-slate-500" style={rise(n++)}>
            Belum ada event terjadwal. Cek <Link href="/jadwal" className="font-semibold text-accent-ink">jadwal</Link> untuk latihan rutin.
          </p>
        )}
        {upcoming.map((e) => {
          const meta = AGENDA_KINDS[e.type];
          const Icon = meta.icon;
          const mine = e.rsvps[0]?.status;
          return (
            <Link
              key={e.id}
              href={`/events/${e.id}`}
              className="rise group overflow-hidden rounded-[30px] border border-white bg-white/90 shadow-[0_14px_36px_rgba(14,44,60,0.08)] transition hover:-translate-y-0.5"
              style={rise(n++)}
            >
              <div className="relative">
                <EventCover type={e.type} src={e.photos[0] ? eventPhotoUrl(e.photos[0].id) : null} className="h-36" />
                <span className={cn("absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm", meta.chip)}>
                  <Icon className="size-3.5" /> {meta.label}
                </span>
                <span className="absolute bottom-3 left-3 flex flex-col items-center rounded-2xl bg-white px-3 py-1.5 text-navy shadow-md">
                  <span className="text-[10px] font-bold uppercase text-accent-ink">{formatClub(e.startsAt, "MMM", { locale: localeId })}</span>
                  <span className="font-display text-xl font-extrabold leading-none">{formatClub(e.startsAt, "d")}</span>
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-4">
                <h3 className="text-lg font-bold leading-snug text-navy">{e.title}</h3>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" />
                    {formatClub(e.startsAt, "EEEE, HH:mm", { locale: localeId })}
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">{e.location}</span>
                  </span>
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy/70">
                    <Users className="size-4" />
                    {e._count.rsvps}
                    {e.capacity ? `/${e.capacity}` : ""} ikut
                  </span>
                  {mine === "GOING" ? (
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-navy">Kamu ikut</span>
                  ) : mine === "WAITLIST" ? (
                    <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-ink">Waitlist</span>
                  ) : (
                    <span className="rounded-full bg-navy px-3 py-1 text-xs font-bold text-white">RSVP</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {past.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="rise px-1 font-display text-xl font-bold text-navy" style={rise(n++)}>
            Album & event lalu
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {past.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="rise group overflow-hidden rounded-[24px] border border-white bg-white/90 shadow-[0_10px_28px_rgba(14,44,60,0.06)] transition hover:-translate-y-0.5"
                style={rise(n++)}
              >
                <div className="relative">
                  <EventCover type={e.type} src={e.photos[0] ? eventPhotoUrl(e.photos[0].id) : null} className="aspect-[4/3]" />
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-navy">
                    <Images className="size-3" /> {e._count.photos}
                  </span>
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-bold text-navy">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    {AGENDA_KINDS[e.type].label} · {formatClub(e.startsAt, "d MMM yyyy", { locale: localeId })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
