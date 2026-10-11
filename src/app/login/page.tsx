"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import logoImg from "@/assets/brand/logo.png";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const id = toast.loading("Masuk…");
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Email atau password salah", { id });
        return;
      }
      toast.success("Selamat datang kembali!", { id });
      router.push("/");
      router.refresh();
    });
  }

  return (
    <main className="court-stripes flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          <Image
            src={logoImg}
            alt="PB Wisdom"
            width={200}
            height={151}
            preload
            className="mx-auto h-auto w-[200px]"
          />
          <h1 className="sr-only">PB Wisdom</h1>
          <p className="text-sm text-slate-500">Portal internal member & admin</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Masuk…" : "Masuk"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link href="/register" className="font-bold text-accent-ink">
            Daftar
          </Link>
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="rounded-2xl bg-sand p-3 text-[11px] leading-relaxed text-slate-500">
            <p className="mb-1 font-bold text-navy">Local seed logins</p>
            <p>admin@pbwisdom.local / WisdomAdmin1!</p>
            <p>member@pbwisdom.local / WisdomMember1!</p>
          </div>
        )}
      </Card>
    </main>
  );
}
