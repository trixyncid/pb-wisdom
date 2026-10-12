"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { SkillLevel } from "@prisma/client";
import { ArrowUpRight, Flame } from "lucide-react";
import { withToast } from "@/lib/with-toast";
import { updateProfileAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SquareImageUpload } from "@/components/profile/square-image-upload";
import { PhoneInput } from "@/components/profile/phone-input";
import { normalizePhone } from "@/lib/phone";
import { SKILLS, SKILL_TONE, skillLabel } from "@/lib/people";
import { cn } from "@/lib/utils";

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function ProfileForm({
  initial,
  stats,
}: {
  initial: {
    userId: string;
    nickname: string;
    phone: string;
    imageUrl: string;
    email: string;
    role: string;
    skill: SkillLevel;
    memberSince: string;
  };
  stats: { winrate: number; wins: number; losses: number; rank: number | null };
}) {
  const [nickname, setNickname] = useState(initial.nickname);
  // Normalized up front so a stored "+620812…" is saved back without the 0.
  const [phone, setPhone] = useState(() => normalizePhone(initial.phone) || "+62");
  const [skill, setSkill] = useState<SkillLevel>(initial.skill);
  const [saved, setSaved] = useState({ nickname: initial.nickname, skill: initial.skill });
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [pending, start] = useTransition();
  const [photoPending, startPhoto] = useTransition();
  const phoneValue = phone === "+62" || phone.length <= 3 ? "" : phone;

  function savePhoto(dataUrl: string) {
    setImageUrl(dataUrl);
    startPhoto(async () => {
      await withToast(updateProfileAction({ nickname: saved.nickname, imageUrl: dataUrl }), { success: "Foto profil diperbarui" });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rise relative overflow-hidden rounded-[32px] bg-navy p-5 text-white shadow-[0_24px_52px_rgba(14,44,60,0.32)]" style={rise(1)}>
        <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <SquareImageUpload value={imageUrl} onChange={savePhoto} initials={saved.nickname || "P"} />
          {photoPending && <p className="mt-2 text-xs font-semibold text-accent">Menyimpan foto…</p>}
          <h2 className="font-display mt-4 text-2xl font-extrabold">{saved.nickname || "Player"}</h2>
          <p className="text-sm text-white/60">{initial.email}</p>
          <div className="mt-2.5 flex flex-wrap justify-center gap-1.5 text-xs font-bold">
            <span className={cn("rounded-full px-2.5 py-1", SKILL_TONE[saved.skill], saved.skill === "ADVANCED" && "bg-accent text-navy")}>{skillLabel(saved.skill)}</span>
            {initial.role === "ADMIN" && <span className="rounded-full bg-white/15 px-2.5 py-1">Admin</span>}
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/70">Member sejak {initial.memberSince}</span>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/[0.07] px-2 py-2.5">
            <p className="font-display text-xl font-extrabold">{stats.winrate}%</p>
            <p className="text-[11px] font-semibold text-white/60">winrate</p>
          </div>
          <div className="rounded-2xl bg-white/[0.07] px-2 py-2.5">
            <p className="font-display text-xl font-extrabold">
              {stats.wins}
              <span className="text-white/40">-</span>
              {stats.losses}
            </p>
            <p className="text-[11px] font-semibold text-white/60">menang-kalah</p>
          </div>
          <div className="rounded-2xl bg-white/[0.07] px-2 py-2.5">
            <p className="font-display inline-flex items-center gap-1 text-xl font-extrabold">
              {stats.rank ? (
                <>
                  <Flame className="size-4 text-accent" />#{stats.rank}
                </>
              ) : (
                "–"
              )}
            </p>
            <p className="text-[11px] font-semibold text-white/60">peringkat</p>
          </div>
        </div>
        <Link href={`/members/${initial.userId}`} className="relative mt-3 flex h-10 items-center justify-center gap-1 rounded-full bg-white/10 text-sm font-bold transition hover:bg-white/15">
          Lihat profil publik <ArrowUpRight className="size-4" />
        </Link>
      </section>

      <form
        className="rise flex flex-col gap-4 rounded-[28px] border border-white bg-white/90 p-5 shadow-[0_10px_28px_rgba(14,44,60,0.06)]"
        style={rise(2)}
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await withToast(updateProfileAction({ nickname, phone: phoneValue, skill }), { success: "Profil disimpan" });
            if (res.ok) setSaved({ nickname: nickname.trim(), skill });
          });
        }}
      >
        <h3 className="font-display text-lg font-bold text-navy">Data diri</h3>
        <div className="space-y-1.5">
          <Label htmlFor="profile-nickname">Nickname</Label>
          <Input id="profile-nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required maxLength={40} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-phone">WhatsApp</Label>
          <PhoneInput id="profile-phone" value={phone} onChange={setPhone} />
          <p className="text-xs text-slate-500">Tampil di Directory supaya teman klub bisa chat kamu.</p>
        </div>
        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 text-sm font-semibold text-navy">Level permainan</legend>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {SKILLS.map((s) => (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={skill === s.value}
                onClick={() => setSkill(s.value)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-2xl border-2 px-2 py-2.5 text-center transition active:scale-[0.97]",
                  skill === s.value ? "border-accent bg-accent-soft" : "border-transparent bg-cream hover:bg-sand",
                )}
              >
                <span className="text-sm font-bold text-navy">{s.label}</span>
                <span className="text-[11px] leading-tight text-slate-500">{s.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Menyimpan…" : "Simpan perubahan"}
        </Button>
      </form>
    </div>
  );
}
