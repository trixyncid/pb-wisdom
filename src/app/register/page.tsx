"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { registerAction } from "@/actions/auth";
import { Suspense } from "react";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(params.get("code") ?? "");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await registerAction({
        name,
        email,
        password,
        inviteCode: inviteCode || undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (login?.error) {
        toast.error("Akun dibuat, silakan login manual");
        router.push("/login");
        return;
      }
      toast.success("Akun dibuat");
      router.push("/");
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-md space-y-5 border-[#2eb6ea]/30 bg-white p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-[#0b2a4a]">Daftar PB Wisdom</h1>
        <p className="text-sm text-slate-400">
          Setelah daftar, admin perlu menyetujui akunmu
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Nama</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Kode undangan (opsional)</Label>
          <Input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="WISDOM2026"
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Mendaftar…" : "Daftar"}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-400">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-[#2eb6ea]">
          Masuk
        </Link>
      </p>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <main className="court-grid flex min-h-dvh items-center justify-center px-4 py-10">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
