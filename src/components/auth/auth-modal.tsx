"use client";

import { useEffect, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useUiStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthModal() {
  const router = useRouter();
  const params = useSearchParams();
  const { authOpen, authNext, openAuth, closeAuth } = useUiStore();
  const [email, setEmail] = useState("member@pbwisdom.local");
  const [password, setPassword] = useState("WisdomMember1!");
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
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Email atau password salah");
        return;
      }
      toast.success("Welcome to PB Wisdom!");
      const next = authNext || params.get("next") || "/";
      closeAuth();
      router.push(next);
      router.refresh();
    });
  }

  return (
    <AnimatePresence>
      {authOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0b2a4a]/45 p-4 backdrop-blur-sm"
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
              className="absolute right-4 top-4 rounded-full bg-[#e8f3fb] p-2 text-[#0b2a4a]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/shuttle-3d.png"
                alt=""
                className="float-y h-14 w-14 object-contain"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2eb6ea]">
                  Member access
                </p>
                <h2 className="text-xl font-black text-[#0b2a4a]">
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
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Masuk…" : "Masuk sekarang"}
              </Button>
            </form>

            <p className="mt-3 text-center text-xs text-slate-400">
              Belum punya akun?{" "}
              <a href="/register" className="font-bold text-[#2eb6ea]">
                Daftar
              </a>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
