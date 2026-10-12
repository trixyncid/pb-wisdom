"use client";

import { useState, useTransition } from "react";
import { MailCheck } from "lucide-react";
import { requestPasswordResetEmailAction } from "@/actions/account";
import { withToast } from "@/lib/with-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Email me a reset link. Same answer whether or not the address has an account. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-center">
        <MailCheck className="size-7 text-emerald-600" />
        <p className="text-sm font-bold text-navy">Cek email kamu</p>
        <p className="text-sm text-slate-600">
          Kalau <span className="font-semibold">{sentTo}</span> terdaftar, link untuk membuat password baru sudah dikirim. Cek juga folder Spam/Promosi.
        </p>
        <button type="button" onClick={() => setSentTo(null)} className="text-xs font-bold text-accent-ink">
          Pakai email lain
        </button>
      </div>
    );
  }
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await withToast(requestPasswordResetEmailAction(email), { loading: "Mengirim…", success: "Permintaan terkirim" });
          if (res.ok) setSentTo(email.trim());
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="forgot-email">Email akun</Label>
        <Input id="forgot-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kamu@gmail.com" required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Mengirim…" : "Kirim link reset ke email"}
      </Button>
    </form>
  );
}
