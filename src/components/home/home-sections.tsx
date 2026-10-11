import Link from "next/link";
import Image from "next/image";
import { id as localeId } from "date-fns/locale";
import { ArrowUpRight, CalendarDays, MapPin, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, weekdayLabel } from "@/lib/utils";
import { formatClub } from "@/lib/time";
import type { LeaderboardRow } from "@/lib/stats";
import shuttle3d from "@/assets/3d/shuttle.png";
import racket3d from "@/assets/3d/racket.png";
import trophy3d from "@/assets/3d/trophy.png";

// Shared building blocks for the member and guest home views. Sections take a
// `delay` index for the staggered entrance (.rise in globals.css).

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function Headline({
  lead,
  highlight,
  tail,
  delay = 0,
}: {
  lead: string;
  highlight: string;
  tail: string;
  delay?: number;
}) {
  return (
    <h1 className="font-display rise text-[2.35rem] font-extrabold leading-[1.02] text-navy sm:text-5xl" style={rise(delay)}>
      {lead}{" "}
      <span className="relative inline-block">
        <span className="relative z-10">{highlight}</span>
        <span aria-hidden className="absolute inset-x-[-4px] bottom-1 z-0 h-3 rounded-full bg-accent/60" />
      </span>
      <br />
      <span className="font-semibold text-navy/40">{tail}</span>
    </h1>
  );
}

export type NextTraining = {
  title: string;
  date: Date;
  weekday: number;
  startTime: string;
  venue: string;
};

/** The big orange card: next training session, with floating 3D props. */
export function NextTrainingCard({
  occurrence,
  goingCount,
  iAmGoing,
  delay = 0,
}: {
  occurrence: NextTraining | null;
  goingCount: number;
  iAmGoing: boolean;
  delay?: number;
}) {
  return (
    <section className="rise relative" style={rise(delay)}>
      <Link
        href="/jadwal"
        className="group relative block overflow-hidden rounded-[32px] bg-gradient-to-br from-[#f6b46a] via-accent to-[#e48b33] p-5 pr-28 text-navy shadow-[0_22px_48px_rgba(238,159,72,0.38)] transition-transform duration-300 hover:-translate-y-0.5 sm:pr-44"
      >
        {/* court lines */}
        <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.16]" preserveAspectRatio="none" viewBox="0 0 400 200">
          <path d="M0 150 L400 60 M0 190 L400 100 M120 0 L170 200 M300 0 L330 200" stroke="white" strokeWidth="3" fill="none" />
        </svg>
        <div className="relative flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy text-accent shadow-lg">
            <CalendarDays className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-navy/70">Latihan berikutnya</p>
            {occurrence ? (
              <>
                <p className="font-display mt-0.5 text-4xl font-extrabold leading-none">{occurrence.startTime}</p>
                <p className="mt-1 truncate text-base font-bold">{occurrence.title}</p>
              </>
            ) : (
              <p className="mt-1 text-base font-bold">Belum ada jadwal minggu ini</p>
            )}
          </div>
        </div>
        {occurrence && (
          <p className="relative mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px] font-medium text-navy/80">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {weekdayLabel(occurrence.weekday)}, {formatClub(occurrence.date, "d MMM", { locale: localeId })}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{occurrence.venue}</span>
            </span>
          </p>
        )}
        <span className="relative mt-4 flex h-11 items-center justify-center gap-1.5 rounded-full bg-white text-sm font-bold text-navy shadow-[0_8px_18px_rgba(14,44,60,0.12)] transition group-hover:bg-cream sm:max-w-sm">
          {occurrence ? (
            iAmGoing ? (
              <>Kamu ikut · {goingCount} orang</>
            ) : (
              <>
                <Plus className="size-4" /> RSVP sekarang · {goingCount} ikut
              </>
            )
          ) : (
            <>Lihat jadwal</>
          )}
        </span>
      </Link>
      {/* 3D props break out of the card's top-right corner */}
      <Image
        src={shuttle3d}
        alt=""
        width={150}
        height={161}
        preload
        className="float-tilt prop-shadow pointer-events-none absolute -right-2 -top-7 w-[112px] sm:-top-10 sm:w-[150px]"
      />
      <Image
        src={racket3d}
        alt=""
        width={92}
        height={163}
        className="float-tilt-rev prop-shadow pointer-events-none absolute -bottom-3 right-12 w-[62px] rotate-[18deg] sm:-bottom-6 sm:right-[150px] sm:w-[80px] sm:rotate-[38deg]"
      />
    </section>
  );
}

