"use client";

import { useId, useState, useTransition } from "react";
import type { EventType } from "@prisma/client";
import { createEventAction, updateEventAction } from "@/actions/events";
import { withToast } from "@/lib/with-toast";
import { AGENDA_KINDS, EVENT_TYPES } from "@/lib/agenda";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker, type DayRange } from "@/components/ui/date-picker";
import { toast } from "sonner";

export type EventFormValues = {
  title: string;
  type: EventType;
  /** "2026-10-17T19:00" in club time (day from the picker, time from the input). */
  startsAt: string;
  endsAt: string;
  location: string;
  capacity: string;
  extraFee: string;
  notes: string;
};

/** Add an event, or with `eventId` edit it (`initial` pre-fills the fields). */
export function CreateEventForm({ eventId, initial, onDone }: { eventId?: string; initial?: EventFormValues; onDone?: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<EventType>(initial?.type ?? "SPARRING");
  // Day(s) from the range picker, times from the time inputs.
  const [days, setDays] = useState<DayRange | null>(() =>
    initial?.startsAt ? { from: initial.startsAt.slice(0, 10), to: (initial.endsAt || initial.startsAt).slice(0, 10) } : null,
  );
  const [startTime, setStartTime] = useState(initial?.startsAt.slice(11, 16) ?? "19:00");
  const [endTime, setEndTime] = useState(initial?.endsAt.slice(11, 16) ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity ?? "");
  const [extraFee, setExtraFee] = useState(initial?.extraFee ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [pending, start] = useTransition();
  const uid = useId();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!days) {
          toast.error("Pilih tanggal event");
          return;
        }
        const lastDay = days.to ?? days.from;
        if (lastDay !== days.from && !endTime) {
          toast.error("Event beberapa hari: isi jam selesai di hari terakhir");
          return;
        }
        start(async () => {
          const values = {
            title,
            type,
            startsAt: `${days.from}T${startTime}`,
            endsAt: endTime ? `${lastDay}T${endTime}` : undefined,
            location,
            capacity: capacity ? Number(capacity) : undefined,
            extraFee: extraFee ? Number(extraFee) : undefined,
            notes: notes || undefined,
          };
          if (eventId) {
            const res = await withToast(updateEventAction(eventId, values), { loading: "Menyimpan…", success: "Perubahan disimpan" });
            if (res.ok) onDone?.();
            return;
          }
          const res = await withToast(createEventAction(values), {
            loading: "Membuat event…",
            success: `${AGENDA_KINDS[type].label} ditambahkan ke jadwal`,
          });
          if (!res.ok) return;
          setTitle("");
          setDays(null);
          setEndTime("");
          setNotes("");
        });
      }}
    >
      <div className="space-y-1.5">
        <Label id={`${uid}-type`}>Jenis kegiatan</Label>
        <div role="radiogroup" aria-labelledby={`${uid}-type`} className="grid grid-cols-2 gap-2">
          {EVENT_TYPES.map((t) => {
            const meta = AGENDA_KINDS[t];
            const Icon = meta.icon;
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setType(t)}
                className={cn(
                  "flex h-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition",
                  active ? "bg-navy text-white shadow-[0_8px_18px_rgba(14,44,60,0.22)]" : "bg-cream text-navy/60 hover:bg-sand",
                )}
              >
                <Icon className="size-4" /> {meta.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-title`}>Judul</Label>
        <Input id={`${uid}-title`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sparring vs PB Garuda" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-days`}>Tanggal</Label>
        <DateRangePicker id={`${uid}-days`} value={days} onChange={setDays} required fromDate={eventId ? undefined : new Date()} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-start`}>Jam mulai</Label>
          <Input id={`${uid}-start`} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-end`}>{days?.to && days.to !== days.from ? "Jam selesai (hari terakhir)" : "Jam selesai (opsional)"}</Label>
          <Input id={`${uid}-end`} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-location`}>Lokasi</Label>
        <Input id={`${uid}-location`} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="GOR Merdeka Medan" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-capacity`}>Kuota (opsional)</Label>
          <Input id={`${uid}-capacity`} inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value.replace(/\D/g, ""))} placeholder="24" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-fee`}>Biaya (opsional)</Label>
          <Input id={`${uid}-fee`} inputMode="numeric" value={extraFee} onChange={(e) => setExtraFee(e.target.value.replace(/\D/g, ""))} placeholder="50000" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-notes`}>Catatan (opsional)</Label>
        <Input id={`${uid}-notes`} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending} className="mt-1">
        {eventId ? "Simpan perubahan" : "Tambahkan ke jadwal"}
      </Button>
    </form>
  );
}
