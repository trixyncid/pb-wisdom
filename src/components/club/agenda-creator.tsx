"use client";

import { useState } from "react";
import { CalendarDays, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { TrainingSessionForm } from "@/components/club/training-session-form";
import { CreateEventForm } from "@/components/club/create-event-form";

const TABS = [
  { key: "event", label: "Event / kegiatan", icon: Sparkles },
  { key: "latihan", label: "Latihan rutin", icon: CalendarDays },
] as const;

/** Add to the agenda: a one-off event of any type, or a weekly training. */
export function AgendaCreator() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("event");
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Jenis agenda" className="flex gap-1 rounded-full bg-cream p-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={cn("relative flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-bold transition-colors", active ? "text-white" : "text-navy/60 hover:text-navy")}
            >
              {active && (
                <motion.span
                  layoutId="agenda-tab"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-navy shadow-[0_8px_18px_rgba(14,44,60,0.22)]"
                />
              )}
              <Icon className="relative size-4" />
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{tab === "event" ? <CreateEventForm /> : <TrainingSessionForm />}</div>
    </div>
  );
}
