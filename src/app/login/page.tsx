"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pbwisdom.local");
  const [password, setPassword] = useState("WisdomAdmin1!");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Invalid email or password");
        return;
      }
      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    });
  }

  return (
    <main className="court-stripes flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/hero-racket-shuttle.png"
            alt=""
            className="float-y mx-auto h-36 w-auto object-contain"
          />
          <h1 className="text-2xl font-black text-[#0b2a4a]">PB Wisdom</h1>
          <p className="text-sm text-slate-500">Portal internal member & admin</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
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
          <Link href="/register" className="font-bold text-[#2eb6ea]">
            Daftar
          </Link>
        </p>

        <div className="rounded-2xl bg-[#e8f3fb] p-3 text-[11px] leading-relaxed text-slate-500">
          <p className="mb-1 font-bold text-[#0b2a4a]">Local seed logins</p>
          <p>admin@pbwisdom.local / WisdomAdmin1!</p>
          <p>member@pbwisdom.local / WisdomMember1!</p>
        </div>
      </Card>
    </main>
  );
}
