import Link from "next/link";
import { notFound } from "next/navigation";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, Flame, MessageCircle, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { avatarUrl } from "@/lib/avatar";
import { getLeaderboard, getMemberWinrate } from "@/lib/stats";
import { formatClub } from "@/lib/time";
import { formatPhone } from "@/lib/phone";
import { person, SKILL_TONE, skillLabel, toPlayers, waLink } from "@/lib/people";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MatchCard } from "@/components/play/match-card";

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "MEMBER" && session.user.role !== "ADMIN")) return null;
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, role: { in: ["MEMBER", "ADMIN"] } },
    select: {
      id: true,
      name: true,
      role: true,
      createdAt: true,
      profile: { select: { nickname: true, phone: true, skill: true, status: true, joinDate: true, updatedAt: true } },
    },
  });
  if (!user) notFound();

  const [stats, ranking, matches] = await Promise.all([
    getMemberWinrate(id),
    getLeaderboard("ALL", 200),
    prisma.match.findMany({
      where: { status: "CONFIRMED", players: { some: { userId: id } } },
      orderBy: { playedAt: "desc" },
      take: 8,
      include: { players: { include: { user: { select: person } } } },
    }),
  ]);

  const isMe = id === session.user.id;
  const nickname = user.profile?.nickname ?? user.name ?? "Player";
  const skill = user.profile?.skill ?? "BEGINNER";
  const rankIdx = ranking.findIndex((r) => r.userId === id);
  const form = ranking[rankIdx]?.form ?? [];
  const all = stats.ALL;
  const wa = isMe ? null : waLink(user.profile?.phone, `Halo ${nickname}, aku dari PB Wisdom 👋`);
  const ring = 2 * Math.PI * 52;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <Link href="/directory" className="rise inline-flex w-fit items-center gap-1 text-sm font-semibold text-navy/60 hover:text-navy" style={rise(0)}>
        <ArrowLeft className="size-4" /> Directory
      </Link>

      <section className="rise relative overflow-hidden rounded-[32px] bg-navy p-5 text-white shadow-[0_24px_52px_rgba(14,44,60,0.32)]" style={rise(1)}>
        <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <Avatar className="size-24 ring-4 ring-accent/40">
            <AvatarImage src={avatarUrl(id, user.profile?.updatedAt)} alt="" />
            <AvatarFallback className="text-2xl text-navy">{nickname.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-[1.9rem] font-extrabold leading-tight">{nickname}</h1>
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs font-bold">
              <span className={cn("rounded-full px-2.5 py-1", SKILL_TONE[skill], skill === "ADVANCED" && "bg-accent text-navy")}>{skillLabel(skill)}</span>
              {user.role === "ADMIN" && <span className="rounded-full bg-white/15 px-2.5 py-1">Admin</span>}
              {user.profile?.status === "INACTIVE" && <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/60">Tidak aktif</span>}
            </div>
            <p className="mt-1.5 text-sm text-white/60">
              Member sejak {formatClub(user.profile?.joinDate ?? user.createdAt, "MMMM yyyy", { locale: localeId })}
            </p>
          </div>
        </div>

        <div className="relative mt-5 flex items-center gap-5">
          <div className="relative size-[112px] shrink-0">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#ee9f48"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={ring}
                strokeDashoffset={ring * (1 - all.winrate / 100)}
                className="ring-fill"
                style={{ "--ring": ring } as React.CSSProperties}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-extrabold">{all.winrate}%</span>
              <span className="text-[11px] font-semibold text-white/60">winrate</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-extrabold">
              {all.wins}W <span className="text-white/40">·</span> {all.losses}L
            </p>
            <p className="text-sm text-white/60">{all.played} match terverifikasi</p>
            {rankIdx >= 0 && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                <Flame className="size-4 text-accent" /> Peringkat #{rankIdx + 1}
              </p>
            )}
            {form.length > 0 && (
              <div className="mt-2 flex gap-1" aria-label={`Form terakhir: ${form.join(" ")}`}>
                {form.map((r, i) => (
                  <span key={i} className={cn("flex size-6 items-center justify-center rounded-md text-[11px] font-extrabold", r === "W" ? "bg-accent text-navy" : "bg-white/10 text-white/60")}>
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-2">
          {([["Single", stats.SINGLES], ["Ganda", stats.DOUBLES]] as const).map(([label, s]) => (
            <div key={label} className="rounded-2xl bg-white/[0.07] px-3 py-2.5">
              <p className="text-xs font-semibold text-white/60">{label}</p>
              <p className="font-display text-lg font-extrabold">
                {s.winrate}% <span className="text-sm font-semibold text-white/50">{s.wins}W·{s.losses}L</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="rise flex items-center justify-center gap-2 rounded-full bg-[#25d366] py-3.5 font-bold text-white shadow-[0_10px_24px_rgba(37,211,102,0.35)] transition active:scale-[0.98]"
          style={rise(2)}
        >
          <MessageCircle className="size-5" /> Chat di WhatsApp
          <span className="font-medium text-white/80">· {formatPhone(user.profile!.phone!)}</span>
        </a>
      ) : isMe ? (
        <Link href="/profile" className="rise flex items-center justify-center gap-2 rounded-full bg-white/90 py-3.5 font-bold text-navy shadow-sm" style={rise(2)}>
          <Pencil className="size-4" /> Edit profil
        </Link>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="px-1 font-display text-xl font-bold text-navy">Match terakhir</h2>
        {matches.length === 0 ? (
          <p className="px-1 text-sm text-slate-500">Belum ada match terverifikasi.</p>
        ) : (
          matches.map((m, i) => (
            <div key={m.id} className="rise" style={rise(3 + i)}>
              <MatchCard type={m.type} score={m.score} playedAt={m.playedAt} players={toPlayers(m.players)} />
            </div>
          ))
        )}
      </section>
    </div>
  );
}
