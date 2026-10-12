"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, KeyRound, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { changePasswordAction, logoutEverywhereAction } from "@/actions/account";
import { withToast } from "@/lib/with-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";

/** Profile: change password and sign out of every device. */
export function AccountSecurity({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  const [confirmAll, setConfirmAll] = useState(false);
  const [allPending, startAll] = useTransition();
  const mismatch = confirm.length > 0 && confirm !== next;

  return (
    <section className="rise overflow-hidden rounded-[28px] border border-white bg-white/90 shadow-[0_10px_28px_rgba(14,44,60,0.06)]" style={{ "--i": 3 } as React.CSSProperties}>
      <h3 className="font-display px-5 pt-5 text-lg font-bold text-navy">Keamanan akun</h3>

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="mt-2 flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-cream"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink">
          <KeyRound className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-navy">{hasPassword ? "Ganti password" : "Buat password"}</span>
          <span className="block text-xs text-slate-500">Perangkat lain otomatis keluar</span>
        </span>
        <ChevronDown className={cn("size-4 text-slate-400 transition", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault();
              if (mismatch) return;
              start(async () => {
                const res = await withToast(changePasswordAction({ current, next }), { success: "Password diganti. Perangkat lain sudah keluar." });
                if (res.ok) {
                  setCurrent("");
                  setNext("");
                  setConfirm("");
                  setOpen(false);
                }
              });
            }}
          >
            <div className="flex flex-col gap-3 px-5 pb-4 pt-1">
              {hasPassword && (
                <div className="space-y-1.5">
                  <Label htmlFor="pw-current">Password saat ini</Label>
                  <PasswordInput id="pw-current" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="pw-next">Password baru</Label>
                <PasswordInput id="pw-next" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw-confirm">Ulangi password baru</Label>
                <PasswordInput id="pw-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" minLength={8} required aria-invalid={mismatch} />
                {mismatch && <p className="text-xs font-semibold text-rose-500">Password tidak sama</p>}
              </div>
              <Button type="submit" disabled={pending || mismatch} className="w-full">
                {pending ? "Menyimpan…" : "Simpan password"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="border-t border-navy/6">
        {confirmAll ? (
          <div className="flex flex-col gap-3 px-5 py-4">
            <p className="text-sm text-navy">Keluar dari semua perangkat, termasuk yang ini? Kamu perlu login lagi.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" disabled={allPending} onClick={() => setConfirmAll(false)}>
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={allPending}
                onClick={() =>
                  startAll(async () => {
                    const res = await withToast(logoutEverywhereAction(), { loading: "Mengeluarkan semua perangkat…", success: "Semua perangkat sudah keluar" });
                    if (!res.ok) return;
                    toast.loading("Keluar…");
                    await signOut({ callbackUrl: "/login" });
                  })
                }
              >
                {allPending ? "Memproses…" : "Ya, keluar semua"}
              </Button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmAll(true)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-cream">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <MonitorSmartphone className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-navy">Keluar dari semua perangkat</span>
              <span className="block text-xs text-slate-500">Kalau HP hilang atau pernah login di perangkat orang lain</span>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
