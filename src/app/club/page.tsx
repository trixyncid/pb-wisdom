import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { InvitePanel } from "@/components/club/invite-panel";
import { AnnouncementForm } from "@/components/club/announcement-form";

export default async function ClubPage() {
  const [pendingMembers, pendingFees, invite] = await Promise.all([
    prisma.user.count({ where: { role: "PENDING" } }),
    prisma.feeDue.count({ where: { status: "SUBMITTED" } }),
    prisma.invite.findFirst({
      where: { type: "CLUB" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const links = [
    { href: "/club/members", title: "Members", desc: `${pendingMembers} pending approval` },
    { href: "/club/iuran", title: "Iuran", desc: `${pendingFees} bukti menunggu` },
    { href: "/club/jadwal", title: "Jadwal", desc: "Kelola latihan mingguan" },
    { href: "/club/events", title: "Events", desc: "Buat event & album" },
    { href: "/club/export", title: "Export CSV", desc: "Laporan iuran" },
  ];

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2eb6ea]">
          Operations
        </p>
        <h1 className="text-2xl font-black text-[#0b2a4a]">Club Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approve members, iuran, jadwal & events
        </p>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="h-full transition hover:border-cyan-400/40">
              <CardTitle>{l.title}</CardTitle>
              <p className="mt-1 text-xs text-slate-400">{l.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mb-4">
        <CardTitle className="mb-2">Invite link</CardTitle>
        <InvitePanel code={invite?.code ?? "—"} />
      </Card>

      <Card>
        <CardTitle className="mb-2">Pengumuman baru</CardTitle>
        <AnnouncementForm />
      </Card>
    </AppShell>
  );
}
