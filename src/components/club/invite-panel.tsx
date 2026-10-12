"use client";

import { useTransition } from "react";
import { Copy, MessageCircle, RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { withToast } from "@/lib/with-toast";
import { regenerateInviteAction } from "@/actions/auth";

export function InvitePanel({ code, remaining }: { code: string | null; remaining: number | null }) {
  const [pending, start] = useTransition();
  // A relative path renders identically on server and client; the full URL is
  // built only when copying (reading window during render broke hydration).
  const path = code ? `/register?code=${code}` : null;
  const fullUrl = () => `${window.location.origin}${path}`;

  return (
    <section className="rise flex flex-col gap-3 rounded-[28px] border border-white bg-white/90 p-5 shadow-[0_10px_28px_rgba(14,44,60,0.06)]" style={{ "--i": 5 } as React.CSSProperties}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink">
          <UserPlus className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-navy">Undang member</h2>
          <p className="text-sm text-slate-500">Link daftar dengan kode klub{remaining != null ? ` · sisa ${remaining} pemakaian` : ""}</p>
        </div>
      </div>
      <p className="rounded-2xl bg-cream px-4 py-3 text-center font-mono text-lg font-bold tracking-wider text-navy">{code ?? "Belum ada kode aktif"}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!path}
          onClick={async () => {
            await navigator.clipboard.writeText(fullUrl());
            toast.success("Link undangan disalin");
          }}
          className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-cream text-sm font-bold text-navy transition hover:bg-sand disabled:opacity-50"
        >
          <Copy className="size-4" /> Salin link
        </button>
        <button
          type="button"
          disabled={!path}
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Yuk gabung PB Wisdom! Daftar di sini: ${fullUrl()}`)}`, "_blank", "noopener")}
          className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#25d366] text-sm font-bold text-white disabled:opacity-50"
        >
          <MessageCircle className="size-4" /> Bagikan
        </button>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (code && !window.confirm("Buat kode baru? Kode lama langsung tidak berlaku.")) return;
          start(async () => {
            await withToast(regenerateInviteAction(), { success: (res) => `Kode baru: ${res.code}` });
          });
        }}
        className="inline-flex w-fit items-center gap-1.5 self-center text-xs font-semibold text-navy/50 transition hover:text-navy disabled:opacity-50"
      >
        <RefreshCw className="size-3.5" /> Buat kode baru
      </button>
    </section>
  );
}
