import Link from "next/link";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, CheckCircle2, Clock, PartyPopper, Wallet, XCircle } from "lucide-react";
import type { FeeStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { proofUrl } from "@/lib/proof";
import { formatRp, cn } from "@/lib/utils";
import { formatClub, hoursAgo } from "@/lib/time";
import { CopyButton } from "@/components/ui/copy-button";
import { FeeProofForm } from "@/components/profile/fee-proof-form";

const STATUS: Record<FeeStatus, { label: string; tone: string; icon: typeof Clock }> = {
  UNPAID: { label: "Belum bayar", tone: "bg-sand text-navy", icon: Wallet },
  SUBMITTED: { label: "Menunggu verifikasi", tone: "bg-accent-soft text-accent-ink", icon: Clock },
  VERIFIED: { label: "Lunas", tone: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  REJECTED: { label: "Ditolak", tone: "bg-rose-100 text-rose-700", icon: XCircle },
};

// Account numbers in the admin's payment text (8+ digits, spaces or dashes allowed).
const accountNumbers = (text: string) =>
  [...new Set(text.match(/\d[\d\s-]{6,}\d/g)?.map((m) => m.replace(/\D/g, "")).filter((d) => d.length >= 8) ?? [])];

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function IuranPage() {
  const session = await auth();
  if (!session?.user) return null;

  const dues = await prisma.feeDue.findMany({
    where: { userId: session.user.id },
    include: { period: true },
    orderBy: { period: { dueDate: "desc" } },
  });

  const now = hoursAgo(0);
  const open = dues.filter((d) => d.status === "UNPAID" || d.status === "REJECTED");
  const outstanding = open.reduce((sum, d) => sum + d.period.amount, 0);
  const waiting = dues.filter((d) => d.status === "SUBMITTED").length;
  const paid = dues.filter((d) => d.status === "VERIFIED").length;

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="rise" style={rise(0)}>
        <Link href="/profile" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-navy/60 hover:text-navy">
          <ArrowLeft className="size-4" /> Profil
        </Link>
        <h1 className="font-display text-[2.1rem] font-extrabold leading-[1.05] text-navy">Iuran saya</h1>
      </div>

      <section className="rise relative overflow-hidden rounded-[32px] bg-navy p-5 text-white shadow-[0_24px_52px_rgba(14,44,60,0.32)]" style={rise(1)}>
        <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative">
          {outstanding > 0 ? (
            <>
              <p className="text-sm font-semibold text-white/60">Perlu dibayar</p>
              <p className="font-display text-4xl font-extrabold">{formatRp(outstanding)}</p>
              <p className="text-sm text-white/60">{open.length} tagihan</p>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <PartyPopper className="size-9 text-accent" />
              <div>
                <p className="font-display text-2xl font-extrabold">Semua beres!</p>
                <p className="text-sm text-white/60">{waiting ? "Tinggal tunggu admin cek bukti transfermu." : "Tidak ada tagihan yang perlu dibayar."}</p>
              </div>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/[0.07] px-3 py-2.5">
              <p className="font-display text-lg font-extrabold">{waiting}</p>
              <p className="text-xs font-semibold text-white/60">menunggu verifikasi</p>
            </div>
            <div className="rounded-2xl bg-white/[0.07] px-3 py-2.5">
              <p className="font-display text-lg font-extrabold">{paid}</p>
              <p className="text-xs font-semibold text-white/60">sudah lunas</p>
            </div>
          </div>
        </div>
      </section>

      {dues.length === 0 && <p className="px-1 text-sm text-slate-500">Belum ada tagihan iuran.</p>}

      {dues.map((due, i) => {
        const s = STATUS[due.status];
        const Icon = s.icon;
        const payable = due.status === "UNPAID" || due.status === "REJECTED";
        const overdue = payable && due.period.dueDate < now;
        return (
          <article
            key={due.id}
            className={cn("rise flex flex-col gap-3 rounded-[28px] border bg-white/90 p-4 shadow-[0_10px_28px_rgba(14,44,60,0.06)]", payable ? "border-accent/40" : "border-white")}
            style={rise(2 + i)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-navy">{due.period.label}</p>
                <p className={cn("text-xs font-semibold", overdue ? "text-rose-600" : "text-slate-500")}>
                  {overdue ? "Lewat jatuh tempo · " : "Jatuh tempo "}
                  {formatClub(due.period.dueDate, "d MMM yyyy", { locale: localeId })}
                </p>
              </div>
              <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", s.tone)}>
                <Icon className="size-3.5" /> {s.label}
              </span>
            </div>

            <p className="font-display text-2xl font-extrabold text-navy">{formatRp(due.period.amount)}</p>

            {due.rejectReason && due.status === "REJECTED" && (
              <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">Alasan ditolak: {due.rejectReason}</p>
            )}

            {payable && (
              <div className="rounded-2xl bg-cream p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">Cara bayar</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-navy">{due.period.paymentInstructions}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <CopyButton value={String(due.period.amount)} label="Salin nominal" />
                  {accountNumbers(due.period.paymentInstructions).map((n) => (
                    <CopyButton key={n} value={n} label={`Salin ${n}`} />
                  ))}
                </div>
              </div>
            )}

            {due.submittedAt && (
              <a href={proofUrl(due.id, due.submittedAt)} target="_blank" rel="noreferrer" className="block w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proofUrl(due.id, due.submittedAt)} alt="Bukti transfer" loading="lazy" className="max-h-40 rounded-2xl border border-navy/8 object-contain" />
                <span className="mt-1 block text-xs text-slate-500">Dikirim {formatClub(due.submittedAt, "d MMM, HH:mm", { locale: localeId })}</span>
              </a>
            )}

            {payable && <FeeProofForm dueId={due.id} />}
          </article>
        );
      })}
    </div>
  );
}
