import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Bell, ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { markNotificationsReadAction } from "@/actions/ops";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  await markNotificationsReadAction().catch(() => null);

  return (
    <AppShell>
      <div className="mb-5 flex items-center gap-3 pr-14">
        <Link
          href="/"
          className="rounded-full bg-white p-2 shadow-sm text-[#0b2a4a]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2eb6ea]">
            Inbox
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-black text-[#0b2a4a]">
            <Bell className="h-6 w-6 text-[#2eb6ea]" />
            Notifikasi
          </h1>
        </div>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500">Belum ada notifikasi</p>
          </Card>
        )}
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={`space-y-1 ${n.read ? "" : "border-[#2eb6ea]/40 bg-[#e8f3fb]"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-[#0b2a4a]">{n.title}</p>
              <Badge className="shrink-0 normal-case tracking-normal">
                {n.type}
              </Badge>
            </div>
            <p className="text-sm text-slate-600">{n.body}</p>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-400">
                {formatDistanceToNow(n.createdAt, {
                  addSuffix: true,
                  locale: localeId,
                })}
              </p>
              {n.href && (
                <Link href={n.href} className="text-xs font-bold text-[#2eb6ea]">
                  Buka
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
