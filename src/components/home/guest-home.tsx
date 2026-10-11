import Image from "next/image";
import Link from "next/link";
import { id as localeId } from "date-fns/locale";
import { CalendarDays, Swords, Trophy, Users } from "lucide-react";
import type { LeaderboardRow } from "@/lib/stats";
import { formatClub } from "@/lib/time";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/brand/logo.png";
import { HomeGuestCta } from "@/components/home/home-guest-cta";
import {
  Headline,
  LeaderboardList,
  NextTrainingCard,
  Podium,
  SectionHeader,
  TileRow,
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
    <div className="flex flex-col gap-6">
      <header className="rise flex items-center justify-between gap-3" style={rise(0)}>
        <Image src={logoImg} alt="PB Wisdom" width={96} height={73} preload className="h-auto w-[96px]" />
        <HomeGuestCta />
      </header>

      <div className="flex flex-col gap-3">
        <Headline lead="Main bareng," highlight="naik level" tail="bareng PB Wisdom." delay={1} />
        <div className="rise flex flex-wrap gap-2" style={rise(2)}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-navy shadow-sm">
            <Users className="size-3.5 text-accent-ink" /> {memberCount} member
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-navy shadow-sm">
            <Trophy className="size-3.5 text-accent-ink" /> {rows.length} di ranking
          </span>
          <span className="inline-flex items-center rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white">
            Medan · sejak 2023
          </span>
        </div>
      </div>

      <NextTrainingCard occurrence={occurrence} goingCount={goingCount} iAmGoing={false} delay={3} />

      <TileRow
        delay={4}
        tiles={[
          { href: "/jadwal", label: "Jadwal", hint: "Latihan mingguan", icon: CalendarDays },
          { href: "/events", label: "Events", hint: "Sparring & turnamen", icon: Trophy },
          { href: "/play", label: "Match", hint: "Winrate & ranking", icon: Swords },
        ]}
      />

      <section>
        <SectionHeader title="Leaderboard" delay={7} />
        {rows.length > 0 ? (
          <div className="flex flex-col gap-3">
            <Podium rows={rows.slice(0, 3)} delay={8} />
            <LeaderboardList rows={rows.slice(3)} startRank={4} delay={9} />
          </div>
        ) : (
          <p className="px-1 text-sm text-slate-500">Belum ada ranking</p>
        )}
      </section>

      {matches.length > 0 && (
        <section>
          <SectionHeader title="Match terbaru" delay={10} />
          <div className="flex flex-col gap-2">
            {matches.map((m, i) => (
              <div
                key={m.id}
                className="rise flex items-center gap-3 rounded-[24px] border border-white bg-white/90 p-3 shadow-[0_8px_24px_rgba(14,44,60,0.05)]"
                style={rise(11 + i)}
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
          <SectionHeader title="Momen klub" href="/events" delay={16} />
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {photos.map((p, i) => (
              <Link
                key={p.id}
                href="/events"
                className="rise relative h-36 w-48 shrink-0 snap-start overflow-hidden rounded-[26px] border-4 border-white shadow-[0_12px_28px_rgba(14,44,60,0.12)]"
                style={rise(17 + i)}
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
