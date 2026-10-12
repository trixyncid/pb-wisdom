"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction } from "@/actions/account";
import { withToast } from "@/lib/with-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (password !== confirm) return;
        start(async () => {
          const res = await withToast(resetPasswordAction({ token, password }), {
            loading: "Menyimpan password…",
            success: "Password diganti. Silakan masuk.",
          });
          if (res.ok) router.replace("/login");
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="reset-new">Password baru</Label>
        <PasswordInput id="reset-new" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="text-xs text-slate-500">Minimal 8 karakter.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reset-confirm">Ulangi password</Label>
        <PasswordInput id="reset-confirm" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={mismatch} />
        {mismatch && <p className="text-xs font-semibold text-rose-600">Password tidak sama</p>}
      </div>
      <Button type="submit" disabled={pending || mismatch || password.length < 8}>
        Simpan password baru
      </Button>
    </form>
  );
}
