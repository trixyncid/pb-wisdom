import Link from "next/link";
import { id as localeId } from "date-fns/locale";
import { ChevronRight, Download, Receipt } from "lucide-react";
import { requireAdminPage } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { proofUrl } from "@/lib/proof";
import { avatarUrl } from "@/lib/avatar";
import { formatClub, hoursAgo } from "@/lib/time";
import { nameOf, person } from "@/lib/people";
import { formatRp, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminHeader } from "@/components/club/admin-header";
import { CreateFeePeriodForm } from "@/components/club/create-fee-period-form";
import { VerifyFeeButtons } from "@/components/club/verify-fee-buttons";

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function ClubIuranPage() {
  await requireAdminPage();
  const [periods, queue] = await Promise.all([
    prisma.feePeriod.findMany({
      orderBy: { dueDate: "desc" },
      select: { id: true, label: true, amount: true, dueDate: true, paymentInstructions: true, dues: { select: { status: true } } },
    }),
    prisma.feeDue.findMany({
      where: { status: "SUBMITTED" },
      select: { id: true, submittedAt: true, period: { select: { label: true, amount: true } }, user: { select: person } },
      orderBy: { submittedAt: "asc" },
    }),
  ]);
  const now = hoursAgo(0);
  let i = 2;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <AdminHeader title="Iuran" desc="Buka periode, cek bukti transfer dan catat pembayaran tunai." />

      <CreateFeePeriodForm lastAmount={periods[0]?.amount} lastInstructions={periods[0]?.paymentInstructions} />

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center justify-between px-1 font-display text-xl font-bold text-navy">
          Bukti menunggu
          {queue.length > 0 && <span className="rounded-full bg-accent px-2.5 py-0.5 text-sm text-navy">{queue.length}</span>}
        </h2>
        {queue.length === 0 && <p className="px-1 text-sm text-slate-500">Tidak ada bukti yang perlu dicek.</p>}
        {queue.map((due) => (
          <article key={due.id} className="rise flex flex-col gap-3 rounded-[26px] border border-accent/40 bg-white/90 p-4 shadow-[0_10px_28px_rgba(14,44,60,0.06)]" style={rise(i++)}>
            <div className="flex items-center gap-3">
              <Avatar className="size-11">
                <AvatarImage src={avatarUrl(due.user.id, due.user.profile?.updatedAt)} alt="" />
                <AvatarFallback className="text-navy">{nameOf(due.user).slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-navy">{nameOf(due.user)}</p>
                <p className="text-xs text-slate-500">
                  {due.period.label} · {formatRp(due.period.amount)}
                  {due.submittedAt && ` · ${formatClub(due.submittedAt, "d MMM HH:mm", { locale: localeId })}`}
                </p>
              </div>
            </div>
            {due.submittedAt && (
              <a href={proofUrl(due.id, due.submittedAt)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proofUrl(due.id, due.submittedAt)} alt={`Bukti transfer ${nameOf(due.user)}`} loading="lazy" className="mx-auto max-h-72 object-contain" />
              </a>
            )}
            <VerifyFeeButtons dueId={due.id} />
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 font-display text-xl font-bold text-navy">Periode</h2>
        {periods.length === 0 && <p className="px-1 text-sm text-slate-500">Belum ada periode iuran.</p>}
        {periods.map((p) => {
          const paid = p.dues.filter((d) => d.status === "VERIFIED").length;
          const waiting = p.dues.filter((d) => d.status === "SUBMITTED").length;
          const unpaid = p.dues.length - paid - waiting;
          const overdue = unpaid > 0 && p.dueDate < now;
          return (
            <div key={p.id} className="rise flex flex-col gap-3 rounded-[26px] border border-white bg-white/90 p-4 shadow-[0_10px_28px_rgba(14,44,60,0.06)]" style={rise(i++)}>
              <Link href={`/club/iuran/${p.id}`} className="group flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink">
                  <Receipt className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-navy">{p.label}</span>
                  <span className={cn("block text-xs", overdue ? "font-semibold text-rose-600" : "text-slate-500")}>
                    {formatRp(p.amount)} · jatuh tempo {formatClub(p.dueDate, "d MMM", { locale: localeId })}
                  </span>
                </span>
                <ChevronRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5" />
              </Link>
              <div className="h-2 overflow-hidden rounded-full bg-sand">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${p.dues.length ? (paid / p.dues.length) * 100 : 0}%` }} />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-navy">
                  {formatRp(paid * p.amount)} <span className="font-normal text-slate-500">· {paid} lunas · {waiting} menunggu · {unpaid} belum</span>
                </span>
                <a href={`/api/export/iuran?periodId=${p.id}`} className="inline-flex shrink-0 items-center gap-1 font-bold text-navy/60 hover:text-navy">
                  <Download className="size-3.5" /> CSV
                </a>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
