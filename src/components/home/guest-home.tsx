import Link from "next/link";
import { id as localeId } from "date-fns/locale";
import { Swords, Users } from "lucide-react";
import type { LeaderboardRow } from "@/lib/stats";
import { formatClub } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  Headline,
  LeaderboardSpotlight,
  NextTrainingCard,
  SectionHeader,
  type NextTraining,
} from "@/components/home/home-sections";

export type GuestMatch = {
  id: string;
  type: string;
  playedAt: Date;
  score: string;
  team1: string;
  team2: string;
  team1Won: boolean;
};

export type GuestPhoto = { id: string; imageUrl: string; alt: string };

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function GuestHome({
  occurrence,
  goingCount,
  rows,
  memberCount,
  matches,
  photos,
}: {
  occurrence: NextTraining | null;
  goingCount: number;
  rows: LeaderboardRow[];
  memberCount: number;
  matches: GuestMatch[];
  photos: GuestPhoto[];
}) {
  return (
    <div className="flex flex-col gap-7 pt-2">
      <div className="flex flex-col gap-3">
        <Headline lead="Main bareng," highlight="naik level" tail="bareng PB Wisdom." delay={0} />
        <div className="rise flex flex-wrap gap-2" style={rise(1)}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-navy shadow-sm">
            <Users className="size-3.5 text-accent-ink" /> {memberCount} member
          </span>
          <span className="inline-flex items-center rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white">
            Medan · sejak 2023
          </span>
        </div>
      </div>

      <LeaderboardSpotlight rows={rows} delay={2} />

      <NextTrainingCard occurrence={occurrence} goingCount={goingCount} iAmGoing={false} delay={3} />

      {matches.length > 0 && (
        <section>
          <SectionHeader title="Match terbaru" delay={4} />
          <div className="flex flex-col gap-2">
            {matches.slice(0, 3).map((m, i) => (
              <div
                key={m.id}
                className="rise flex items-center gap-3 rounded-[24px] border border-white bg-white/90 p-3 shadow-[0_8px_24px_rgba(14,44,60,0.05)]"
                style={rise(5 + i)}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sand text-navy">
                  <Swords className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy">
                    <span className={cn(m.team1Won && "text-accent-ink")}>{m.team1}</span>
                    <span className="mx-1.5 font-medium text-navy/35">vs</span>
                    <span className={cn(!m.team1Won && "text-accent-ink")}>{m.team2}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {m.type === "DOUBLES" ? "Ganda" : "Tunggal"} · {formatClub(m.playedAt, "d MMM", { locale: localeId })}
                  </p>
                </div>
                <span className="font-display shrink-0 text-sm font-extrabold text-navy">{m.score}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {photos.length > 0 && (
        <section>
          <SectionHeader title="Momen klub" href="/events" delay={8} />
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {photos.map((p, i) => (
              <Link
                key={p.id}
                href="/events"
                className="rise relative h-36 w-48 shrink-0 snap-start overflow-hidden rounded-[26px] border-4 border-white shadow-[0_12px_28px_rgba(14,44,60,0.12)]"
                style={rise(9 + i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={p.alt} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
