import Link from "next/link";
import { id as localeId } from "date-fns/locale";
import { CalendarDays, ChevronRight, Mail, PartyPopper, Receipt, Swords, UserCheck, Users, Wallet } from "lucide-react";
import { requireAdminPage } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatClub, hoursAgo } from "@/lib/time";
import { nameOf, person, toPlayers } from "@/lib/people";
import { formatRp, cn } from "@/lib/utils";
import { AdminHeader } from "@/components/club/admin-header";
import { InvitePanel } from "@/components/club/invite-panel";
import { AnnouncementForm } from "@/components/club/announcement-form";
import { MatchCard } from "@/components/play/match-card";
import { AdminLogRow } from "@/components/club/admin-log-list";
import { ReviewMatchButtons } from "@/components/play/review-match-buttons";

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function ClubPage() {
  await requireAdminPage();
  const now = hoursAgo(0);
  const weekAhead = hoursAgo(-24 * 7);
  const [activeMembers, pendingMembers, pendingFees, latestPeriod, upcomingEvents, invite, reviews, announcements, activity] = await Promise.all([
    prisma.user.count({ where: { role: { in: ["MEMBER", "ADMIN"] }, NOT: { profile: { status: "INACTIVE" } } } }),
    prisma.user.count({ where: { role: "PENDING" } }),
    prisma.feeDue.count({ where: { status: "SUBMITTED" } }),
    prisma.feePeriod.findFirst({
      orderBy: { dueDate: "desc" },
      select: { id: true, label: true, amount: true, dues: { select: { status: true } } },
    }),
    prisma.event.count({ where: { startsAt: { gte: now, lte: weekAhead } } }),
    // Only a code that still works; revoked or used-up codes are not shown.
    prisma.invite.findFirst({
      where: { type: "CLUB", remainingUses: { gt: 0 }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      orderBy: { createdAt: "desc" },
    }),
    prisma.match.findMany({
      where: { status: { in: ["PENDING", "DISPUTED"] } },
      orderBy: { createdAt: "asc" },
      take: 10,
      include: { players: { include: { user: { select: person } } }, loggedBy: { select: person } },
    }),
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { createdBy: { select: person } },
    }),
    prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 4, include: { actor: { select: person } } }),
  ]);

  const paid = latestPeriod?.dues.filter((d) => d.status === "VERIFIED").length ?? 0;
  const dues = latestPeriod?.dues.length ?? 0;
  const todo = [
    pendingMembers > 0 && { href: "/club/members?tab=menunggu", icon: UserCheck, label: `${pendingMembers} member menunggu approval`, tone: "bg-accent-soft text-accent-ink" },
    pendingFees > 0 && { href: "/club/iuran", icon: Receipt, label: `${pendingFees} bukti iuran perlu dicek`, tone: "bg-sand text-navy" },
  ].filter(Boolean) as { href: string; icon: typeof Users; label: string; tone: string }[];

  const menu = [
    { href: "/club/members", icon: Users, title: "Members", desc: "Approval, peran & status" },
    { href: "/club/iuran", icon: Wallet, title: "Iuran", desc: "Periode, bukti & tunai" },
    { href: "/club/jadwal", icon: CalendarDays, title: "Agenda", desc: "Latihan, sparring & event" },
    { href: "/play", icon: Swords, title: "Skor match", desc: "Verifikasi & leaderboard" },
    { href: "/club/emails", icon: Mail, title: "Email", desc: "Template notifikasi" },
  ];

  return (
    <div className="flex flex-col gap-5 pt-2">
      <AdminHeader title="Dashboard" back={false} />

      <section className="rise relative overflow-hidden rounded-[32px] bg-navy p-5 text-white shadow-[0_24px_52px_rgba(14,44,60,0.32)]" style={rise(1)}>
        <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/[0.07] px-3 py-3">
            <p className="font-display text-3xl font-extrabold">{activeMembers}</p>
            <p className="text-xs font-semibold text-white/60">member aktif</p>
          </div>
          <div className="rounded-2xl bg-white/[0.07] px-3 py-3">
            <p className="font-display text-3xl font-extrabold">{upcomingEvents}</p>
            <p className="text-xs font-semibold text-white/60">event 7 hari ke depan</p>
          </div>
        </div>
        {latestPeriod && (
          <Link href={`/club/iuran/${latestPeriod.id}`} className="relative mt-2 block rounded-2xl bg-white/[0.07] px-3 py-3 transition hover:bg-white/[0.11]">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-semibold text-white/60">Iuran {latestPeriod.label}</p>
              <p className="text-xs font-semibold text-white/60">
                {paid}/{dues} lunas
              </p>
            </div>
            <p className="font-display text-xl font-extrabold">
              {formatRp(paid * latestPeriod.amount)} <span className="text-sm font-semibold text-white/50">dari {formatRp(dues * latestPeriod.amount)}</span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-accent" style={{ width: `${dues ? (paid / dues) * 100 : 0}%` }} />
            </div>
          </Link>
        )}
      </section>

      <section className="rise flex flex-col gap-2" style={rise(2)}>
        <h2 className="px-1 font-display text-xl font-bold text-navy">Perlu tindakan</h2>
        {todo.length === 0 && reviews.length === 0 ? (
          <div className="flex items-center gap-3 rounded-[24px] border border-white bg-white/90 p-4 shadow-[0_8px_22px_rgba(14,44,60,0.05)]">
            <PartyPopper className="size-7 text-accent" />
            <p className="text-sm font-semibold text-navy">Semua beres. Tidak ada yang menunggu.</p>
          </div>
        ) : (
          todo.map((t) => (
            <Link key={t.href} href={t.href} className="flex items-center gap-3 rounded-[24px] border border-accent/40 bg-white/90 p-3 shadow-[0_8px_22px_rgba(14,44,60,0.05)] transition hover:bg-cream">
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", t.tone)}>
                <t.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-bold text-navy">{t.label}</span>
              <ChevronRight className="size-4 text-slate-300" />
            </Link>
          ))
        )}
        {reviews.map((m) => {
          const reporter = m.players.find((p) => p.userId === m.disputedById);
          return (
            <MatchCard
              key={m.id}
              type={m.type}
              score={m.score}
              playedAt={m.playedAt}
              players={toPlayers(m.players)}
              pendingBy={nameOf(m.loggedBy)}
              dispute={m.status === "DISPUTED" && m.disputeReason ? { by: reporter ? nameOf(reporter.user) : "pemain", reason: m.disputeReason } : undefined}
              footer={<ReviewMatchButtons matchId={m.id} disputed={m.status === "DISPUTED"} />}
            />
          );
        })}
      </section>

      <nav aria-label="Menu admin" className="rise grid grid-cols-2 gap-2" style={rise(3)}>
        {menu.map((m) => (
          <Link key={m.href} href={m.href} className="flex flex-col gap-2 rounded-[24px] border border-white bg-white/90 p-4 shadow-[0_8px_22px_rgba(14,44,60,0.05)] transition hover:-translate-y-0.5 hover:bg-cream">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-navy text-accent">
              <m.icon className="size-5" />
            </span>
            <span>
              <span className="block font-bold text-navy">{m.title}</span>
              <span className="block text-xs text-slate-500">{m.desc}</span>
            </span>
          </Link>
        ))}
      </nav>

      <section className="rise flex flex-col gap-2" style={rise(4)}>
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-xl font-bold text-navy">Aktivitas admin</h2>
          <Link href="/club/log" className="text-sm font-medium text-navy/50 transition hover:text-navy">
            Lihat semua
          </Link>
        </div>
        {activity.length === 0 ? (
          <p className="px-1 text-sm text-slate-500">Belum ada aktivitas tercatat.</p>
        ) : (
          <div className="flex flex-col rounded-[26px] border border-white bg-white/90 p-1.5 shadow-[0_10px_28px_rgba(14,44,60,0.06)]">
            {activity.map((e) => (
              <AdminLogRow key={e.id} entry={e} showDate />
            ))}
          </div>
        )}
      </section>

      <InvitePanel code={invite?.code ?? null} remaining={invite?.remainingUses ?? null} />
      <AnnouncementForm
        recent={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          when: formatClub(a.createdAt, "d MMM, HH:mm", { locale: localeId }),
          by: nameOf(a.createdBy),
        }))}
      />
    </div>
  );
}
