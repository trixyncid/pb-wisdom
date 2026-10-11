"use client";

import { useState, useTransition } from "react";
import type { EventType } from "@prisma/client";
import { createEventAction } from "@/actions/events";
import { withToast } from "@/lib/with-toast";
import { AGENDA_KINDS, EVENT_TYPES } from "@/lib/agenda";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateEventForm() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("SPARRING");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [extraFee, setExtraFee] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await withToast(
            createEventAction({
              title,
              type,
              startsAt,
              endsAt: endsAt || undefined,
              location,
              capacity: capacity ? Number(capacity) : undefined,
              extraFee: extraFee ? Number(extraFee) : undefined,
              notes: notes || undefined,
            }),
            { loading: "Membuat event…", success: `${AGENDA_KINDS[type].label} ditambahkan ke jadwal` },
          );
          if (!res.ok) return;
          setTitle("");
          setStartsAt("");
          setEndsAt("");
          setNotes("");
        });
      }}
    >
      <div className="space-y-1.5">
        <Label id="ev-type">Jenis kegiatan</Label>
        <div role="radiogroup" aria-labelledby="ev-type" className="grid grid-cols-2 gap-2">
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
        <Label htmlFor="ev-title">Judul</Label>
        <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sparring vs PB Garuda" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="ev-start">Mulai</Label>
          <Input id="ev-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-end">Selesai (opsional)</Label>
          <Input id="ev-end" type="datetime-local" value={endsAt} min={startsAt || undefined} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ev-location">Lokasi</Label>
        <Input id="ev-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="GOR Merdeka Medan" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="ev-capacity">Kuota (opsional)</Label>
          <Input id="ev-capacity" inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value.replace(/\D/g, ""))} placeholder="24" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-fee">Biaya (opsional)</Label>
          <Input id="ev-fee" inputMode="numeric" value={extraFee} onChange={(e) => setExtraFee(e.target.value.replace(/\D/g, ""))} placeholder="50000" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ev-notes">Catatan (opsional)</Label>
        <Input id="ev-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending} className="mt-1">
        Tambahkan ke jadwal
      </Button>
    </form>
  );
}
