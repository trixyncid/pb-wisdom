import type { SkillLevel } from "@prisma/client";
import { avatarUrl } from "@/lib/avatar";
import type { MatchCardPlayer } from "@/components/play/match-card";

/** Prisma select for showing a member anywhere: name and avatar version. */
export const person = { id: true, name: true, profile: { select: { nickname: true, updatedAt: true } } } as const;
export type Person = { id: string; name: string | null; profile: { nickname: string; updatedAt: Date } | null };

export const nameOf = (u: Person) => u.profile?.nickname ?? u.name ?? "Player";

export const toPlayers = (ps: { team: number; won: boolean | null; user: Person }[]): MatchCardPlayer[] =>
  ps.map((p) => ({ id: p.user.id, name: nameOf(p.user), avatar: avatarUrl(p.user.id, p.user.profile?.updatedAt), team: p.team, won: p.won }));

export const SKILLS: { value: SkillLevel; label: string; hint: string }[] = [
  { value: "BEGINNER", label: "Pemula", hint: "Baru mulai / main santai" },
  { value: "INTERMEDIATE", label: "Menengah", hint: "Rutin main, teknik dasar oke" },
  { value: "ADVANCED", label: "Mahir", hint: "Sering tanding, siap smash" },
];
export const skillLabel = (s: SkillLevel) => SKILLS.find((k) => k.value === s)?.label ?? s;
export const SKILL_TONE: Record<SkillLevel, string> = {
  BEGINNER: "bg-emerald-100 text-emerald-700",
  INTERMEDIATE: "bg-accent-soft text-accent-ink",
  ADVANCED: "bg-navy text-white",
};

/** wa.me link for a stored +62… number, optionally with a prefilled message. */
export function waLink(phone: string | null | undefined, text?: string) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
