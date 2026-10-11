"use client";

import { useState, useTransition } from "react";
import { upsertTrainingSessionAction } from "@/actions/jadwal";
import { withToast } from "@/lib/with-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function TrainingSessionForm() {
  const [title, setTitle] = useState("Latihan");
  const [weekday, setWeekday] = useState(2);
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await withToast(
            upsertTrainingSessionAction({
              title,
              weekday,
              startTime,
              endTime: endTime || undefined,
              venue,
              notes: notes || undefined,
            }),
            { loading: "Menyimpan latihan…", success: "Latihan rutin ditambahkan" },
          );
          if (!res.ok) return;
          setNotes("");
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="ts-title">Nama latihan</Label>
        <Input id="ts-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label id="ts-day">Setiap hari</Label>
        <div role="radiogroup" aria-labelledby="ts-day" className="grid grid-cols-7 gap-1">
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
          <Label htmlFor="ts-start">Mulai</Label>
          <Input id="ts-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ts-end">Selesai</Label>
          <Input id="ts-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ts-venue">Lokasi</Label>
        <Input id="ts-venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="GOR Merdeka Medan" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ts-notes">Catatan (opsional)</Label>
        <Input id="ts-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bawa shuttle sendiri" />
      </div>
      <Button type="submit" disabled={pending} className="mt-1">
        Simpan latihan rutin
      </Button>
    </form>
  );
}
