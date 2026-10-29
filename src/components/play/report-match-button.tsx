"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { reportMatchAction } from "@/actions/matches";
import { withToast } from "@/lib/with-toast";
import { REPORT_WINDOW_DAYS } from "@/lib/match-report";

/** Player: report a verified score as wrong, with a short reason for the admin. */
export function ReportMatchButton({ matchId }: { matchId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-navy/45 transition hover:text-rose-600">
        <Flag className="size-3.5" /> Skor salah? Laporkan
      </button>
    );
  }
  return (
    <form
      className="flex flex-col gap-2 rounded-2xl bg-cream p-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await withToast(reportMatchAction(matchId, reason), { loading: "Mengirim laporan…", success: "Laporan dikirim ke admin" });
          if (res.ok) setOpen(false);
        });
      }}
    >
      <label htmlFor={`report-${matchId}`} className="text-sm font-bold text-navy">
        Apa yang salah?
      </label>
      <textarea
        id={`report-${matchId}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        maxLength={300}
        required
        minLength={5}
        placeholder="Contoh: skornya harusnya 30-27 untuk tim kami"
        className="w-full resize-none rounded-xl border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:ring-2 focus:ring-accent"
      />
      <p className="text-xs text-slate-500">
        Match keluar dari leaderboard sampai admin mengecek. Hanya sekali per match, maks. {REPORT_WINDOW_DAYS} hari setelah main.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} disabled={pending} className="h-10 flex-1 rounded-full bg-white text-sm font-bold text-navy/70">
          Batal
        </button>
        <button type="submit" disabled={pending || reason.trim().length < 5} className="h-10 flex-1 rounded-full bg-rose-500 text-sm font-bold text-white disabled:opacity-50">
          {pending ? "Mengirim…" : "Kirim laporan"}
        </button>
      </div>
    </form>
  );
}
