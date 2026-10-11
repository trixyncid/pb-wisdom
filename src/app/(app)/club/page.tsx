import { requireAdminPage } from "@/lib/authz";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardTitle } from "@/components/ui/card";
import { InvitePanel } from "@/components/club/invite-panel";
import { AnnouncementForm } from "@/components/club/announcement-form";
import { ResolveDisputeButtons } from "@/components/club/resolve-dispute-buttons";
import { formatClub } from "@/lib/time";
import { id as localeId } from "date-fns/locale";

export default async function ClubPage() {
  await requireAdminPage();
  const [pendingMembers, pendingFees, invite, disputes] = await Promise.all([
    prisma.user.count({ where: { role: "PENDING" } }),
    prisma.feeDue.count({ where: { status: "SUBMITTED" } }),
    // Only a code that still works; revoked or used-up codes are not shown.
    prisma.invite.findFirst({
      where: {
        type: "CLUB",
        remainingUses: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.match.findMany({
      where: { status: "DISPUTED" },
      orderBy: { playedAt: "desc" },
      include: {
        players: {
          include: { user: { select: { name: true, profile: { select: { nickname: true } } } } },
        },
      },
    }),
  ]);

  const links = [
    { href: "/club/members", title: "Members", desc: `${pendingMembers} pending approval` },
    { href: "/club/iuran", title: "Iuran", desc: `${pendingFees} bukti menunggu` },
    { href: "/club/jadwal", title: "Agenda", desc: "Latihan rutin, sparring, turnamen & event" },
    { href: "/club/export", title: "Export CSV", desc: "Laporan iuran" },
  ];

  return (
    <>
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-ink">
          Operations
        </p>
        <h1 className="text-2xl font-black text-navy">Club Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approve members, iuran, jadwal & events
        </p>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="h-full transition hover:border-accent/40">
              <CardTitle>{l.title}</CardTitle>
              <p className="mt-1 text-xs text-slate-400">{l.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      {disputes.length > 0 && (
        <Card className="mb-4 space-y-3 border-amber-200">
          <CardTitle>Match disputed ({disputes.length})</CardTitle>
          {disputes.map((m) => {
            const name = (p: (typeof m.players)[number]) =>
              p.user.profile?.nickname ?? p.user.name ?? "Player";
            const team = (t: number) =>
              m.players.filter((p) => p.team === t).map(name).join(" & ");
            const winner = m.players.find((p) => p.won)?.team;
            return (
              <div key={m.id} className="space-y-2 rounded-xl bg-cream p-3">
                <p className="text-sm font-semibold text-navy">
                  {team(1)} vs {team(2)} · {m.score}
                </p>
                <p className="text-xs text-slate-500">
                  Tercatat: Team {winner} menang ·{" "}
                  {formatClub(m.playedAt, "d MMM yyyy", { locale: localeId })}
                </p>
                <ResolveDisputeButtons matchId={m.id} />
              </div>
            );
          })}
        </Card>
      )}

      <Card className="mb-4">
        <CardTitle className="mb-2">Invite link</CardTitle>
        <InvitePanel code={invite?.code ?? null} />
      </Card>

      <Card>
        <CardTitle className="mb-2">Pengumuman baru</CardTitle>
        <AnnouncementForm />
      </Card>
    </>
  );
}
