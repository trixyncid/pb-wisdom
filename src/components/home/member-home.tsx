import type { LeaderboardRow } from "@/lib/stats";
import {
  LeaderboardSpotlight,
  NextTrainingCard,
  type NextTraining,
} from "@/components/home/home-sections";

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

// Greeting, next training and the leaderboard. Notifications (matches to
// confirm, iuran, announcements, admin queues) live behind the bell.
export function MemberHome({
  firstName,
  occurrence,
  goingCount,
  iAmGoing,
  rows,
  userId,
}: {
  firstName: string;
  occurrence: NextTraining | null;
  goingCount: number;
  iAmGoing: boolean;
  rows: LeaderboardRow[];
  userId?: string;
}) {
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

      <LeaderboardSpotlight
        rows={rows}
        userId={userId}
        title="Papan juara klub"
        ctaLabel="Lihat semua & catat match"
        delay={2}
      />
    </div>
  );
}
