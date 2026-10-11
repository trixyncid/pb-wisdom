import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Megaphone,
  Receipt,
  Shield,
  Swords,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import type { FeeStatus } from "@prisma/client";
import type { LeaderboardRow } from "@/lib/stats";
import {
  Headline,
  LeaderboardList,
  NextTrainingCard,
  Podium,
  SectionHeader,
  TileRow,
  type NextTraining,
  type Tile,
} from "@/components/home/home-sections";

const feeHint: Record<FeeStatus, string> = {
  UNPAID: "Belum bayar",
  SUBMITTED: "Menunggu cek",
  REJECTED: "Bukti ditolak",
  VERIFIED: "Lunas",
};

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

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
  occurrence: NextTraining | null;
  goingCount: number;
  iAmGoing: boolean;
  pendingMatchCount: number;
  pendingMembers: number;
  pendingFees: number;
  rows: LeaderboardRow[];
  userId?: string;
}) {
  const tiles: Tile[] = [
    {
      href: "/play",
      label: "Match",
      hint: pendingMatchCount > 0 ? "Perlu konfirmasi" : "Catat skor",
      icon: Swords,
      badge: pendingMatchCount || undefined,
      tone: pendingMatchCount > 0 ? "alert" : "plain",
    },
    {
      href: "/profile/iuran",
      label: "Iuran",
      hint: fee ? `${fee.label} · ${feeHint[fee.status]}` : "Tidak ada tagihan",
      icon: Receipt,
      tone: fee && (fee.status === "UNPAID" || fee.status === "REJECTED") ? "alert" : "warm",
    },
    { href: "/events", label: "Events", hint: "Sparring & album", icon: Trophy },
  ];

  const adminBits: string[] = [];
  if (isAdmin && pendingMembers > 0) adminBits.push(`${pendingMembers} member baru`);
  if (isAdmin && pendingFees > 0) adminBits.push(`${pendingFees} bukti iuran`);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <Headline lead="Siap" highlight="smash" tail="hari ini?" delay={0} />

      <div className="rise flex items-center gap-2" style={rise(1)}>
        <Link
          href="/play"
          className="flex h-12 flex-1 items-center justify-center rounded-full border-2 border-accent bg-white/80 px-4 text-sm font-bold text-navy transition hover:bg-accent-soft"
        >
          Catat match
        </Link>
        {[
          { href: "/jadwal", label: "Jadwal", icon: CalendarDays },
          { href: "/directory", label: "Member", icon: Users },
          { href: "/profile", label: "Profil", icon: UserRound },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white bg-white/90 text-navy shadow-[0_6px_18px_rgba(14,44,60,0.07)] transition hover:-translate-y-0.5 hover:bg-white"
          >
            <Icon className="size-5" />
          </Link>
        ))}
      </div>

      <NextTrainingCard occurrence={occurrence} goingCount={goingCount} iAmGoing={iAmGoing} delay={2} />

      {(announcementTitle || adminBits.length > 0) && (
        <div className="flex flex-col gap-2">
          {announcementTitle && (
            <div
              className="rise flex items-center gap-3 rounded-[24px] border border-white bg-white/90 p-3 shadow-[0_8px_24px_rgba(14,44,60,0.05)]"
              style={rise(3)}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                <Megaphone className="size-[18px]" />
              </span>
              <p className="min-w-0 text-sm text-navy">
                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-accent-ink">Pengumuman</span>
                <span className="line-clamp-2 font-medium">{announcementTitle}</span>
              </p>
            </div>
          )}
          {adminBits.length > 0 && (
            <Link
              href="/club"
              className="rise flex items-center gap-3 rounded-full bg-navy p-1.5 pr-4 text-white shadow-[0_12px_28px_rgba(14,44,60,0.25)]"
              style={rise(3)}
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-accent text-navy">
                <Shield className="size-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{adminBits.join(" · ")}</span>
              <ChevronRight className="size-4 text-white/60" />
            </Link>
          )}
        </div>
      )}

      <TileRow tiles={tiles} delay={4} />

      <section>
        <SectionHeader title="Leaderboard" href="/play" delay={7} />
        {rows.length > 0 ? (
          <div className="flex flex-col gap-3">
            <Podium rows={rows.slice(0, 3)} delay={8} />
            <LeaderboardList rows={rows.slice(3)} startRank={4} userId={userId} delay={9} />
          </div>
        ) : (
          <p className="px-1 text-sm text-slate-500">Belum ada ranking. Catat match pertamamu!</p>
        )}
      </section>
    </div>
  );
}
