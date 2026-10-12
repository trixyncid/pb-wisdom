"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { withFlash } from "@/components/flash-toast";
import { deleteAccountAction } from "@/actions/account";
import { withToast } from "@/lib/with-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

/** Profile: download your data, or delete your account (UU PDP). */
export function AccountData({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  const ready = confirm.trim().toUpperCase() === "HAPUS" && (!hasPassword || password.length > 0);

  return (
    <section className="rise overflow-hidden rounded-[28px] border border-white bg-white/90 shadow-[0_10px_28px_rgba(14,44,60,0.06)]" style={{ "--i": 4 } as React.CSSProperties}>
      <h3 className="font-display px-5 pt-5 text-lg font-bold text-navy">Data & privasi</h3>
      <a href="/api/account/export" download className="mt-2 flex items-center gap-3 px-5 py-3 transition hover:bg-cream">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sand text-navy">
          <Download className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-navy">Unduh data saya</span>
          <span className="block text-xs text-slate-500">Profil, RSVP, iuran, match dan notifikasi (JSON)</span>
        </span>
      </a>

      <div className="border-t border-navy/6">
        {open ? (
          <form
            className="flex flex-col gap-3 px-5 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const res = await withToast(deleteAccountAction({ password, confirm }), { loading: "Menghapus akun…", success: "Akun dihapus. Sampai jumpa!" });
                if (!res.ok) return;
                toast.loading("Keluar…");
                await signOut({ callbackUrl: withFlash("/", "account-deleted") });
              });
            }}
          >
            <p className="font-bold text-rose-600">Hapus akun permanen?</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Nama, email, nomor WA, foto profil dan login kamu dihapus.</li>
              <li>Foto yang kamu upload di album event ikut dihapus.</li>
              <li>Riwayat match dan iuran tetap ada untuk catatan klub, tapi tanpa namamu (“Mantan member”).</li>
              <li>Tidak bisa dibatalkan. Unduh datamu dulu bila perlu.</li>
            </ul>
            {hasPassword && (
              <div className="space-y-1.5">
                <Label htmlFor="del-password">Password</Label>
                <PasswordInput id="del-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="del-confirm">Ketik HAPUS untuk konfirmasi</Label>
              <Input id="del-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="danger" disabled={pending || !ready}>
                {pending ? "Menghapus…" : "Hapus akun"}
              </Button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-cream">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Trash2 className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-rose-600">Hapus akun</span>
              <span className="block text-xs text-slate-500">Hapus data pribadimu dari aplikasi</span>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
