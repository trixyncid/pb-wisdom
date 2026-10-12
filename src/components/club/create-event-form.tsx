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

export type EventFormValues = {
  title: string;
  type: EventType;
  /** "2026-10-17T19:00" in club time, as a datetime-local input wants it. */
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
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt ?? "");
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
        start(async () => {
          const values = {
            title,
            type,
            startsAt,
            endsAt: endsAt || undefined,
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
          setStartsAt("");
          setEndsAt("");
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
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-start`}>Mulai</Label>
          <Input id={`${uid}-start`} type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-end`}>Selesai (opsional)</Label>
          <Input id={`${uid}-end`} type="datetime-local" value={endsAt} min={startsAt || undefined} onChange={(e) => setEndsAt(e.target.value)} />
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
