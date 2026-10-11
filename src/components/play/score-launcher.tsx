"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import type { ScorerMember } from "@/components/play/scorer";
import shuttle3d from "@/assets/3d/shuttle.png";

// The scorer is only downloaded when someone opens it (and starts loading as
// soon as a finger touches the button), so /play itself stays light.
const loadScorer = () => import("@/components/play/scorer");
const Scorer = dynamic(() => loadScorer().then((m) => m.Scorer), { ssr: false });

export function ScoreLauncher({
  members,
  currentUserId,
  isAdmin,
}: {
  members: ScorerMember[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onPointerDown={loadScorer}
        onFocus={loadScorer}
        onClick={() => setOpen(true)}
        className="rise group relative flex w-full items-center gap-4 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#f6b46a] via-accent to-[#e48b33] p-5 text-left text-navy shadow-[0_22px_48px_rgba(238,159,72,0.4)] transition-transform duration-300 active:scale-[0.98]"
        style={{ "--i": 2 } as React.CSSProperties}
      >
        <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.16]" preserveAspectRatio="none" viewBox="0 0 400 200">
          <path d="M0 150 L400 60 M0 190 L400 100 M120 0 L170 200 M300 0 L330 200" stroke="white" strokeWidth="3" fill="none" />
        </svg>
        <span className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-navy text-accent shadow-lg transition-transform duration-300 group-hover:rotate-90">
          <Plus className="size-7" strokeWidth={2.6} />
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="font-display block text-2xl font-extrabold leading-tight">Catat skor</span>
          <span className="block text-sm font-medium text-navy/70">
            {isAdmin ? "Langsung masuk leaderboard" : "Siapa pun boleh bantu, admin yang verifikasi"}
          </span>
        </span>
        <Image src={shuttle3d} alt="" width={84} height={90} className="float-tilt prop-shadow pointer-events-none relative -my-4 -mr-2 w-[76px] shrink-0" />
      </button>
      <AnimatePresence>
        {open && <Scorer members={members} currentUserId={currentUserId} isAdmin={isAdmin} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
