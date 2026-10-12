"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Copy, KeyRound, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { createPasswordResetLinkAction } from "@/actions/account";
import { withToast } from "@/lib/with-toast";

/** Admin: create a one-time reset link and hand it over via copy or WhatsApp. */
export function ResetLinkButton({ userId }: { userId: string }) {
  const [pending, start] = useTransition();
  const [link, setLink] = useState<{ url: string; phone: string | null; name: string } | null>(null);

  const message = link ? `Halo ${link.name}, ini link untuk membuat password baru akun PB Wisdom (berlaku 24 jam, sekali pakai):\n${link.url}` : "";
  const waHref = link ? `https://wa.me/${link.phone ? link.phone.replace(/\D/g, "") : ""}?text=${encodeURIComponent(message)}` : "#";

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await withToast(createPasswordResetLinkAction(userId), { loading: "Membuat link…", success: "Link reset dibuat" });
            if (res.ok && "url" in res) setLink({ url: res.url, phone: res.phone, name: res.name });
          })
        }
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-cream px-3 text-xs font-bold text-navy transition hover:bg-sand disabled:opacity-60"
      >
        <KeyRound className="size-3.5" /> Link reset password
      </button>

      <AnimatePresence>
        {link && (
          <motion.div className="fixed inset-0 z-[90] flex items-end justify-center bg-navy/50 p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLink(null)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Link reset password"
              className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-navy">Link reset untuk {link.name}</p>
                  <p className="text-sm text-slate-500">Berlaku 24 jam, sekali pakai. Link lama otomatis tidak berlaku.</p>
                </div>
                <button type="button" onClick={() => setLink(null)} aria-label="Tutup" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream text-navy">
                  <X className="size-4" />
                </button>
              </div>
              <input readOnly value={link.url} onFocus={(e) => e.target.select()} aria-label="Link reset" className="h-11 w-full rounded-2xl bg-cream px-3 text-xs text-navy" />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(link.url);
                    toast.success("Link disalin");
                  }}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-cream text-sm font-bold text-navy hover:bg-sand"
                >
                  <Copy className="size-4" /> Salin link
                </button>
                <a href={waHref} target="_blank" rel="noreferrer" className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25d366] text-sm font-bold text-white">
                  <MessageCircle className="size-4" /> Kirim via WhatsApp
                </a>
              </div>
              {!link.phone && <p className="mt-2 text-xs text-slate-500">Member ini belum mengisi nomor WhatsApp; pilih kontaknya manual.</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
