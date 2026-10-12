"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { reviewMatchAction } from "@/actions/matches";
import { withToast } from "@/lib/with-toast";

/** Admin approve / reject for a recorded match; for a reported one, keep or delete. */
export function ReviewMatchButtons({ matchId, compact = false, disputed = false }: { matchId: string; compact?: boolean; disputed?: boolean }) {
  const [pending, start] = useTransition();
  function review(decision: "APPROVE" | "REJECT") {
    if (decision === "REJECT" && !window.confirm(disputed ? "Hapus match ini? Pemain diminta mencatat ulang." : "Tolak dan hapus skor match ini?")) return;
    start(async () => {
      await withToast(reviewMatchAction(matchId, decision), {
        loading: decision === "APPROVE" ? "Mengesahkan…" : "Menolak…",
        success: disputed
          ? decision === "APPROVE"
            ? "Skor dipertahankan"
            : "Match dihapus"
          : decision === "APPROVE"
            ? "Match disahkan, masuk leaderboard"
            : "Skor ditolak",
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
        <Check className="size-4" /> {disputed ? "Skor sudah benar" : compact ? "Sahkan" : "Sahkan skor"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => review("REJECT")}
        aria-label={disputed ? "Hapus match" : "Tolak skor"}
        className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-cream px-4 text-sm font-bold text-navy/70 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
      >
        <X className="size-4" />
        {!compact && (disputed ? "Hapus" : "Tolak")}
      </button>
    </div>
  );
}
