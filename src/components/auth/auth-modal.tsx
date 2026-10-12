"use client";

import { useEffect, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useUiStore } from "@/lib/store";
import { safeRedirectPath } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import shuttleImg from "@/assets/3d/shuttle.png";

export function AuthModal() {
  const router = useRouter();
  const params = useSearchParams();
  const { authOpen, authNext, openAuth, closeAuth } = useUiStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (params.get("login") === "1") {
      openAuth(params.get("next"));
    }
  }, [params, openAuth]);

  function close() {
    closeAuth();
    if (params.get("login")) {
      router.replace("/");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
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
      toast.success("Selamat datang di PB Wisdom!", { id });
      const next = safeRedirectPath(authNext || params.get("next"));
      closeAuth();
      router.push(next);
      router.refresh();
    });
  }

  return (
    <AnimatePresence>
      {authOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-navy/45 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 rounded-full bg-sand p-2 text-navy"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <Image
                src={shuttleImg}
                alt=""
                width={60}
                height={64}
                className="float-tilt h-16 w-auto object-contain"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-ink">
                  Member access
                </p>
                <h2 className="text-xl font-black text-navy">
                  Masuk PB Wisdom
                </h2>
              </div>
            </div>

            <p className="mb-4 text-sm text-slate-500">
              Area ini untuk member. Login dulu untuk RSVP, match, iuran, dan
              profil.
            </p>

            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="auth-password">Password</Label>
                <PasswordInput
                  id="auth-password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <a href="/lupa-password" className="-mt-1 block text-right text-xs font-semibold text-accent-ink hover:underline">
                Lupa password?
              </a>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Masuk…" : "Masuk sekarang"}
              </Button>
            </form>

            <p className="mt-3 text-center text-xs text-slate-400">
              Belum punya akun?{" "}
              <a href="/register" className="font-bold text-accent-ink">
                Daftar
              </a>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
