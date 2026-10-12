import Link from "next/link";
import { id as localeId } from "date-fns/locale";
import { BellOff, CalendarDays, ChevronRight, Info, Megaphone, Trophy, Wallet } from "lucide-react";
import type { NotificationType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/demo/mode";
import { formatClub, hoursAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { RefreshOnMount } from "@/components/layout/refresh-on-mount";

const TYPE: Record<NotificationType, { icon: typeof Info; tone: string }> = {
  IURAN: { icon: Wallet, tone: "bg-accent-soft text-accent-ink" },
  EVENT: { icon: CalendarDays, tone: "bg-sand text-navy" },
  MATCH: { icon: Trophy, tone: "bg-navy text-accent" },
  ANNOUNCEMENT: { icon: Megaphone, tone: "bg-rose-100 text-rose-600" },
  SYSTEM: { icon: Info, tone: "bg-slate-100 text-slate-600" },
};

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Mark as read directly: an action here would call revalidatePath during
  // render, which Next rejects. The list above was fetched before this update,
  // so this visit still shows which ones are new.
  const unread = notifications.filter((n) => !n.read).length;
  const markedRead = !isDemoMode() && unread > 0;
  if (markedRead) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
  }

  const now = hoursAgo(0);
  const today = formatClub(now, "yyyy-MM-dd");
  const yesterday = formatClub(hoursAgo(24), "yyyy-MM-dd");
  const dayLabel = (d: Date) => {
    const key = formatClub(d, "yyyy-MM-dd");
    return key === today ? "Hari ini" : key === yesterday ? "Kemarin" : formatClub(d, "EEEE, d MMM", { locale: localeId });
  };
  const groups: { label: string; items: typeof notifications }[] = [];
  for (const n of notifications) {
    const label = dayLabel(n.createdAt);
    const last = groups.at(-1);
    if (last?.label === label) last.items.push(n);
    else groups.push({ label, items: [n] });
  }
  let i = 1;

  return (
    <div className="flex flex-col gap-5 pt-2">
      {markedRead && <RefreshOnMount />}
      <div className="rise" style={rise(0)}>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent-ink">Inbox</p>
        <h1 className="font-display mt-1 text-[2.1rem] font-extrabold leading-[1.05] text-navy">Notifikasi</h1>
        {unread > 0 && <p className="mt-1 text-sm text-slate-500">{unread} baru</p>}
      </div>

      {notifications.length === 0 && (
        <div className="rise flex flex-col items-center gap-2 rounded-[28px] border border-white bg-white/90 px-6 py-10 text-center shadow-[0_10px_28px_rgba(14,44,60,0.06)]" style={rise(1)}>
          <span className="flex size-14 items-center justify-center rounded-full bg-sand text-navy">
            <BellOff className="size-6" />
          </span>
          <p className="font-display text-lg font-bold text-navy">Belum ada notifikasi</p>
          <p className="text-sm text-slate-500">Info iuran, jadwal dan hasil match akan muncul di sini.</p>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.label} className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{g.label}</h2>
          <ul className="flex flex-col gap-2">
            {g.items.map((n) => {
              const t = TYPE[n.type];
              const Icon = t.icon;
              const body = (
                <>
                  <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", t.tone)}>
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-navy">{n.title}</span>
                      {!n.read && <span className="size-2 shrink-0 rounded-full bg-accent" aria-label="baru" />}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-600">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-slate-400">{formatClub(n.createdAt, "HH:mm")}</span>
                  </span>
                  {n.href && <ChevronRight className="mt-3 size-4 shrink-0 text-slate-300" />}
                </>
              );
              const cls = cn(
                "flex items-start gap-3 rounded-[24px] border p-3.5 shadow-[0_8px_22px_rgba(14,44,60,0.05)] transition",
                n.read ? "border-white bg-white/90" : "border-accent/40 bg-accent-soft/60",
              );
              return (
                <li key={n.id} className="rise" style={rise(i++)}>
                  {n.href ? (
                    <Link href={n.href} className={cn(cls, "hover:bg-cream active:scale-[0.99]")}>
                      {body}
                    </Link>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
