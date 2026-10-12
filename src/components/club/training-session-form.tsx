"use client";

import { useId, useState, useTransition } from "react";
import { upsertTrainingSessionAction } from "@/actions/jadwal";
import { withToast } from "@/lib/with-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export type SessionFormValues = { title: string; weekday: number; startTime: string; endTime: string; venue: string; notes: string };

/** Add a weekly training, or with `sessionId` edit it. */
export function TrainingSessionForm({ sessionId, initial, onDone }: { sessionId?: string; initial?: SessionFormValues; onDone?: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "Latihan");
  const [weekday, setWeekday] = useState(initial?.weekday ?? 2);
  const [startTime, setStartTime] = useState(initial?.startTime ?? "19:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "21:00");
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [pending, start] = useTransition();
  const uid = useId();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await withToast(
            upsertTrainingSessionAction({
              id: sessionId,
              title,
              weekday,
              startTime,
              endTime: endTime || undefined,
              venue,
              notes: notes || undefined,
            }),
            { loading: "Menyimpan latihan…", success: sessionId ? "Latihan rutin diperbarui" : "Latihan rutin ditambahkan" },
          );
          if (!res.ok) return;
          if (sessionId) onDone?.();
          else setNotes("");
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-title`}>Nama latihan</Label>
        <Input id={`${uid}-title`} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label id={`${uid}-day`}>Setiap hari</Label>
        <div role="radiogroup" aria-labelledby={`${uid}-day`} className="grid grid-cols-7 gap-1">
          {DAYS.map((d, i) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={weekday === i}
              onClick={() => setWeekday(i)}
              className={cn(
                "h-10 rounded-full text-xs font-bold transition",
                weekday === i ? "bg-navy text-white" : "bg-cream text-navy/60 hover:bg-sand",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-start`}>Mulai</Label>
          <Input id={`${uid}-start`} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-end`}>Selesai</Label>
          <Input id={`${uid}-end`} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-venue`}>Lokasi</Label>
        <Input id={`${uid}-venue`} value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="GOR Merdeka Medan" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-notes`}>Catatan (opsional)</Label>
        <Input id={`${uid}-notes`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bawa shuttle sendiri" />
      </div>
      <Button type="submit" disabled={pending} className="mt-1">
        {sessionId ? "Simpan perubahan" : "Simpan latihan rutin"}
      </Button>
      {sessionId && initial && initial.weekday !== weekday && (
        <p className="text-xs text-accent-ink">Jadwal di hari lama (dan RSVP-nya) yang belum lewat akan dihapus.</p>
      )}
    </form>
  );
}