export function SectionHeader({
  title,
  href,
  linkLabel = "Lihat semua",
  delay = 0,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  delay?: number;
}) {
  return (
    <div className="rise mb-3 flex items-baseline justify-between px-1" style={rise(delay)}>
      <h2 className="font-display text-xl font-bold text-navy">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-medium text-navy/50 transition hover:text-navy">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function FormDots({ form }: { form: ("W" | "L")[] }) {
  if (form.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Form: ${form.join(" ")}`}>
      {form.map((r, i) => (
        <span key={`${r}-${i}`} className={cn("size-1.5 rounded-full", r === "W" ? "bg-emerald-500" : "bg-navy/20")} />
      ))}
    </span>
  );
}

/** Top three, #1 raised in the middle with the 3D trophy behind them. */
export function Podium({ rows, delay = 0 }: { rows: LeaderboardRow[]; delay?: number }) {
  if (rows.length === 0) return null;
  const order = [rows[1], rows[0], rows[2]];
  return (
    <div className="rise relative grid grid-cols-3 items-end gap-2.5 pt-10" style={rise(delay)}>
      <Image
        src={trophy3d}
        alt=""
        width={84}
        height={151}
        className="float-tilt prop-shadow pointer-events-none absolute left-1/2 top-0 w-[58px] -translate-x-1/2"
      />
      {order.map((row, idx) => {
        if (!row) return <div key={idx} />;
        const rank = idx === 1 ? 1 : idx === 0 ? 2 : 3;
        const first = rank === 1;
        return (
          <div
            key={row.userId}
            className={cn(
              "relative flex flex-col items-center rounded-[26px] px-2 text-center",
              first
                ? "z-10 bg-navy pb-5 pt-9 text-white shadow-[0_20px_40px_rgba(14,44,60,0.3)]"
                : "border border-white bg-white/90 pb-4 pt-4 text-navy shadow-[0_10px_28px_rgba(14,44,60,0.06)]",
            )}
          >
            {!first && (
              <span className="font-display absolute -top-3 flex size-7 items-center justify-center rounded-full bg-sand text-sm font-extrabold text-navy ring-4 ring-cream">
                {rank}
              </span>
            )}
            <Avatar className={cn(first ? "size-16 ring-4 ring-accent" : "size-12 ring-2 ring-white")}>
              <AvatarImage src={row.imageUrl ?? undefined} alt="" />
              <AvatarFallback className="text-navy">{row.nickname.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <p className="mt-2 w-full truncate text-sm font-bold">{row.nickname}</p>
            <p className={cn("font-display font-extrabold", first ? "text-2xl text-accent" : "text-lg text-accent-ink")}>
              {row.winrate}%
            </p>
            <p className={cn("text-[11px]", first ? "text-white/60" : "text-slate-500")}>
              {row.wins}W · {row.losses}L
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** Ranked rows as rounded cards (the reference's task list). */
export function LeaderboardList({
  rows,
  startRank,
  userId,
  delay = 0,
}: {
  rows: LeaderboardRow[];
  startRank: number;
  userId?: string;
  delay?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <Link
          key={row.userId}
          href="/play"
          style={rise(delay + i)}
          className={cn(
            "rise group flex items-center gap-3 rounded-[24px] border bg-white/90 p-2.5 pr-3 shadow-[0_8px_24px_rgba(14,44,60,0.05)] transition hover:bg-white",
            row.userId === userId ? "border-accent/60" : "border-white",
          )}
        >
          <span className="font-display w-7 text-center text-base font-extrabold text-navy/35">{startRank + i}</span>
          <Avatar className="size-11">
            <AvatarImage src={row.imageUrl ?? undefined} alt="" />
            <AvatarFallback className="text-navy">{row.nickname.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-navy">
              {row.nickname}
              {row.userId === userId && <span className="ml-1.5 text-xs font-semibold text-accent-ink">kamu</span>}
            </p>
            <p className="flex items-center gap-2 text-xs text-slate-500">
              {row.wins}W · {row.losses}L <FormDots form={row.form} />
            </p>
          </div>
          <span className="font-display text-lg font-extrabold text-navy">{row.winrate}%</span>
          <span className="flex size-8 items-center justify-center rounded-full border border-navy/10 text-navy/50 transition group-hover:border-accent group-hover:text-accent-ink">
            <ArrowUpRight className="size-4" />
          </span>
        </Link>
      ))}
    </div>
  );
}

/** Public home: the leaderboard as the star of the page (dark, with trophy). */
export function LeaderboardSpotlight({ rows, delay = 0 }: { rows: LeaderboardRow[]; delay?: number }) {
  const [first, second, third] = rows;
  const rest = rows.slice(3, 8);
  return (
    <section
      className="rise relative overflow-hidden rounded-[34px] bg-navy px-4 pb-5 pt-6 text-white shadow-[0_26px_56px_rgba(14,44,60,0.35)]"
      style={rise(delay)}
    >
      <div aria-hidden className="absolute -right-16 -top-20 size-64 rounded-full bg-accent/30 blur-3xl" />
      <div aria-hidden className="absolute -bottom-24 -left-16 size-56 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Leaderboard</p>
          <h2 className="font-display mt-1 text-[1.75rem] font-extrabold leading-tight">Juara minggu ini</h2>
          <p className="mt-1 text-sm text-white/60">Winrate dari match yang dikonfirmasi</p>
        </div>
        <Image
          src={trophy3d}
          alt=""
          width={96}
          height={172}
          preload
          className="float-tilt pointer-events-none -mt-3 w-[74px] shrink-0 drop-shadow-[0_18px_24px_rgba(0,0,0,0.35)]"
        />
      </div>

      {first ? (
        <>
          <div className="relative mt-5 grid grid-cols-3 items-end gap-2.5">
            {[second, first, third].map((row, idx) => {
              if (!row) return <div key={idx} />;
              const top = idx === 1;
              const rank = top ? 1 : idx === 0 ? 2 : 3;
              return (
                <div
                  key={row.userId}
                  className={cn(
                    "relative flex flex-col items-center rounded-[26px] px-2 text-center",
                    top ? "bg-accent pb-5 pt-6 text-navy shadow-[0_18px_36px_rgba(238,159,72,0.4)]" : "bg-white/[0.08] pb-4 pt-5",
                  )}
                >
                  <span
                    className={cn(
                      "font-display absolute -top-3.5 flex size-7 items-center justify-center rounded-full text-sm font-extrabold ring-4 ring-navy",
                      top ? "bg-white text-navy" : "bg-white/15 text-white",
                    )}
                  >
                    {rank}
                  </span>
                  <Avatar className={cn(top ? "size-16 ring-4 ring-white" : "size-12 ring-2 ring-white/30")}>
                    <AvatarImage src={row.imageUrl ?? undefined} alt="" />
                    <AvatarFallback className="text-navy">{row.nickname.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <p className="mt-2 w-full truncate text-sm font-bold">{row.nickname}</p>
                  <p className={cn("font-display font-extrabold", top ? "text-2xl" : "text-lg text-accent")}>{row.winrate}%</p>
                  <p className={cn("text-[11px]", top ? "text-navy/70" : "text-white/50")}>
                    {row.wins}W · {row.losses}L
                  </p>
                </div>
              );
            })}
          </div>

          {rest.length > 0 && (
            <ol className="relative mt-4 flex flex-col gap-1.5">
              {rest.map((row, i) => (
                <li key={row.userId} className="flex items-center gap-3 rounded-[20px] bg-white/[0.06] p-2 pr-3">
                  <span className="font-display w-6 text-center text-sm font-extrabold text-white/40">{i + 4}</span>
                  <Avatar className="size-9">
                    <AvatarImage src={row.imageUrl ?? undefined} alt="" />
                    <AvatarFallback className="text-navy">{row.nickname.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{row.nickname}</span>
                  <span className="text-xs text-white/50">
                    {row.wins}W · {row.losses}L
                  </span>
                  <span className="font-display w-14 text-right text-base font-extrabold text-accent">{row.winrate}%</span>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <p className="relative mt-5 text-sm text-white/70">Belum ada ranking. Match pertama menunggu!</p>
      )}

      <Link
        href="/play"
        className="relative mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-navy transition hover:bg-cream"
      >
        Gabung &amp; masuk ranking <ArrowUpRight className="size-4" />
      </Link>
    </section>
  );
}

export type AttentionItem = {
  href: string;
  title: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "alert" | "warm" | "navy";
};

/** Only what needs action now; renders nothing when all is clear. */
export function AttentionList({ items, delay = 0 }: { items: AttentionItem[]; delay?: number }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const Icon = item.icon;
        const navy = item.tone === "navy";
        return (
          <Link
            key={item.href + item.title}
            href={item.href}
            style={rise(delay + i)}
            className={cn(
              "rise flex items-center gap-3 rounded-full p-1.5 pr-4 transition hover:-translate-y-0.5",
              navy ? "bg-navy text-white shadow-[0_12px_28px_rgba(14,44,60,0.25)]" : "border border-white bg-white/90 text-navy shadow-[0_8px_24px_rgba(14,44,60,0.06)]",
            )}
          >
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full",
                item.tone === "alert" && "bg-rose-100 text-rose-600",
                item.tone === "warm" && "bg-accent-soft text-accent-ink",
                navy && "bg-accent text-navy",
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{item.title}</span>
              <span className={cn("block truncate text-xs", navy ? "text-white/60" : "text-slate-500")}>{item.hint}</span>
            </span>
            <ArrowUpRight className={cn("size-4 shrink-0", navy ? "text-white/60" : "text-navy/40")} />
          </Link>
        );
      })}
    </div>
  );
}
