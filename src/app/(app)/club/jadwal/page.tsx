import Link from "next/link";
import { id as localeId } from "date-fns/locale";
import { ArrowUpRight, MapPin } from "lucide-react";
import { requireAdminPage } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { AGENDA_KINDS } from "@/lib/agenda";
import { formatClub, hoursAgo } from "@/lib/time";
import { cn, weekdayLabel } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { AdminHeader } from "@/components/club/admin-header";
import { AgendaCreator } from "@/components/club/agenda-creator";
import { DeleteEventButton, SessionActiveToggle } from "@/components/club/agenda-admin-controls";

export default async function ClubAgendaPage() {
  await requireAdminPage();
  const [sessions, events] = await Promise.all([
    prisma.trainingSession.findMany({ orderBy: [{ weekday: "asc" }, { startTime: "asc" }] }),
    prisma.event.findMany({
      where: { startsAt: { gte: hoursAgo(3) } },
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { rsvps: { where: { status: "GOING" } } } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <AdminHeader title="Agenda" desc="Tambah sparring, turnamen, gathering atau latihan rutin." />

      <Card className="p-4">
        <AgendaCreator />
      </Card>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 font-display text-lg font-bold text-navy">Event mendatang</h2>
        {events.length === 0 && <p className="px-1 text-sm text-slate-500">Belum ada event. Tambahkan dari form di atas.</p>}
        {events.map((e) => {
          const meta = AGENDA_KINDS[e.type];
          const Icon = meta.icon;
          return (
            <div key={e.id} className="flex items-center gap-3 rounded-[24px] border border-white bg-white/90 p-2.5 shadow-[0_8px_24px_rgba(14,44,60,0.05)]">
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", meta.chip)}>
                <Icon className="size-5" />
              </span>
              <Link href={`/events/${e.id}`} className="group min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate text-sm font-bold text-navy">
                  <span className="truncate">{e.title}</span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-navy/40 group-hover:text-accent-ink" />
                </p>
                <p className="truncate text-xs text-slate-500">
                  {meta.label} · {formatClub(e.startsAt, "EEE d MMM, HH:mm", { locale: localeId })} · {e._count.rsvps}
                  {e.capacity ? `/${e.capacity}` : ""} ikut
                </p>
              </Link>
              <DeleteEventButton id={e.id} title={e.title} />
            </div>
          );
        })}
        <Link href="/events" className="px-1 text-sm font-medium text-navy/50 hover:text-navy">
          Event lalu & album foto →
        </Link>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 font-display text-lg font-bold text-navy">Latihan rutin</h2>
        {sessions.length === 0 && <p className="px-1 text-sm text-slate-500">Belum ada latihan rutin.</p>}
        {sessions.map((s) => (
          <div
            key={s.id}
            className={cn(
              "flex items-center gap-3 rounded-[24px] border border-white bg-white/90 p-2.5 pl-3 shadow-[0_8px_24px_rgba(14,44,60,0.05)] transition-opacity",
              !s.active && "opacity-60",
            )}
          >
            <div className="flex w-14 shrink-0 flex-col items-center rounded-2xl bg-cream py-1.5">
              <span className="text-[11px] font-bold uppercase text-accent-ink">{weekdayLabel(s.weekday).slice(0, 3)}</span>
              <span className="font-display text-sm font-extrabold text-navy">{s.startTime}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-navy">{s.title}</p>
              <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">
                  {s.venue}
                  {s.endTime ? ` · s/d ${s.endTime}` : ""}
                </span>
              </p>
            </div>
            <span className="text-[11px] font-semibold text-navy/50">{s.active ? "Aktif" : "Dijeda"}</span>
            <SessionActiveToggle id={s.id} active={s.active} title={s.title} />
          </div>
        ))}
      </section>
    </div>
  );
}
