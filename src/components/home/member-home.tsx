import { Megaphone, Receipt, Shield, Swords } from "lucide-react";
import type { FeeStatus } from "@prisma/client";
import type { LeaderboardRow } from "@/lib/stats";
import {
  AttentionList,
  LeaderboardList,
  NextTrainingCard,
  Podium,
  SectionHeader,
  type AttentionItem,
  type NextTraining,
} from "@/components/home/home-sections";

const feeHint: Record<Exclude<FeeStatus, "VERIFIED">, string> = {
  UNPAID: "Belum dibayar, upload bukti transfer",
  SUBMITTED: "Bukti sedang dicek admin",
  REJECTED: "Bukti ditolak, upload ulang",
};

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

// Kept deliberately short: greeting, next training, only what needs action,
// and a leaderboard preview. Everything else is one tap away in the nav.
export function MemberHome({
  firstName,
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
  firstName: string;
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
  const attention: AttentionItem[] = [];
  if (pendingMatchCount > 0) {
    attention.push({
      href: "/play",
      title: `${pendingMatchCount} match perlu dikonfirmasi`,
      hint: "Cek skor yang dicatat lawanmu",
      icon: Swords,
      tone: "alert",
    });
  }
  if (fee && fee.status !== "VERIFIED") {
    attention.push({
      href: "/profile/iuran",
      title: `Iuran ${fee.label}`,
      hint: feeHint[fee.status],
      icon: Receipt,
      tone: fee.status === "SUBMITTED" ? "warm" : "alert",
    });
  }
  if (announcementTitle) {
    attention.push({ href: "/notifications", title: announcementTitle, hint: "Pengumuman klub", icon: Megaphone, tone: "warm" });
  }
  if (isAdmin && (pendingMembers > 0 || pendingFees > 0)) {
    const bits: string[] = [];
    if (pendingMembers > 0) bits.push(`${pendingMembers} member baru`);
    if (pendingFees > 0) bits.push(`${pendingFees} bukti iuran`);
    attention.push({ href: "/club", title: "Perlu ditinjau admin", hint: bits.join(" · "), icon: Shield, tone: "navy" });
  }

  return (
    <div className="flex flex-col gap-7 pt-2">
      <div className="rise" style={rise(0)}>
        <p className="text-base font-medium text-navy/55">Halo, {firstName}</p>
        <h1 className="font-display mt-0.5 text-[2.1rem] font-extrabold leading-[1.05] text-navy">
          Siap{" "}
          <span className="relative inline-block">
            <span className="relative z-10">smash</span>
            <span aria-hidden className="absolute inset-x-[-4px] bottom-1 z-0 h-3 rounded-full bg-accent/60" />
          </span>{" "}
          <span className="text-navy/40">hari ini?</span>
        </h1>
      </div>

      <NextTrainingCard occurrence={occurrence} goingCount={goingCount} iAmGoing={iAmGoing} delay={1} />

      <AttentionList items={attention} delay={2} />

      <section>
        <SectionHeader title="Leaderboard" href="/play" delay={5} />
        {rows.length > 0 ? (
          <div className="flex flex-col gap-3">
            <Podium rows={rows.slice(0, 3)} delay={6} />
            <LeaderboardList rows={rows.slice(3, 6)} startRank={4} userId={userId} delay={7} />
          </div>
        ) : (
          <p className="px-1 text-sm text-slate-500">Belum ada ranking. Catat match pertamamu!</p>
        )}
      </section>
    </div>
  );
}
