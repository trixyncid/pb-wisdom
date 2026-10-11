import { CalendarDays, PartyPopper, Sparkles, Swords, Trophy } from "lucide-react";
import type { EventType } from "@prisma/client";

// Display names, icons and colors for everything on the club agenda: weekly
// training ("LATIHAN") plus the one-off event types.
export type AgendaKind = "LATIHAN" | EventType;

export const AGENDA_KINDS: Record<
  AgendaKind,
  { label: string; icon: React.ComponentType<{ className?: string }>; chip: string; dot: string }
> = {
  LATIHAN: { label: "Latihan", icon: CalendarDays, chip: "bg-navy text-white", dot: "bg-navy" },
  SPARRING: { label: "Sparring", icon: Swords, chip: "bg-accent text-navy", dot: "bg-accent" },
  TOURNAMENT: { label: "Turnamen", icon: Trophy, chip: "bg-brown text-white", dot: "bg-brown" },
  GATHERING: { label: "Gathering", icon: PartyPopper, chip: "bg-accent-soft text-accent-ink", dot: "bg-accent-ink" },
  OTHER: { label: "Lainnya", icon: Sparkles, chip: "bg-sand text-navy", dot: "bg-navy/40" },
};

export const EVENT_TYPES: EventType[] = ["SPARRING", "TOURNAMENT", "GATHERING", "OTHER"];

/** URL filter value <-> kind ("latihan", "sparring", ...). */
export const KIND_FILTERS = ["semua", "latihan", "sparring", "tournament", "gathering", "other"] as const;
export type KindFilter = (typeof KIND_FILTERS)[number];

export function filterToKind(f: KindFilter): AgendaKind | null {
  return f === "semua" ? null : (f.toUpperCase() as AgendaKind);
}
