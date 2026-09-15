import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  Receipt,
  Shield,
  Swords,
  Trophy,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, weekdayLabel } from "@/lib/utils";
import type { LeaderboardRow } from "@/lib/stats";
import type { FeeStatus } from "@prisma/client";
import { FloatingShuttle } from "@/components/home/floating-shuttle";

function FormDots({ form }: { form: ("W" | "L")[] }) {
  if (form.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label="Form terbaru">
      {form.map((result, i) => (
        <span
          key={`${result}-${i}`}
          className={cn(
            "size-1.5 rounded-full",
            result === "W" ? "bg-emerald-500" : "bg-slate-300",
          )}
        />
      ))}
    </span>
  );
}

const feeHint: Record<Exclude<FeeStatus, "VERIFIED">, string> = {
  UNPAID: "Belum bayar",
  SUBMITTED: "Menunggu cek",
  REJECTED: "Ditolak",
};

type Attention = {
  href: string;
  label: string;
  hint: string;
  icon: typeof Swords;
  tone: "rose" | "amber" | "navy";
};

export function MemberHome({
  isAdmin,
  announcementTitle,
  fee,
  occurrence,
  goingCount,
  iAmGoing,
  pendingMatchCount,
  pendingMembers,
  pendingFees,
  rows,
  userId,
}: {
  isAdmin: boolean;
  announcementTitle: string | null;
  fee: { label: string; status: FeeStatus } | null;
  occurrence: {
    title: string;
    date: Date;
    weekday: number;
    startTime: string;
    venue: string;
  } | null;
  goingCount: number;
  iAmGoing: boolean;
  pendingMatchCount: number;
  pendingMembers: number;
  pendingFees: number;
  rows: LeaderboardRow[];
  userId?: string;
}) {
  const attention: Attention[] = [];

  if (pendingMatchCount > 0) {
    attention.push({
      href: "/play",
      label: `${pendingMatchCount} match`,
      hint: "Konfirmasi",
      icon: Swords,
      tone: "rose",
    });
  }

  if (fee && fee.status !== "VERIFIED") {
    attention.push({
      href: "/profile/iuran",
      label: fee.label,
      hint: feeHint[fee.status],
      icon: Receipt,
      tone: fee.status === "SUBMITTED" ? "amber" : "rose",
    });
  }

  if (isAdmin && (pendingMembers > 0 || pendingFees > 0)) {
    const bits: string[] = [];
    if (pendingMembers > 0) bits.push(`${pendingMembers} member`);
    if (pendingFees > 0) bits.push(`${pendingFees} iuran`);
    attention.push({
      href: "/club",
      label: "Club hub",
      hint: bits.join(" · "),
      icon: Shield,
      tone: "amber",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/jadwal"
        className="relative block overflow-hidden rounded-[32px] border border-white bg-gradient-to-br from-[#dff3fc] via-white to-[#e8f3fb] p-5 shadow-[0_16px_40px_rgba(11,42,74,0.08)]"
      >
        <div className="court-stripes absolute inset-0 opacity-60" />
        <FloatingShuttle />
        <div className="relative z-10 grid gap-4 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2eb6ea]">
              Latihan berikutnya
            </p>
            {occurrence ? (
              <>
                <p className="mt-2 text-4xl font-black tracking-tight text-[#0b2a4a]">
                  {occurrence.startTime}
                </p>
                <p className="mt-1 text-lg font-bold text-[#0b2a4a]">
                  {occurrence.title}
                </p>
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {weekdayLabel(occurrence.weekday)} ·{" "}
                    {format(occurrence.date, "d MMM", { locale: localeId })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {occurrence.venue}
                  </span>
                </p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {iAmGoing
                      ? `Kamu RSVP · ${goingCount} orang`
                      : `${goingCount} sudah RSVP`}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#2eb6ea] px-3 py-1.5 text-xs font-bold text-white">
                    {iAmGoing ? "Lihat jadwal" : "RSVP"}
                    <ChevronRight className="size-3.5" />
                  </span>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Belum ada jadwal minggu ini
              </p>
            )}
          </div>
          <div className="relative mx-auto h-44 w-full max-w-[220px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/hero-racket-shuttle.png"
              alt=""
              className="float-y absolute inset-0 size-full object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </Link>

      {announcementTitle && (
        <p className="px-1 text-sm text-slate-500">
          <span className="font-bold text-[#2eb6ea]">Pengumuman · </span>
          <span className="text-[#0b2a4a]">{announcementTitle}</span>
        </p>
      )}

      {attention.length > 0 && (
        <div className="flex flex-col gap-2">
          {attention.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border border-white bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(11,42,74,0.06)]"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-xl",
                    item.tone === "rose" && "bg-rose-50 text-rose-600",
                    item.tone === "amber" && "bg-amber-50 text-amber-700",
                    item.tone === "navy" && "bg-[#e8f3fb] text-[#0b2a4a]",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[#0b2a4a]">
                    {item.label}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {item.hint}
                  </span>
                </span>
                <ChevronRight className="size-4 text-slate-300" />
              </Link>
            );
          })}
        </div>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="flex items-center gap-2 text-base font-black text-[#0b2a4a]">
            <Trophy className="size-4 text-[#2eb6ea]" />
            Leaderboard
          </h2>
          <Link href="/play" className="text-xs font-bold text-[#2eb6ea]">
            Play
          </Link>
        </div>
        {rows.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 items-end gap-2">
              {[rows[1], rows[0], rows[2]].map((row, visualIdx) => {
                if (!row) return <div key={visualIdx} />;
                const rank = visualIdx === 0 ? 2 : visualIdx === 1 ? 1 : 3;
                const first = rank === 1;
                return (
                  <div
                    key={row.userId}
                    className={cn(
                      "flex flex-col items-center rounded-[24px] border border-white bg-white text-center shadow-[0_8px_24px_rgba(11,42,74,0.06)]",
                      first
                        ? "border-[#2eb6ea] bg-gradient-to-b from-[#dff3fc] to-white px-2 pb-5 pt-4"
                        : "px-2 pb-4 pt-3",
                    )}
                  >
                    <p className="mb-1 text-[11px] font-black text-[#2eb6ea]">
                      #{rank}
                    </p>
                    <Avatar className={first ? "size-14" : "size-11"}>
                      <AvatarImage src={row.imageUrl ?? undefined} alt="" />
                      <AvatarFallback>
                        {row.nickname.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="mt-2 w-full truncate text-sm font-bold text-[#0b2a4a]">
                      {row.nickname}
                    </p>
                    <p
                      className={cn(
                        "font-black text-[#2eb6ea]",
                        first ? "score-glow text-lg" : "text-base",
                      )}
                    >
                      {row.winrate}%
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {row.wins}W · {row.losses}L
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-0.5 rounded-[24px] border border-white bg-white p-2 shadow-[0_8px_24px_rgba(11,42,74,0.06)]">
              {rows.map((row, i) => (
                <div
                  key={row.userId}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5",
                    row.userId === userId &&
                      "bg-[#e8f3fb] ring-1 ring-[#2eb6ea]/40",
                  )}
                >
                  <span className="w-6 text-center text-sm font-black text-[#2eb6ea]">
                    {i + 1}
                  </span>
                  <Avatar className="size-9">
                    <AvatarImage src={row.imageUrl ?? undefined} alt="" />
                    <AvatarFallback>{row.nickname.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0b2a4a]">
                      {row.nickname}
                    </p>
                    <p className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>
                        {row.wins}W · {row.losses}L
                      </span>
                      <FormDots form={row.form} />
                    </p>
                  </div>
                  <p className="text-sm font-black text-[#0b2a4a]">
                    {row.winrate}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="px-1 text-sm text-slate-500">Belum ada ranking</p>
        )}
      </section>
    </div>
  );
}
