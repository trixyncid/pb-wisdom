"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { reviewMatchAction } from "@/actions/matches";
import { withToast } from "@/lib/with-toast";

/** Admin approve / reject for a recorded match. */
export function ReviewMatchButtons({ matchId, compact = false }: { matchId: string; compact?: boolean }) {
  const [pending, start] = useTransition();
  function review(decision: "APPROVE" | "REJECT") {
    if (decision === "REJECT" && !window.confirm("Tolak dan hapus skor match ini?")) return;
    start(async () => {
      await withToast(reviewMatchAction(matchId, decision), {
        loading: decision === "APPROVE" ? "Mengesahkan…" : "Menolak…",
        success: decision === "APPROVE" ? "Match disahkan, masuk leaderboard" : "Skor ditolak",
      });
    });
  }
  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => review("APPROVE")}
        className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-sm font-bold text-navy shadow-[0_6px_14px_rgba(238,159,72,0.35)] transition hover:bg-accent-2 disabled:opacity-60"
      >
        <Check className="size-4" /> {compact ? "Sahkan" : "Sahkan skor"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => review("REJECT")}
        aria-label="Tolak skor"
        className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-cream px-4 text-sm font-bold text-navy/70 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
      >
        <X className="size-4" />
        {!compact && "Tolak"}
      </button>
    </div>
  );
}
