"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { upsertTrainingSessionAction } from "@/actions/jadwal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TrainingSessionForm() {
  const [title, setTitle] = useState("Latihan");
  const [weekday, setWeekday] = useState("2");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");
  const [venue, setVenue] = useState("GOR Merdeka Medan");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await upsertTrainingSessionAction({
            title,
            weekday: Number(weekday),
            startTime,
            endTime,
            venue,
            notes: notes || undefined,
          });
          toast.success("Jadwal disimpan");
        });
      }}
    >
      <div className="space-y-1">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label>Weekday</Label>
          <select
            className="h-11 w-full rounded-xl border border-[#0b2a4a]/10 bg-[#f3f8fc] px-2 text-sm text-[#0b2a4a]"
            value={weekday}
            onChange={(e) => setWeekday(e.target.value)}
          >
            {["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"].map((d, i) => (
              <option key={d} value={i} className="bg-white">{d}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Start</Label>
          <Input value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>End</Label>
          <Input value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Venue</Label>
        <Input value={venue} onChange={(e) => setVenue(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending}>
        Save session
      </Button>
    </form>
  );
}
