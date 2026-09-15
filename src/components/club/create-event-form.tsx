"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createEventAction } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventType } from "@prisma/client";

export function CreateEventForm() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("SPARRING");
  const [startsAt, setStartsAt] = useState("2026-09-28T16:00");
  const [location, setLocation] = useState("GOR Merdeka Medan");
  const [capacity, setCapacity] = useState("24");
  const [extraFee, setExtraFee] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await createEventAction({
            title,
            type,
            startsAt,
            location,
            capacity: capacity ? Number(capacity) : undefined,
            extraFee: extraFee ? Number(extraFee) : undefined,
            notes: notes || undefined,
          });
          toast.success("Event dibuat");
          setTitle("");
        });
      }}
    >
      <div className="space-y-1">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Type</Label>
          <select
            className="h-11 w-full rounded-xl border border-[#0b2a4a]/10 bg-[#f3f8fc] px-2 text-sm text-[#0b2a4a]"
            value={type}
            onChange={(e) => setType(e.target.value as EventType)}
          >
            {["SPARRING", "TOURNAMENT", "GATHERING", "OTHER"].map((t) => (
              <option key={t} value={t} className="bg-white">
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Starts at</Label>
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Location</Label>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Capacity</Label>
          <Input value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Extra fee</Label>
          <Input value={extraFee} onChange={(e) => setExtraFee(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending}>
        Create event
      </Button>
    </form>
  );
}
