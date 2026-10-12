"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { withToast } from "@/lib/with-toast";
import { verifyFeeAction } from "@/actions/iuran";
import { cn } from "@/lib/utils";

const REASONS = ["Bukti tidak jelas", "Nominal tidak sesuai", "Bukan bukti transfer"];

/** Verify a submitted proof, or reject it with a reason the member sees. */
export function VerifyFeeButtons({ dueId }: { dueId: string }) {
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);

  if (rejecting) {
    return (
      <form
        className="flex flex-col gap-2 rounded-2xl bg-rose-50 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            await withToast(verifyFeeAction(dueId, false, reason), { success: "Bukti ditolak, member diminta upload ulang" });
          });
        }}
      >
        <p className="text-sm font-bold text-rose-700">Alasan penolakan</p>
        <div className="flex flex-wrap gap-1.5">
          {REASONS.map((r) => (
            <button key={r} type="button" onClick={() => setReason(r)} className={cn("h-8 rounded-full px-3 text-xs font-bold", reason === r ? "bg-rose-600 text-white" : "bg-white text-rose-700")}>
              {r}
            </button>
          ))}
        </div>
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} required aria-label="Alasan penolakan" className="h-10 rounded-xl border border-rose-200 bg-white px-3 text-sm text-navy outline-none focus:ring-2 focus:ring-rose-300" />
        <div className="flex gap-2">
          <button type="button" onClick={() => setRejecting(false)} disabled={pending} className="h-10 flex-1 rounded-full bg-white text-sm font-bold text-navy/70">
            Batal
          </button>
          <button type="submit" disabled={pending || !reason.trim()} className="h-10 flex-1 rounded-full bg-rose-600 text-sm font-bold text-white disabled:opacity-50">
            Tolak bukti
          </button>
        </div>
      </form>
    );
  }
  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await withToast(verifyFeeAction(dueId, true), { success: "Iuran diverifikasi" });
          })
        }
        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-accent text-sm font-bold text-navy shadow-[0_6px_14px_rgba(238,159,72,0.35)] transition hover:bg-accent-2 disabled:opacity-60"
      >
        <Check className="size-4" /> Verifikasi
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setRejecting(true)}
        className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-cream px-4 text-sm font-bold text-navy/70 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
      >
        <X className="size-4" /> Tolak
      </button>
    </div>
  );
}
