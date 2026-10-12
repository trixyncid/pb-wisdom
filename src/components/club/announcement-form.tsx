"use client";

import { useState, useTransition } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import { withToast } from "@/lib/with-toast";
import { createAnnouncementAction } from "@/actions/ops";
import { deleteAnnouncementAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AnnouncementItem = { id: string; title: string; body: string; when: string; by: string };

export function AnnouncementForm({ recent }: { recent: AnnouncementItem[] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [, startDelete] = useTransition();

  return (
    <section className="rise flex flex-col gap-3 rounded-[28px] border border-white bg-white/90 p-5 shadow-[0_10px_28px_rgba(14,44,60,0.06)]" style={{ "--i": 6 } as React.CSSProperties}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <Megaphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-navy">Pengumuman</h2>
          <p className="text-sm text-slate-500">Dikirim ke notifikasi semua member</p>
        </div>
      </div>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await withToast(createAnnouncementAction(title, body), {
              loading: "Mengirim pengumuman…",
              success: (r) => ("sent" in r ? `Pengumuman dikirim ke ${r.sent} member` : "Pengumuman dikirim"),
            });
            if (!res.ok) return;
            setTitle("");
            setBody("");
          });
        }}
      >
        <Input placeholder="Judul, mis. Latihan Sabtu pindah ke GOR B" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
        <textarea
          className="min-h-24 w-full rounded-2xl border border-navy/10 bg-cream px-3 py-2 text-sm text-navy outline-none focus:ring-2 focus:ring-accent"
          placeholder="Isi pengumuman"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Mengirim…" : "Kirim ke semua member"}
        </Button>
      </form>
      {recent.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-navy/6 pt-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Terakhir dikirim</p>
          {recent.map((a) => (
            <div key={a.id} className="flex items-start gap-2 rounded-2xl bg-cream px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-navy">{a.title}</p>
                <p className="line-clamp-2 text-xs text-slate-600">{a.body}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {a.when} · {a.by}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Hapus pengumuman ${a.title}`}
                onClick={() => {
                  if (!window.confirm("Hapus dari daftar? Notifikasi yang sudah terkirim tetap ada.")) return;
                  startDelete(async () => {
                    await withToast(deleteAnnouncementAction(a.id), { success: "Pengumuman dihapus" });
                  });
                }}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-navy/40 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
