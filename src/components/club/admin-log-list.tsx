import Link from "next/link";
import type { AdminLogKind } from "@prisma/client";
import { CalendarDays, ChevronRight, Megaphone, Swords, Users, Wallet } from "lucide-react";
import { avatarUrl } from "@/lib/avatar";
import { formatClub } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const LOG_KINDS: Record<AdminLogKind, { label: string; icon: typeof Users; tone: string }> = {
  MEMBER: { label: "Member", icon: Users, tone: "bg-sand text-navy" },
  IURAN: { label: "Iuran", icon: Wallet, tone: "bg-accent-soft text-accent-ink" },
  AGENDA: { label: "Agenda", icon: CalendarDays, tone: "bg-emerald-100 text-emerald-700" },
  MATCH: { label: "Match", icon: Swords, tone: "bg-navy text-accent" },
  CLUB: { label: "Klub", icon: Megaphone, tone: "bg-rose-100 text-rose-600" },
};

export type LogEntry = {
  id: string;
  kind: AdminLogKind;
  summary: string;
  href: string | null;
  createdAt: Date;
  actor: { id: string; name: string | null; profile: { nickname: string; updatedAt: Date } | null } | null;
};

/** One activity log line: who, what, when; tappable when it points somewhere. */
export function AdminLogRow({ entry, showDate = false }: { entry: LogEntry; showDate?: boolean }) {
  const kind = LOG_KINDS[entry.kind];
  const who = entry.actor ? (entry.actor.profile?.nickname ?? entry.actor.name ?? "Admin") : "Admin lama";
  const body = (
    <>
      <span className="relative shrink-0">
        <Avatar className="size-10">
          {entry.actor && <AvatarImage src={avatarUrl(entry.actor.id, entry.actor.profile?.updatedAt)} alt="" />}
          <AvatarFallback className="text-navy">{who.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <span className={cn("absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full ring-2 ring-white", kind.tone)}>
          <kind.icon className="size-3" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-navy">
          <span className="font-bold">{who}</span> · {entry.summary}
        </span>
        <span className="block text-[11px] text-slate-400">
          {kind.label} · {formatClub(entry.createdAt, showDate ? "d MMM, HH:mm" : "HH:mm")}
        </span>
      </span>
      {entry.href && <ChevronRight className="mt-2.5 size-4 shrink-0 text-slate-300" />}
    </>
  );
  const cls = "flex items-start gap-3 rounded-[20px] p-2.5";
  return entry.href ? (
    <Link href={entry.href} className={cn(cls, "transition hover:bg-cream")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
