"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Wallet } from "lucide-react";
import { setEventFeePaidAction } from "@/actions/events";
import { withToast } from "@/lib/with-toast";
import { formatRp, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type FeeRow = { rsvpId: string; name: string; avatar: string; paid: boolean; going: boolean };

/** Admin: who has paid the event fee, toggled per participant. */
export function EventFeePanel({ fee, rows }: { fee: number; rows: FeeRow[] }) {
  const [optimistic, setPaid] = useOptimistic(rows, (state, { rsvpId, paid }: { rsvpId: string; paid: boolean }) =>
    state.map((r) => (r.rsvpId === rsvpId ? { ...r, paid } : r)),
  );
  const [, start] = useTransition();
  const paidCount = optimistic.filter((r) => r.paid).length;
  const goingCount = optimistic.filter((r) => r.going).length;

  return (
    <section className="flex flex-col gap-3 rounded-[26px] border border-accent/40 bg-white/90 p-4 shadow-[0_10px_28px_rgba(14,44,60,0.06)]">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink">
          <Wallet className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-navy">Pembayaran</h2>
          <p className="text-sm text-slate-500">
            {formatRp(paidCount * fee)} terkumpul · {paidCount}/{goingCount} lunas
          </p>
        </div>
        <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-bold text-navy">Admin</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${goingCount ? Math.min(100, (paidCount / goingCount) * 100) : 0}%` }} />
      </div>
      {optimistic.length === 0 ? (
        <p className="text-sm text-slate-500">Belum ada peserta.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {optimistic.map((r) => (
            <li key={r.rsvpId} className="flex items-center gap-3 rounded-2xl p-1.5">
              <Avatar className="size-9">
                <AvatarImage src={r.avatar} alt="" />
                <AvatarFallback className="text-navy">{r.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">
                {r.name}
                {!r.going && <span className="ml-1.5 text-xs font-medium text-slate-400">tidak ikut lagi</span>}
              </span>
              <button
                type="button"
                aria-pressed={r.paid}
                onClick={() =>
                  start(async () => {
                    setPaid({ rsvpId: r.rsvpId, paid: !r.paid });
                    await withToast(setEventFeePaidAction(r.rsvpId, !r.paid), { success: !r.paid ? `${r.name} lunas` : "Ditandai belum bayar" });
                  })
                }
                className={cn(
                  "inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-bold transition active:scale-95",
                  r.paid ? "bg-emerald-100 text-emerald-700" : "bg-cream text-navy/60 hover:bg-sand",
                )}
              >
                {r.paid ? (
                  <>
                    <Check className="size-3.5" /> Lunas
                  </>
                ) : (
                  "Belum bayar"
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
