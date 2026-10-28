import { Fragment } from "react";
import Link from "next/link";
import { id as localeId } from "date-fns/locale";
import { Clock, Flag } from "lucide-react";
import { parseGames } from "@/lib/badminton";
import { formatClub } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/** `memberId` is null for a guest: shown by name, no profile link. */
export type MatchCardPlayer = { id: string; memberId: string | null; name: string; avatar: string; team: number; won: boolean | null };

/** One match: both teams with avatars, per-game scores, winner highlighted. */
export function MatchCard({
  type,
  score,
  playedAt,
  players,
  pendingBy,
  dispute,
  unranked,
  footer,
}: {
  type: "SINGLES" | "DOUBLES";
  score: string;
  playedAt: Date;
  players: MatchCardPlayer[];
  /** Name of who recorded it, when still waiting for verification. */
  pendingBy?: string;
  /** Who reported the verified score as wrong, and why. */
  dispute?: { by: string; reason: string };
  /** Recorded as a friendly: kept in history, left out of the leaderboard. */
  unranked?: boolean;
  footer?: React.ReactNode;
}) {
  const games = parseGames(score);
  const team = (t: 1 | 2) => players.filter((p) => p.team === t);
  const won = (t: 1 | 2) => team(t).some((p) => p.won);
  return (
    <article className={cn("flex flex-col gap-3 rounded-[26px] border bg-white/90 p-3.5 shadow-[0_10px_28px_rgba(14,44,60,0.06)]", dispute ? "border-rose-300" : pendingBy ? "border-accent/40" : "border-white")}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1">
          <span className="rounded-full bg-sand px-2.5 py-0.5 font-bold text-navy">{type === "SINGLES" ? "Single" : "Ganda"}</span>
          {unranked && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-slate-500">Tidak masuk leaderboard</span>}
        </span>
        {dispute ? (
          <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
            <Flag className="size-3.5" /> Dilaporkan {dispute.by}
          </span>
        ) : pendingBy ? (
          <span className="inline-flex items-center gap-1 font-semibold text-accent-ink">
            <Clock className="size-3.5" /> Menunggu verifikasi · dicatat {pendingBy}
          </span>
        ) : (
          <span className="text-slate-400">{formatClub(playedAt, "d MMM", { locale: localeId })}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {([1, 2] as const).map((t) => (
          <div key={t} className="flex items-center gap-2.5">
            <div className="flex -space-x-2">
              {team(t).map((p) => (
                <Avatar key={p.id} className="size-8 ring-2 ring-white">
                  <AvatarImage src={p.avatar} alt="" />
                  <AvatarFallback className="text-[10px] text-navy">{p.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className={cn("min-w-0 flex-1 truncate text-sm", won(t) ? "font-bold text-navy" : "font-medium text-navy/55")}>
              {team(t).map((p, i) => (
                <Fragment key={p.id}>
                  {i > 0 && " & "}
                  {p.memberId ? (
                    <Link href={`/members/${p.memberId}`} className="hover:underline">
                      {p.name}
                    </Link>
                  ) : (
                    <>
                      {p.name} <span className="text-xs font-normal text-slate-400">(tamu)</span>
                    </>
                  )}
                </Fragment>
              ))}
            </p>
            <div className="flex gap-1">
              {games.map((g, i) => {
                const mine = g[t - 1];
                const win = mine > g[2 - t];
                return (
                  <span
                    key={i}
                    className={cn(
                      "font-display flex h-7 w-8 items-center justify-center rounded-lg text-sm font-extrabold tabular-nums",
                      win ? "bg-navy text-white" : "bg-cream text-navy/45",
                    )}
                  >
                    {mine}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {dispute && <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">“{dispute.reason}”</p>}
      {footer}
    </article>
  );
}
