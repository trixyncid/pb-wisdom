"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { LogOut } from "lucide-react";
import { useUiStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function LogoutModal() {
  const { logoutOpen, closeLogout } = useUiStore();
  const [pending, start] = useTransition();

  function confirm() {
    start(async () => {
      closeLogout();
      await signOut({ callbackUrl: "/" });
    });
  }

  return (
    <AnimatePresence>
      {logoutOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0b2a4a]/45 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLogout}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="w-full max-w-sm rounded-[28px] bg-white p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f3fb] text-[#0b2a4a]">
              <LogOut className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-[#0b2a4a]">Keluar akun?</h2>
            <p className="mt-2 text-sm text-slate-500">
              Kamu bisa login lagi kapan saja untuk RSVP, match, dan iuran.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeLogout}
                disabled={pending}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={confirm}
                disabled={pending}
              >
                {pending ? "Keluar…" : "Ya, keluar"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
